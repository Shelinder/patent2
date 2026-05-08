const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const crypto        = require('crypto');
const User          = require('./User');

const PLAN_LIMITS = {
  free:       { requests_per_day: 10,   results_per_call: 5   },
  pro:        { requests_per_day: 500,  results_per_call: 20  },
  enterprise: { requests_per_day: 5000, results_per_call: 100 },
};

const ApiKey = sequelize.define('ApiKey', {
  id:      { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  key:     { type: DataTypes.STRING(64), allowNull: false, unique: true },
  plan:    { type: DataTypes.ENUM('free','pro','enterprise'), allowNull: false },
  is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
  expires_at:      { type: DataTypes.DATE,    allowNull: true },
  usage_today:     { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  usage_reset_at:  { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
  total_usage:     { type: DataTypes.BIGINT.UNSIGNED,  defaultValue: 0 },
},
{
  tableName: 'api_keys', timestamps: true, underscored: true,
  indexes: [{ fields: ['key'] }],
  hooks: {
    beforeCreate: (apiKey) => {
      if (!apiKey.key) apiKey.key = crypto.randomBytes(32).toString('hex');
      const d = new Date(); d.setHours(23, 59, 59, 999);
      apiKey.usage_reset_at = d;
    },
  },
});

ApiKey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ApiKey,   { foreignKey: 'user_id', as: 'api_keys' });

module.exports = ApiKey;
module.exports.PLAN_LIMITS = PLAN_LIMITS;