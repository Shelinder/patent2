const nodemailer = require('nodemailer');

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n========== PASSWORD RESET LINK ==========');
    console.log(`Email: ${to}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=========================================\n');

    return {
      sent: false,
      reason: 'SMTP not configured. Reset link printed in terminal.',
    };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Patent App <no-reply@example.com>',
    to,
    subject: 'Reset your password',
    html: `
      <p>Hello ${name || 'there'},</p>
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });

  return {
    sent: true,
  };
}

module.exports = {
  sendPasswordResetEmail,
};