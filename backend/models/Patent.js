const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patent = sequelize.define(
  'Patent',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    doc_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    family_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },

    doc_number: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    kind: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },

    date_publ: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    is_representative: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    date_of_last_exchange: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    date_added_docdb: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    originating_office: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },

    language_of_filing: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },

    title_en: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    abstract_en: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },

    publication_refs: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    application_refs: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    priority_claims: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ipc: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ipcr: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    cpc: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    applicants: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    inventors: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    designation_states: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    citations: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // SQL STORED GENERATED column.
    // Read it from DB. Do not create/update it manually.
    patent_number: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'patent_record',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  }
);

module.exports = Patent;