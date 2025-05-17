const express = require('express');
const authentication = require('../middlewares/authentication.js');
const userRoutes = require('./users/index.js');
const categoryRoutes = require('./categories');
const userCategoryRoutes = require('./usersCategories');
const router = express.Router();

router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/users-categories', userCategoryRoutes);

module.exports = router;