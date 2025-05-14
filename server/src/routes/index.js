const express = require('express');
const authentication = require('../middlewares/authentication.js');
const userRoutes = require('./users/index.js');

const router = express.Router();

router.use('/users', userRoutes);

module.exports = router;