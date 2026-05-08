const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

module.exports = async function requireAuth(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const authHeader = req.headers.authorization || '';

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '').trim()
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing.',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing in .env');
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT
        id,
        name,
        email,
        plan,
        plan_expires_at
      FROM users_tables
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      plan_expires_at: user.plan_expires_at,
    };

    next();
  } catch (err) {
    console.error('JWT auth middleware error:', err);

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
};