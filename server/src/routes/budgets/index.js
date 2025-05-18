const express = require('express');
const budgetController = require('../../controllers/budgets');
const auth = require('../../middlewares/authentication.js');
const router = express.Router();

router.post('/create', auth, budgetController.create);
router.get('/all', auth, budgetController.getAll);
router.get('/current', auth, budgetController.getCurrentUserBudget); 
router.get('/:id', auth, budgetController.getById);
router.put('/update/:id', auth, budgetController.update);
router.delete('/delete/:id', auth, budgetController.deleteBudget);

module.exports = router;