const express = require('express');

const { pool } = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function safeJsonParse(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

// GET /api/dashboard/me
router.get('/me', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    // Expire old active subscriptions first
    await connection.execute(
      `
      UPDATE user_plan_subscriptions
      SET status = 'expired',
          updated_at = NOW()
      WHERE user_id = ?
        AND status = 'active'
        AND expires_at <= NOW()
      `,
      [userId]
    );

    const [subscriptionRows] = await connection.execute(
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

        p.name AS plan_name,
        p.price_inr,
        p.currency,
        p.billing_interval,
        p.validity_days,
        p.results_per_search,
        p.description,
        p.features,
        p.cta_label,

        ak.\`key\` AS api_key,
        ak.is_active AS api_key_active,
        ak.total_usage AS api_key_total_usage
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

    const subscription = subscriptionRows[0] || null;

    const [totalRows] = await connection.execute(
      `
      SELECT
        COUNT(*) AS total_searches,
        COALESCE(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END), 0) AS successful_searches,
        COALESCE(SUM(CASE WHEN status IN ('not_found', 'error') THEN 1 ELSE 0 END), 0) AS failed_searches,
        COALESCE(SUM(CASE WHEN consumed_token = 1 THEN 1 ELSE 0 END), 0) AS consumed_searches
      FROM patent_search_logs
      WHERE user_id = ?
      `,
      [userId]
    );

    const totals = totalRows[0] || {};

    const [recentRows] = await connection.execute(
      `
      SELECT
        id,
        patent_number,
        status,
        consumed_token,
        created_at
      FROM patent_search_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 10
      `,
      [userId]
    );

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          user: req.user,
          active_plan: false,
          plan: null,
          api_key: null,
          totals: {
            total_searches: Number(totals.total_searches || 0),
            successful_searches: Number(totals.successful_searches || 0),
            failed_searches: Number(totals.failed_searches || 0),
            consumed_searches: Number(totals.consumed_searches || 0),
            reports_saved: 0,
          },
          recent_searches: recentRows,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        user: req.user,
        active_plan: true,

        plan: {
          id: subscription.plan_id,
          subscription_id: subscription.subscription_id,
          code: subscription.plan_code,
          name: subscription.plan_name,
          price_inr: Number(subscription.price_inr || 0),
          currency: subscription.currency,
          billing_interval: subscription.billing_interval,
          validity_days: subscription.validity_days,
          results_per_search: subscription.results_per_search,
          description: subscription.description,
          features: safeJsonParse(subscription.features),

          starts_at: subscription.starts_at,
          expires_at: subscription.expires_at,
          search_limit: Number(subscription.search_limit || 0),
          searches_used: Number(subscription.searches_used || 0),
          searches_remaining: Number(subscription.searches_remaining || 0),
        },

        api_key: {
          id: subscription.api_key_id,
          key: subscription.api_key,
          is_active: Boolean(subscription.api_key_active),
          total_usage: Number(subscription.api_key_total_usage || 0),
        },

        totals: {
          total_searches: Number(totals.total_searches || 0),
          successful_searches: Number(totals.successful_searches || 0),
          failed_searches: Number(totals.failed_searches || 0),
          consumed_searches: Number(totals.consumed_searches || 0),
          reports_saved: 0,
        },

        recent_searches: recentRows.map((row) => ({
          id: row.id,
          patent_number: row.patent_number,
          status: row.status,
          consumed_token: Boolean(row.consumed_token),
          created_at: row.created_at,
        })),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;