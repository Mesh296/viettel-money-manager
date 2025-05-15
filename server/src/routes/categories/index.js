const express = require('express');
const categoryController = require('../../controllers/categories');
const auth = require('../../middlewares/authentication.js');
const router = express.Router();

router.get('/all', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/create', categoryController.create);
router.delete('/delete/:id', categoryController.deleteCategory);

module.exports = router;