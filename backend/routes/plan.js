const express = require('express');
const crypto = require('crypto');

const { pool } = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function createApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 30));
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function safeJsonParse(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function formatPlan(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    price_inr: Number(row.price_inr || 0),
    currency: row.currency,
    billing_interval: row.billing_interval,
    validity_days: row.validity_days,
    search_limit: row.search_limit,
    results_per_search: row.results_per_search,
    free_once_per_user: Boolean(row.free_once_per_user),
    description: row.description,
    features: safeJsonParse(row.features),
    cta_label: row.cta_label,
    is_active: Boolean(row.is_active),
    sort_order: row.sort_order,
  };
}

// GET /api/plans
// Public route: frontend pricing section can fetch plans without login.
router.get('/', async (_req, res) => {
  const connection = await pool.getConnection();

  try {
    const [plans] = await connection.execute(
      `
      SELECT
        id,
        code,
        name,
        price_inr,
        currency,
        billing_interval,
        validity_days,
        search_limit,
        results_per_search,
        free_once_per_user,
        description,
        features,
        cta_label,
        is_active,
        sort_order
      FROM plans
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
      `
    );

    return res.json({
      success: true,
      data: plans.map(formatPlan),
    });
  } catch (err) {
    console.error('Get plans error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plans.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

// GET /api/plans/me
// Logged-in user current active plan/subscription.
router.get('/me', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    const [rows] = await connection.execute(
      `
      SELECT
        ups.id AS subscription_id,
        ups.user_id,
        ups.plan_id,
        ups.api_key_id,
        ups.plan_code,
        ups.status,
        ups.starts_at,
        ups.expires_at,
        ups.search_limit,
        ups.searches_used,
        GREATEST(ups.search_limit - ups.searches_used, 0) AS searches_remaining,

        p.name,
        p.price_inr,
        p.currency,
        p.billing_interval,
        p.validity_days,
        p.results_per_search,
        p.description,
        p.features,
        p.cta_label,

        ak.\`key\` AS api_key
      FROM user_plan_subscriptions ups
      LEFT JOIN plans p ON p.id = ups.plan_id
      LEFT JOIN api_keys ak ON ak.id = ups.api_key_id
      WHERE ups.user_id = ?
        AND ups.status = 'active'
        AND ups.expires_at > NOW()
      ORDER BY ups.id DESC
      LIMIT 1
      `,
      [userId]
    );

    const subscription = rows[0];

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          active: false,
          plan: null,
          subscription: null,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        active: true,
        plan: {
          id: subscription.plan_id,
          code: subscription.plan_code,
          name: subscription.name,
          price_inr: Number(subscription.price_inr || 0),
          currency: subscription.currency,
          billing_interval: subscription.billing_interval,
          validity_days: subscription.validity_days,
          results_per_search: subscription.results_per_search,
          description: subscription.description,
          features: safeJsonParse(subscription.features),
          cta_label: subscription.cta_label,
        },
        subscription: {
          id: subscription.subscription_id,
          status: subscription.status,
          starts_at: subscription.starts_at,
          expires_at: subscription.expires_at,
          search_limit: subscription.search_limit,
          searches_used: subscription.searches_used,
          searches_remaining: subscription.searches_remaining,
        },
        api_key: subscription.api_key,
      },
    });
  } catch (err) {
    console.error('Get my plan error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current plan.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/plans/select
// Body: { "plan_code": "free" } or { "plan_code": "pro" }
router.post('/select', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const planCode = String(req.body.plan_code || req.body.code || '').trim().toLowerCase();

    if (!planCode) {
      return res.status(400).json({
        success: false,
        message: 'plan_code is required.',
      });
    }

    await connection.beginTransaction();

    const [planRows] = await connection.execute(
      `
      SELECT
        id,
        code,
        name,
        price_inr,
        currency,
        billing_interval,
        validity_days,
        search_limit,
        results_per_search,
        free_once_per_user,
        description,
        features,
        cta_label,
        is_active
      FROM plans
      WHERE code = ?
        AND is_active = 1
      LIMIT 1
      `,
      [planCode]
    );

    const plan = planRows[0];

    if (!plan) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Plan not found or inactive.',
      });
    }

    // Free plan can be claimed only once.
    if (Number(plan.free_once_per_user) === 1) {
      const [claimedRows] = await connection.execute(
        `
        SELECT id
        FROM user_plan_subscriptions
        WHERE user_id = ?
          AND plan_code = ?
        LIMIT 1
        `,
        [userId, plan.code]
      );

      if (claimedRows.length > 0) {
        await connection.rollback();

        return res.status(403).json({
          success: false,
          message: 'Free plan has already been used. Please upgrade your plan.',
        });
      }
    }

    const expiresAt = addDays(plan.validity_days);
    const usageResetAt = endOfToday();

    // Cancel previous active subscriptions. Only one active plan at a time.
    await connection.execute(
      `
      UPDATE user_plan_subscriptions
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE user_id = ?
        AND status = 'active'
      `,
      [userId]
    );

    // Reuse existing active API key if user already has one.
    const [apiKeyRows] = await connection.execute(
      `
      SELECT id, \`key\`
      FROM api_keys
      WHERE user_id = ?
        AND is_active = 1
      ORDER BY id DESC
      LIMIT 1
      `,
      [userId]
    );

    let apiKeyId;
    let apiKey;

    if (apiKeyRows[0]) {
      apiKeyId = apiKeyRows[0].id;
      apiKey = apiKeyRows[0].key;

      await connection.execute(
        `
        UPDATE api_keys
        SET plan = ?,
            expires_at = ?,
            usage_today = 0,
            usage_reset_at = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
        [plan.code, expiresAt, usageResetAt, apiKeyId]
      );
    } else {
      apiKey = createApiKey();

      const [apiKeyResult] = await connection.execute(
        `
        INSERT INTO api_keys
          (user_id, \`key\`, plan, is_active, expires_at, usage_today, usage_reset_at, total_usage, created_at, updated_at)
        VALUES
          (?, ?, ?, 1, ?, 0, ?, 0, NOW(), NOW())
        `,
        [userId, apiKey, plan.code, expiresAt, usageResetAt]
      );

      apiKeyId = apiKeyResult.insertId;
    }

    const [subscriptionResult] = await connection.execute(
      `
      INSERT INTO user_plan_subscriptions
        (
          user_id,
          plan_id,
          api_key_id,
          plan_code,
          status,
          starts_at,
          expires_at,
          search_limit,
          searches_used,
          free_claimed,
          created_at,
          updated_at
        )
      VALUES
        (?, ?, ?, ?, 'active', NOW(), ?, ?, 0, ?, NOW(), NOW())
      `,
      [
        userId,
        plan.id,
        apiKeyId,
        plan.code,
        expiresAt,
        plan.search_limit,
        Number(plan.free_once_per_user) === 1 ? 1 : 0,
      ]
    );

    await connection.execute(
      `
      UPDATE users_tables
      SET plan = ?,
          plan_expires_at = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [plan.code, expiresAt, userId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: `${plan.name} plan activated successfully.`,
      data: {
        plan: formatPlan(plan),
        subscription: {
          id: subscriptionResult.insertId,
          status: 'active',
          starts_at: new Date(),
          expires_at: expiresAt,
          search_limit: plan.search_limit,
          searches_used: 0,
          searches_remaining: plan.search_limit,
        },
        api_key: apiKey,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          plan: plan.code,
          plan_expires_at: expiresAt,
        },
      },
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error('Select plan error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to select plan.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;