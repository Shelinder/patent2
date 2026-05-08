const { pool } = require('../config/db');

const PLAN_LIMITS = {
  free: {
    requests_per_day: 10,
    results_per_call: 5,
  },
  pro: {
    requests_per_day: 500,
    results_per_call: 20,
  },
  enterprise: {
    requests_per_day: 5000,
    results_per_call: 100,
  },
};

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

module.exports = async function auth(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const rawKey = req.headers['x-api-key'] || req.query.api_key;
    const key = typeof rawKey === 'string' ? rawKey.trim() : rawKey;

    if (!key) {
      return res.status(401).json({
        success: false,
        message: 'API key missing.',
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT
        id,
        user_id,
        \`key\`,
        plan,
        is_active,
        expires_at,
        usage_today,
        usage_reset_at,
        total_usage
      FROM api_keys
      WHERE \`key\` = ?
      LIMIT 1
      `,
      [key]
    );

    const apiKey = rows[0];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key.',
      });
    }

    if (!apiKey.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Key deactivated.',
      });
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Plan expired. Please renew.',
      });
    }

    const plan = apiKey.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    let usageToday = Number(apiKey.usage_today || 0);
    let usageResetAt = apiKey.usage_reset_at ? new Date(apiKey.usage_reset_at) : null;

    if (!usageResetAt || new Date() > usageResetAt) {
      usageToday = 0;
      usageResetAt = endOfToday();
    }

    if (usageToday >= limits.requests_per_day) {
      return res.status(429).json({
        success: false,
        message: `Daily limit of ${limits.requests_per_day} reached for "${plan}" plan.`,
        resets_at: usageResetAt,
      });
    }

    usageToday += 1;

    await connection.execute(
      `
      UPDATE api_keys
      SET
        usage_today = ?,
        usage_reset_at = ?,
        total_usage = COALESCE(total_usage, 0) + 1,
        updated_at = NOW()
      WHERE id = ?
      `,
      [usageToday, usageResetAt, apiKey.id]
    );

    req.apiKey = {
      ...apiKey,
      usage_today: usageToday,
      usage_reset_at: usageResetAt,
      limits,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  } finally {
    connection.release();
  }
};

module.exports.PLAN_LIMITS = PLAN_LIMITS;