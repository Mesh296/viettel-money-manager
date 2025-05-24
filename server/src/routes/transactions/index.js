const express = require('express');
const transactionController = require('../../controllers/transactions');
const auth = require('../../middlewares/authentication.js');
const router = express.Router();

router.post('/create', auth, transactionController.create);
router.get('/all', auth, transactionController.getAll);
router.get('/current', auth, transactionController.getAllUserTransactions);
router.get('/:id', auth, transactionController.getById);
router.put('/update/:id', auth, transactionController.updateTransaction);
router.delete('/delete/:id', auth, transactionController.deleteTransaction);
router.get('/search', auth, transactionController.searchTransactions);

module.exports = router;