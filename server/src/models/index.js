const sequelize = require('../providers/db.js');

//import models
const initUser = require('./users');
const initRefreshToken = require('./auth/refreshToken.js');
const initCategory = require('./categories');
const initUserCategory = require('./usersCategories');
const initBudget = require('./budgets');

//initialize models
const User = initUser(sequelize);
const RefreshToken = initRefreshToken(sequelize);
const Category = initCategory(sequelize);
const UserCategory = initUserCategory(sequelize);
const Budget = initBudget(sequelize);

//define associations
Category.hasMany(UserCategory, { foreignKey: 'categoryId', as: 'userCategories' });

User.hasMany(UserCategory, { foreignKey: 'userId', as: 'userCategories' });
User.hasOne(RefreshToken, { foreignKey: 'userId', as: 'refreshToken' });
User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });

UserCategory.belongsTo(User, { foreignKey: 'userId', as: 'user' })
UserCategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsToMany(Category, { through: UserCategory, foreignKey: 'userId', as: 'categories' });
Category.belongsToMany(User, { through: UserCategory, foreignKey: 'categoryId', as: 'users' });

Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' })

//export models
module.exports = { 
    sequelize, 
    User, 
    RefreshToken,
    Category,
    UserCategory,
    Budget,
};