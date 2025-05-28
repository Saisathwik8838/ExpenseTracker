// database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('UserData', 'root', 'Sai@6859', {
  host: 'localhost',
  port : 3306,
  dialect: 'mysql',
  logging: false, // disable logging SQL queries, optional
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
  }
}
testConnection();

module.exports = sequelize;
