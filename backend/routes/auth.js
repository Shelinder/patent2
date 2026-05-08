const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { pool } = require('../config/db');
const { sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function createJwt(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      plan: user.plan,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    plan_expires_at: user.plan_expires_at,
  };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

async function getOrCreateApiKey(connection, user) {
  const [existingRows] = await connection.execute(
    `
    SELECT
      id,
      \`key\`,
      plan,
      is_active,
      expires_at,
      usage_today,
      usage_reset_at
    FROM api_keys
    WHERE user_id = ?
      AND is_active = 1
    ORDER BY id DESC
    LIMIT 1
    `,
    [user.id]
  );

  if (existingRows[0]) {
    return existingRows[0];
  }

  const key = createApiKey();

  const resetAt = new Date();
  resetAt.setHours(23, 59, 59, 999);

  await connection.execute(
    `
    INSERT INTO api_keys
      (user_id, \`key\`, plan, is_active, expires_at, usage_today, usage_reset_at, total_usage, created_at, updated_at)
    VALUES
      (?, ?, ?, 1, NULL, 0, ?, 0, NOW(), NOW())
    `,
    [user.id, key, user.plan || 'free', resetAt]
  );

  const [rows] = await connection.execute(
    `
    SELECT
      id,
      \`key\`,
      plan,
      is_active,
      expires_at,
      usage_today,
      usage_reset_at
    FROM api_keys
    WHERE \`key\` = ?
    LIMIT 1
    `,
    [key]
  );

  return rows[0];
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
      SELECT id
      FROM users_tables
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (existingRows.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      `
      INSERT INTO users_tables
        (name, email, password, plan, plan_expires_at, created_at, updated_at)
      VALUES
        (?, ?, ?, 'free', NULL, NOW(), NOW())
      `,
      [name, email, hashedPassword]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      password: hashedPassword,
      plan: 'free',
      plan_expires_at: null,
    };

    const apiKey = await getOrCreateApiKey(connection, user);

    await connection.commit();

    const token = createJwt(user);

    return res.status(201).json({
      success: true,
      message: 'Signup successful.',
      token,
      user: publicUser(user),
      api_key: apiKey.key,
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error('Signup error:', err);

    return res.status(500).json({
      success: false,
      message: 'Signup failed.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT
        id,
        name,
        email,
        password,
        plan,
        plan_expires_at
      FROM users_tables
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const apiKey = await getOrCreateApiKey(connection, user);
    const token = createJwt(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: publicUser(user),
      api_key: apiKey.key,
    });
  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const genericResponse = {
      success: true,
      message: 'If this email exists, a reset link has been sent.',
    };

    const [users] = await connection.execute(
      `
      SELECT
        id,
        name,
        email
      FROM users_tables
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    const user = users[0];

    if (!user) {
      return res.json(genericResponse);
    }

    await connection.beginTransaction();

    await connection.execute(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW(), updated_at = NOW()
      WHERE user_id = ?
        AND used_at IS NULL
      `,
      [user.id]
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await connection.execute(
      `
      INSERT INTO password_reset_tokens
        (user_id, token_hash, expires_at, used_at, created_at, updated_at)
      VALUES
        (?, ?, ?, NULL, NOW(), NOW())
      `,
      [user.id, tokenHash, expiresAt]
    );

    await connection.commit();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?email=${encodeURIComponent(email)}&token=${rawToken}`;

    const mailResult = await sendPasswordResetEmail({
      to: email,
      name: user.name,
      resetUrl,
    });

    return res.json({
      ...genericResponse,
      dev_reset_token: process.env.NODE_ENV === 'production' ? undefined : rawToken,
      mail: process.env.NODE_ENV === 'production' ? undefined : mailResult,
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error('Forgot password error:', err);

    return res.status(500).json({
      success: false,
      message: 'Forgot password failed.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const email = normalizeEmail(req.body.email);
    const token = String(req.body.token || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, token and new password are required.',
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters.',
      });
    }

    await connection.beginTransaction();

    const [users] = await connection.execute(
      `
      SELECT
        id,
        name,
        email,
        plan,
        plan_expires_at
      FROM users_tables
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    const user = users[0];

    if (!user) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    const tokenHash = hashResetToken(token);

    const [tokens] = await connection.execute(
      `
      SELECT
        id,
        user_id,
        expires_at,
        used_at
      FROM password_reset_tokens
      WHERE user_id = ?
        AND token_hash = ?
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY id DESC
      LIMIT 1
      `,
      [user.id, tokenHash]
    );

    const resetToken = tokens[0];

    if (!resetToken) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.execute(
      `
      UPDATE users_tables
      SET password = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [hashedPassword, user.id]
    );

    await connection.execute(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW(), updated_at = NOW()
      WHERE id = ?
      `,
      [resetToken.id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Password reset successful. You can login with your new password.',
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error('Reset password error:', err);

    return res.status(500).json({
      success: false,
      message: 'Reset password failed.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;