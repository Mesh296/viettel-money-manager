const express = require('express');
const userCategoryController = require('../../controllers/usersCategories');
const auth = require('../../middlewares/authentication.js');
const router = express.Router();

router.post('/create', auth, userCategoryController.create);
router.get('/all', auth, userCategoryController.getAll);
router.get('/current', auth, userCategoryController.getCurrentUserCategories);
router.get('/:id', auth, userCategoryController.getById);
router.put('/update/:id', auth, userCategoryController.update);
router.delete('/delete/:id', auth, userCategoryController.deleteUserCategory);

module.exports = router;