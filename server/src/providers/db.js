const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config()

const sequelize = new Sequelize({
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.HOST,
    dialect: 'postgres'
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully');
    } catch (error) {
        console.error('Unable to connect to the database', error)
    }
}

testConnection();

module.exports = sequelize;