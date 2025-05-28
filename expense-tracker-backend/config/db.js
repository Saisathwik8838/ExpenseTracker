const { Sequelize } = require('sequelize');

// Update these with your actual MySQL credentials
const sequelize = new Sequelize('UserData', 'root', 'Sai@6859', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
