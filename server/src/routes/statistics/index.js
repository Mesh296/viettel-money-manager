const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authentication.js');
const statisticController = require('../../controllers/statistics');

// Thống kê tổng thu nhập, tổng chi tiêu và số dư
router.get('/summary', auth, statisticController.getSummary);

// Thống kê thu nhập và chi tiêu theo tháng (biểu đồ cột/thanh)
router.get('/monthly', auth, statisticController.getMonthlyData);

// Thống kê tỷ lệ chi tiêu theo danh mục (biểu đồ tròn)
router.get('/category-spending', auth, statisticController.getCategorySpending);

// Biểu đồ so sánh thu chi theo thời gian
router.get('/income-expense-comparison', auth, statisticController.getIncomeExpenseComparison);

module.exports = router; 