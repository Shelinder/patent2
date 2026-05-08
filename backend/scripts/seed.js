require('dotenv').config();
const sequelize = require('../config/db');

require('../models/User');
require('../models/ApiKey');

const User = require('../models/User');
const ApiKey = require('../models/ApiKey');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password';

    let user = await User.findOne({
      where: {
        email: adminEmail,
      },
    });

    if (!user) {
      user = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        plan: 'pro',
      });

      console.log('Created admin user:', adminEmail);
    } else {
      console.log('Admin user already exists:', adminEmail);
    }

    let apiKey = await ApiKey.findOne({
      where: {
        user_id: user.id,
      },
    });

    if (!apiKey) {
      apiKey = await ApiKey.create({
        user_id: user.id,
        plan: 'pro',
      });

      console.log('Created API key for admin:', apiKey.key);
    } else {
      console.log('Existing API key:', apiKey.key);
    }

    console.log('\nSeed complete. Use this API key in requests with header x-api-key:');
    console.log(apiKey.key);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();