const sequelize = require('../providers/db.js');

//import models
const initUser = require('./users');
const initRefreshToken = require('./auth/refreshToken.js')

//initialize models
const User = initUser(sequelize);
const RefreshToken = initRefreshToken(sequelize)

//define associations

//export models
module.exports = { 
    sequelize, 
    User, 
    RefreshToken, 
};