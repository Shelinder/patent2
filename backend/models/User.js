const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');
const bcrypt        = require('bcryptjs');

const User = sequelize.define('User', {
  id:    { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name:  { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  password:        { type: DataTypes.STRING(255), allowNull: false },
  plan:            { type: DataTypes.ENUM('free','pro','enterprise'), defaultValue: 'free' },
  plan_expires_at: { type: DataTypes.DATE, allowNull: true },
  reset_password_token: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  reset_password_expire: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
},
{
  tableName: 'users_tables', timestamps: true, underscored: true,
  hooks: {
    beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 10); },
    beforeUpdate: async (u) => {
      if (u.changed('password')) u.password = await bcrypt.hash(u.password, 10);
    },
  },
});

module.exports = User;