const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '../db/database.sqlite'
});

const Clients = sequelize.define('client', {
  clientName: {
    type: DataTypes.STRING,
    date: Sequelize.DATE,
    allowNull: false
  },
  lastEntrance: {
    type: DataTypes.DATE,
    date: Sequelize.DATE,
    allowNull: false
  }
});

const Requests = sequelize.define('request', {
  clientId: {
    type: DataTypes.INTEGER,
    date: Sequelize.DATE,
    allowNull: false
  },
  clientName: {
    type: DataTypes.STRING,
    date: Sequelize.DATE,
    allowNull: false
  }
});

const Results = sequelize.define('results', {
  resultsId: {
    type: DataTypes.STRING,
    date: Sequelize.DATE,
    allowNull: false
  },
  requestId: {
    type: DataTypes.STRING,
    date: Sequelize.DATE,
    allowNull: false
  },
  tomtom: {
    type: DataTypes.TEXT,
    date: Sequelize.DATE,
    allowNull: false
  }
});

module.exports = sequelize;