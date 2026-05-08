const express = require('express');

const { pool } = require('../config/db');
const requireAuth = require('../middleware/requireAuth');
const { fetchGooglePatent } = require("../utils/googlePatentScraper");

const router = express.Router();


function normalizePatentNumber(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function escapeLike(value) {
  return String(value || '').replace(/[\\%_]/g, '\\$&');
}

function parsePositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function looksLikePatentNumber(query) {
  const normalized = normalizePatentNumber(query);
  return /^[A-Z]{1,4}[0-9][A-Z0-9/-]*$/.test(normalized);
}

// function compactPatent(row) {
//   return {
//     id: row.id,
//     patent_number: row.patent_number,
//     country: row.country,
//     doc_number: row.doc_number,
//     kind: row.kind,
//     date_publ: row.date_publ,
//     title_en: row.title_en,
//     abstract_en: row.abstract_en,
//     applicants: row.applicants,
//     inventors: row.inventors,
//     cpc: row.cpc,
//     ipc: row.ipc,
//     created_at: row.created_at,
//     updated_at: row.updated_at,
//   };
// }

function compactPatent(row) {
  return formatPatentForFrontend(row);
}

async function logPatentSearch(connection, {
  userId,
  apiKeyId = null,
  subscriptionId = null,
  patentNumber,
  status,
  consumedToken = 0,
}) {
  await connection.execute(
    `
    INSERT INTO patent_search_logs
      (
        user_id,
        api_key_id,
        subscription_id,
        patent_number,
        status,
        consumed_token,
        created_at
      )
    VALUES
      (?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      userId,
      apiKeyId,
      subscriptionId,
      patentNumber,
      status,
      consumedToken ? 1 : 0,
    ]
  );
}

async function getActiveSubscription(connection, userId) {
  const [rows] = await connection.execute(
    `
    SELECT
      ups.id,
      ups.user_id,
      ups.plan_id,
      ups.api_key_id,
      ups.plan_code,
      ups.status,
      ups.expires_at,
      ups.search_limit,
      ups.searches_used,
      ak.\`key\` AS api_key
    FROM user_plan_subscriptions ups
    LEFT JOIN api_keys ak ON ak.id = ups.api_key_id
    WHERE ups.user_id = ?
      AND ups.status = 'active'
      AND ups.expires_at > NOW()
    ORDER BY ups.id DESC
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

async function getLockedActiveSubscription(connection, userId) {
  const [rows] = await connection.execute(
    `
    SELECT
      ups.id,
      ups.user_id,
      ups.plan_id,
      ups.api_key_id,
      ups.plan_code,
      ups.status,
      ups.expires_at,
      ups.search_limit,
      ups.searches_used,
      ak.\`key\` AS api_key
    FROM user_plan_subscriptions ups
    LEFT JOIN api_keys ak ON ak.id = ups.api_key_id
    WHERE ups.user_id = ?
      AND ups.status = 'active'
      AND ups.expires_at > NOW()
    ORDER BY ups.id DESC
    LIMIT 1
    FOR UPDATE
    `,
    [userId]
  );

  return rows[0] || null;
}

function getUsageMeta(subscription, consumedToken = false) {
  const searchLimit = Number(subscription.search_limit || 0);
  const searchesUsed = Number(subscription.searches_used || 0);
  const searchesRemaining = Math.max(searchLimit - searchesUsed, 0);

  return {
    plan_code: subscription.plan_code,
    search_limit: searchLimit,
    searches_used: searchesUsed,
    searches_remaining: searchesRemaining,
    consumed_token: Boolean(consumedToken),
  };
}

function canSearch(subscription) {
  const searchLimit = Number(subscription.search_limit || 0);
  const searchesUsed = Number(subscription.searches_used || 0);
  return Math.max(searchLimit - searchesUsed, 0) > 0;
}

async function consumeSuccessfulSearch(connection, subscription) {
  const searchLimit = Number(subscription.search_limit || 0);
  const searchesUsed = Number(subscription.searches_used || 0);
  const updatedSearchesUsed = searchesUsed + 1;
  const updatedSearchesRemaining = Math.max(searchLimit - updatedSearchesUsed, 0);

  await connection.execute(
    `
    UPDATE user_plan_subscriptions
    SET searches_used = searches_used + 1,
        updated_at = NOW()
    WHERE id = ?
    `,
    [subscription.id]
  );

  await connection.execute(
    `
    UPDATE api_keys
    SET total_usage = COALESCE(total_usage, 0) + 1,
        usage_today = COALESCE(usage_today, 0) + 1,
        updated_at = NOW()
    WHERE id = ?
    `,
    [subscription.api_key_id]
  );

  return {
    plan_code: subscription.plan_code,
    search_limit: searchLimit,
    searches_used: updatedSearchesUsed,
    searches_remaining: updatedSearchesRemaining,
    consumed_token: true,
  };
}

async function consumeAfterResultFound({
  userId,
  patentNumber,
  status,
  rows,
  searchMeta = {},
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const lockedSubscription = await getLockedActiveSubscription(connection, userId);

    if (!lockedSubscription) {
      await connection.rollback();

      return {
        ok: false,
        statusCode: 403,
        response: {
          success: false,
          message: 'No active plan found. Please select a plan first.',
        },
      };
    }

    if (!canSearch(lockedSubscription)) {
      await connection.rollback();

      return {
        ok: false,
        statusCode: 429,
        response: {
          success: false,
          message: 'Search limit consumed. Please upgrade your plan.',
          meta: getUsageMeta(lockedSubscription, false),
        },
      };
    }

    const usageMeta = await consumeSuccessfulSearch(connection, lockedSubscription);

    await logPatentSearch(connection, {
      userId,
      apiKeyId: lockedSubscription.api_key_id,
      subscriptionId: lockedSubscription.id,
      patentNumber,
      status,
      consumedToken: 1,
    });

    await connection.commit();

    return {
      ok: true,
      meta: {
        ...searchMeta,
        ...usageMeta,
      },
    };
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}

    throw err;
  } finally {
    connection.release();
  }
}

async function logNotFoundWithoutToken({ userId, subscription, patentNumber, searchMeta = {} }) {
  const connection = await pool.getConnection();

  try {
    await logPatentSearch(connection, {
      userId,
      apiKeyId: subscription?.api_key_id || null,
      subscriptionId: subscription?.id || null,
      patentNumber,
      status: 'not_found',
      consumedToken: 0,
    });

    return {
      ...searchMeta,
      ...getUsageMeta(subscription, false),
    };
  } finally {
    connection.release();
  }
}


function safeJsonParse(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getTitleFromFulltextDescription(descriptionValue) {
  const description = safeJsonParse(descriptionValue, []);

  if (!Array.isArray(description)) return null;

  const titleSection = description.find(
    (item) => String(item?.section || "").toUpperCase() === "TITLE"
  );

  return titleSection?.paragraphs?.[0] || null;
}

function formatFulltextPatent(row) {
  return {
    id: row.id,
    patent_number: row.patent_number,

    // frontend compatibility
    country: null,
    doc_number: row.patent_number,
    kind: null,
    date_publ: null,
    title_en: getTitleFromFulltextDescription(row.description),
    abstract_en: row.abstract_text,

    // fulltext data
    pdf_link: row.pdf_link,
    abstract_text: row.abstract_text,
    description: safeJsonParse(row.description, []),
    classifications: safeJsonParse(row.classifications, []),
    landscapes: safeJsonParse(row.landscapes, []),
    images: safeJsonParse(row.images, []),

    source_table: "patent_fulltext",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatRecordPatent(row) {
  return {
    id: row.id,
    patent_number: row.patent_number,
    country: row.country,
    doc_number: row.doc_number,
    kind: row.kind,
    date_publ: row.date_publ,
    title_en: row.title_en,
    abstract_en: row.abstract_en,
    applicants: row.applicants,
    inventors: row.inventors,
    cpc: row.cpc,
    ipc: row.ipc,
    source_table: "patent_record",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatPatentForFrontend(row) {
  if (row.source_table === "patent_fulltext") {
    return formatFulltextPatent(row);
  }

  return formatRecordPatent(row);
}

function splitPatentNumber(value) {
  const normalized = normalizePatentNumber(value);

  // Example: US20110282808A1 => country=US, docNumber=20110282808, kind=A1
  const match = normalized.match(/^([A-Z]{1,4})([0-9]+)([A-Z][0-9]?)?$/);

  if (!match) {
    return {
      country: null,
      docNumber: null,
      kind: null,
    };
  }

  return {
    country: match[1] || null,
    docNumber: match[2] || null,
    kind: match[3] || null,
  };
}

async function findPatentRecordByNumber(connection, patentNumber) {
  const normalizedPatentNumber = normalizePatentNumber(patentNumber);

  // 1. Fastest path: uses uq_patent_number
  const [exactRows] = await connection.execute(
    `
    SELECT *, 'patent_record' AS source_table
    FROM patent_record
    WHERE patent_number = ?
    LIMIT 1
    `,
    [normalizedPatentNumber]
  );

  if (exactRows[0]) {
    return exactRows[0];
  }

  // 2. Fast structured lookup: uses country/doc_number/kind index
  const parsed = splitPatentNumber(normalizedPatentNumber);

  if (parsed.country && parsed.docNumber) {
    const params = [parsed.country, parsed.docNumber];
    let kindSql = '';

    if (parsed.kind) {
      kindSql = 'AND kind = ?';
      params.push(parsed.kind);
    }

    const [structuredRows] = await connection.execute(
      `
      SELECT *, 'patent_record' AS source_table
      FROM patent_record
      WHERE country = ?
        AND doc_number = ?
        ${kindSql}
      LIMIT 1
      `,
      params
    );

    if (structuredRows[0]) {
      return structuredRows[0];
    }
  }

  return null;
}

async function findPatentFulltextByNumber(connection, patentNumber) {
  const [rows] = await connection.execute(
    `
    SELECT
      id,
      patent_number,
      pdf_link,
      abstract_text,
      description,
      classifications,
      landscapes,
      images,
      created_at,
      updated_at,
      'patent_fulltext' AS source_table
    FROM patent_fulltext
    WHERE patent_number = ?
    LIMIT 1
    `,
    [patentNumber]
  );

  return rows[0] || null;
}

async function saveGooglePatentToFulltext(connection, patent) {
  const patentNumber = normalizePatentNumber(patent.patent_number);

  await connection.execute(
    `
    INSERT INTO patent_fulltext
      (
        patent_number,
        pdf_link,
        abstract_text,
        description,
        classifications,
        landscapes,
        images,
        created_at,
        updated_at
      )
    VALUES
      (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      pdf_link = VALUES(pdf_link),
      abstract_text = VALUES(abstract_text),
      description = VALUES(description),
      classifications = VALUES(classifications),
      landscapes = VALUES(landscapes),
      images = VALUES(images),
      updated_at = NOW()
    `,
    [
      patentNumber,
      patent.pdf_link || null,
      patent.abstract_text || null,
      JSON.stringify(patent.description || []),
      JSON.stringify(patent.classifications || []),
      JSON.stringify(patent.landscapes || []),
      JSON.stringify(patent.images || []),
    ]
  );

  return findPatentFulltextByNumber(connection, patentNumber);
}


async function findPatentFromDatabaseOnly(patentNumber) {
  const connection = await pool.getConnection();

  try {
    const normalizedPatentNumber = normalizePatentNumber(patentNumber);

    const recordPatent = await findPatentRecordByNumber(connection, normalizedPatentNumber);

    if (recordPatent) {
      return {
        found: true,
        patent: recordPatent,
        source: "patent_record",
      };
    }

    const fulltextPatent = await findPatentFulltextByNumber(connection, normalizedPatentNumber);

    if (fulltextPatent) {
      return {
        found: true,
        patent: fulltextPatent,
        source: "patent_fulltext",
      };
    }

    return {
      found: false,
      patent: null,
      source: null,
    };
  } finally {
    connection.release();
  }
}

async function saveGooglePatentResult(patent) {
  const connection = await pool.getConnection();

  try {
    return saveGooglePatentToFulltext(connection, patent);
  } finally {
    connection.release();
  }
}

async function findPatentWithGoogleFallback(patentNumber) {
  const normalizedPatentNumber = normalizePatentNumber(patentNumber);
  const startedAt = Date.now();

  console.log(`[PATENT LOOKUP] Started: ${normalizedPatentNumber}`);

  const dbStart = Date.now();
  const dbResult = await findPatentFromDatabaseOnly(normalizedPatentNumber);

  console.log(`[PATENT LOOKUP] DB lookup took ${Date.now() - dbStart}ms`);

  if (dbResult.found) {
    console.log(
      `[PATENT LOOKUP] Found in ${dbResult.source} after ${Date.now() - startedAt}ms`
    );

    return dbResult;
  }

  let googlePatent = null;

  try {
    const googleStart = Date.now();

    console.log(`[PATENT LOOKUP] Not found in DB. Trying Google Patents...`);

    googlePatent = await fetchGooglePatent(normalizedPatentNumber);

    console.log(`[PATENT LOOKUP] Google lookup took ${Date.now() - googleStart}ms`);
  } catch (error) {
    console.error(
      `[PATENT LOOKUP] Google Patent fallback failed for ${normalizedPatentNumber}:`,
      error.message
    );

    return {
      found: false,
      patent: null,
      source: "google_patents_error",
    };
  }

  if (!googlePatent) {
    console.log(`[PATENT LOOKUP] Not found anywhere after ${Date.now() - startedAt}ms`);

    return {
      found: false,
      patent: null,
      source: null,
    };
  }

  const saveStart = Date.now();
  const savedPatent = await saveGooglePatentResult(googlePatent);

  console.log(`[PATENT LOOKUP] Save took ${Date.now() - saveStart}ms`);
  console.log(`[PATENT LOOKUP] Total took ${Date.now() - startedAt}ms`);

  return {
    found: true,
    patent: savedPatent,
    source: "google_patents_saved_to_patent_fulltext",
  };
}

// IMPORTANT: keep this route ABOVE /:patent_number
// GET /api/v1/patents/search?q=laptop wireless mouse&page=1&limit=20
router.get('/search', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const rawQuery = String(req.query.q || '').trim();
  const page = parsePositiveInt(req.query.page, 1, 1000);
  const limit = parsePositiveInt(req.query.limit, 20, 50);
  const offset = (page - 1) * limit;

  if (!rawQuery) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required.',
    });
  }

  if (rawQuery.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters.',
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    // Read only. No transaction. No lock.
    const subscription = await getActiveSubscription(connection, userId);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active plan found. Please select a plan first.',
      });
    }

    if (!canSearch(subscription)) {
      return res.status(429).json({
        success: false,
        message: 'Search limit consumed. Please upgrade your plan.',
        meta: getUsageMeta(subscription, false),
      });
    }

    const normalizedQuery = normalizePatentNumber(rawQuery);
    const searchType = looksLikePatentNumber(rawQuery) ? 'patent_number' : 'text';

    let rows = [];
    let total = 0;

    let resultSource = null;

if (searchType === 'patent_number') {
  connection.release();
  connection = null;

  const lookupResult = await findPatentWithGoogleFallback(normalizedQuery);

  if (lookupResult.found) {
  rows = [lookupResult.patent];
  total = 1;
  resultSource = lookupResult.source;
} else {
  rows = [];
  total = 0;
  resultSource = lookupResult.source;
}
}

    if (searchType === 'text') {
      const words = rawQuery
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length >= 2)
        .slice(0, 6);

      if (words.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is too weak. Please enter more specific text.',
        });
      }

      const whereParts = [];
      const params = [];

      words.forEach((word) => {
        const like = `%${escapeLike(word)}%`;

       whereParts.push(
  `
  (
    title_en LIKE ? ESCAPE '\\\\'
    OR abstract_en LIKE ? ESCAPE '\\\\'
    OR patent_number LIKE ? ESCAPE '\\\\'
    OR doc_number LIKE ? ESCAPE '\\\\'
  )
  `
);

params.push(like, like, like, like);
      });

      const whereSql = whereParts.join(' AND ');

     // Do not run COUNT(*) on huge patent table.
// It causes full table scan and timeout.
total = null;

      const safeLimit = Number(limit);
const safeOffset = Number(offset);

const [textRows] = await connection.query(
  `
  SELECT
    id,
    patent_number,
    country,
    doc_number,
    kind,
    date_publ,
    title_en,
    abstract_en,
    applicants,
    inventors,
    cpc,
    ipc,
    created_at,
    updated_at
  FROM patent_record
  WHERE ${whereSql}
  ORDER BY
    CASE
      WHEN title_en LIKE ? ESCAPE '\\\\' THEN 0
      WHEN abstract_en LIKE ? ESCAPE '\\\\' THEN 1
      ELSE 2
    END,
    date_publ DESC,
    id DESC
  LIMIT ${safeLimit}
  OFFSET ${safeOffset}
  `,
  [
    ...params,
    `%${escapeLike(rawQuery)}%`,
    `%${escapeLike(rawQuery)}%`,
  ]
);

rows = textRows;
total = textRows.length;
    }

if (connection) {
  connection.release();
  connection = null;
}

const baseMeta = {
  query: rawQuery,
  search_type: searchType,
  source: resultSource || "database",
  total,
  page,
  limit,
  returned: rows.length,
};

    if (!rows.length) {
      const notFoundMeta = await logNotFoundWithoutToken({
        userId,
        subscription,
        patentNumber: rawQuery,
        searchMeta: {
          ...baseMeta,
          returned: 0,
        },
      });

      return res.status(404).json({
        success: false,
        message: `No patents found for "${rawQuery}".`,
        data: [],
        meta: notFoundMeta,
      });
    }

    const consumeResult = await consumeAfterResultFound({
      userId,
      patentNumber: rawQuery,
      status: 'success',
      rows,
      searchMeta: baseMeta,
    });

    if (!consumeResult.ok) {
      return res.status(consumeResult.statusCode).json(consumeResult.response);
    }

    return res.json({
      success: true,
      data: rows.map(compactPatent),
      meta: consumeResult.meta,
    });
  } catch (err) {
    console.error('Patent search error:', err);

    return res.status(500).json({
      success: false,
      message: 'Patent search failed.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// GET /api/v1/patents/:patent_number
router.get('/:patent_number', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const patentNumber = normalizePatentNumber(req.params.patent_number);

  if (!patentNumber) {
    return res.status(400).json({
      success: false,
      message: 'Patent number is required.',
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    // Read only. No transaction. No lock.
    const subscription = await getActiveSubscription(connection, userId);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active plan found. Please select a plan first.',
      });
    }

    if (!canSearch(subscription)) {
      return res.status(429).json({
        success: false,
        message: 'Search limit consumed. Please upgrade your plan.',
        meta: getUsageMeta(subscription, false),
      });
    }

    connection.release();
connection = null;

const lookupResult = await findPatentWithGoogleFallback(patentNumber);
const patent = lookupResult.patent;
const resultSource = lookupResult.source;

    if (!patent) {
      const notFoundMeta = await logNotFoundWithoutToken({
        userId,
        subscription,
        patentNumber,
      });

      return res.status(404).json({
        success: false,
        message: `Patent "${patentNumber}" not found.`,
        meta: notFoundMeta,
      });
    }

    const consumeResult = await consumeAfterResultFound({
  userId,
  patentNumber,
  status: 'success',
  rows: [patent],
  searchMeta: {
    source: resultSource,
  },
});

    if (!consumeResult.ok) {
      return res.status(consumeResult.statusCode).json(consumeResult.response);
    }

    return res.json({
  success: true,
  data: compactPatent(patent),
  meta: {
    ...consumeResult.meta,
    source: resultSource,
  },
});
  } catch (err) {
    console.error('Patent detail error:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;