const express = require('express');
const authentication = require('../middlewares/authentication.js');
const userRoutes = require('./users/index.js');
const categoryRoutes = require('./categories');
const userCategoryRoutes = require('./usersCategories');
const budgetRoutes = require('./budgets');
const transactionRoutes = require('./transactions');
const alertRoutes = require('./alerts');
const statisticRoutes = require('./statistics');
const router = express.Router();

router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/users-categories', userCategoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/transactions', transactionRoutes);
router.use('/alerts', alertRoutes);
router.use('/statistics', statisticRoutes);

module.exports = router;