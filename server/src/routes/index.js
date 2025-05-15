const express = require('express');
const authentication = require('../middlewares/authentication.js');
const userRoutes = require('./users/index.js');
const categoryRoutes = require('./categories');
const router = express.Router();

router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;