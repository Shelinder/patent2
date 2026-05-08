const axios = require("axios");
const cheerio = require("cheerio");

function normalizePatentNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMeta($, name) {
  return (
    $(`meta[name="${name}"]`).attr("content") ||
    $(`meta[property="${name}"]`).attr("content") ||
    ""
  );
}

function getAllMeta($, name) {
  return $(`meta[name="${name}"]`)
    .map((_, el) => cleanText($(el).attr("content")))
    .get()
    .filter(Boolean);
}

function getSectionText($, selector) {
  return cleanText($(selector).first().text());
}

function getSectionParagraphs($, selector) {
  return $(selector)
    .find("p, li")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 300);
}

function getClaimsParagraphs($) {
  const selectors = [
    'section[itemprop="claims"] .claim-text',
    'section[itemprop="claims"] div.claim',
    'section[itemprop="claims"] div',
    '.claim-text',
    'claim-text',
  ];

  const claims = [];

  selectors.forEach((selector) => {
    $(selector).each((_, el) => {
      const text = cleanText($(el).text());

      if (text && text.length > 20) {
        claims.push(text);
      }
    });
  });

  return claims
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 100);
}

function getItempropTexts($, itemprop) {
  return $(`[itemprop="${itemprop}"]`)
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);
}

function uniqueClean(values) {
  return values
    .map(cleanText)
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function getPdfLink($) {
  const metaPdf = getMeta($, "citation_pdf_url");

  if (metaPdf) return metaPdf;

  const pdfHref = $('a[href$=".pdf"]').first().attr("href");

  if (!pdfHref) return null;

  if (pdfHref.startsWith("//")) return `https:${pdfHref}`;
  if (pdfHref.startsWith("/")) return `https://patents.google.com${pdfHref}`;

  return pdfHref;
}

function getPatentImages($) {
  return $("img")
    .map((_, img) => {
      const src = $(img).attr("src") || "";

      if (!src) return null;
      if (src.startsWith("//")) return `https:${src}`;
      if (src.startsWith("/")) return `https://patents.google.com${src}`;

      return src;
    })
    .get()
    .filter(Boolean)
    .filter((src) => src.includes("patentimages"))
    .filter((src, index, arr) => arr.indexOf(src) === index)
    .slice(0, 50);
}

function getClassifications($) {
  const values = [];

  $("li[itemprop='classifications'], span[itemprop='Code'], span[itemprop='Leaf']").each((_, el) => {
    const text = cleanText($(el).text());

    if (text) {
      values.push({ text });
    }
  });

  return values
    .filter((item, index, arr) => arr.findIndex((x) => x.text === item.text) === index)
    .slice(0, 100);
}

async function fetchGooglePatent(patentNumber) {
  const normalizedPatentNumber = normalizePatentNumber(patentNumber);

  if (!normalizedPatentNumber) {
    return null;
  }

  const url = `https://patents.google.com/patent/${encodeURIComponent(
    normalizedPatentNumber
  )}/en?oq=${encodeURIComponent(normalizedPatentNumber)}`;

  const response = await axios.get(url, {
    timeout: Number(process.env.GOOGLE_PATENTS_TIMEOUT_MS || 15000),
    maxRedirects: 3,
    validateStatus: (status) => status >= 200 && status < 500,
    headers: {
      "User-Agent":
        process.env.GOOGLE_PATENTS_USER_AGENT ||
        "Mozilla/5.0 PatentApp/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (response.status === 404 || !response.data) {
    return null;
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Google Patents returned HTTP ${response.status}`);
  }

  const $ = cheerio.load(response.data);

  const title =
    cleanText(getMeta($, "DC.title")) ||
    cleanText(getMeta($, "citation_title")) ||
    cleanText($("h1").first().text());

  const publicationNumber =
    normalizePatentNumber(getMeta($, "citation_patent_publication_number")) ||
    normalizedPatentNumber;

  const abstractText =
    getSectionText($, 'section[itemprop="abstract"]') ||
    cleanText($(".abstract").first().text()) ||
    cleanText(getMeta($, "description"));

  const descriptionParagraphs = getSectionParagraphs(
    $,
    'section[itemprop="description"], section.description'
  );

  const claimsParagraphs = getClaimsParagraphs($);

  const inventors = uniqueClean([
  ...getAllMeta($, "citation_inventor"),
  ...getItempropTexts($, "inventor"),
]);

const assignees = uniqueClean([
  ...getAllMeta($, "citation_assignee"),
  ...getItempropTexts($, "assigneeOriginal"),
  ...getItempropTexts($, "assigneeCurrent"),
  ...getItempropTexts($, "assignee"),
]);

  const pdfLink = getPdfLink($);
  const images = getPatentImages($);
  const classifications = getClassifications($);

  if (!title && !abstractText && !pdfLink && !descriptionParagraphs.length) {
    return null;
  }

  return {
    patent_number: publicationNumber,
    pdf_link: pdfLink,
    abstract_text: abstractText || null,
    description: [
      {
        section: "TITLE",
        paragraphs: title ? [title] : [],
      },
      {
        section: "ABSTRACT",
        paragraphs: abstractText ? [abstractText] : [],
      },
      {
        section: "DESCRIPTION",
        paragraphs: descriptionParagraphs,
      },
      {
        section: "CLAIMS",
        paragraphs: claimsParagraphs,
      },
      {
        section: "GOOGLE_PATENTS_SOURCE",
        paragraphs: [url],
      },
    ],
    classifications,
    landscapes: [
      {
        name: "Inventors",
        values: inventors,
      },
      {
        name: "Assignees",
        values: assignees,
      },
    ],
    images,
  };
}

module.exports = {
  fetchGooglePatent,
};