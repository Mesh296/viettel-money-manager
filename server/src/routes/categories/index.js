const express = require('express');
const categoryController = require('../../controllers/categories');
const auth = require('../../middlewares/authentication.js');
const cacheMiddleware = require('../../middlewares/cache.js');
const router = express.Router();

// Áp dụng cache cho danh sách categories (1 giờ)
router.get('/all', cacheMiddleware(3600), categoryController.getAll);
router.get('/:id', cacheMiddleware(3600), categoryController.getById);
router.post('/create', categoryController.create);
router.delete('/delete/:id', categoryController.deleteCategory);

module.exports = router;