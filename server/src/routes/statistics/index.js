const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authentication.js');
const statisticController = require('../../controllers/statistics');
const cacheMiddleware = require('../../middlewares/cache.js');

// Thống kê tổng thu nhập, tổng chi tiêu và số dư - cache 15 phút
router.get('/summary', auth, cacheMiddleware(900, (req) => 
  `cache:stats:summary:${req.user?.id}:${req.query.month || 'current'}:${req.query.year || new Date().getFullYear()}`
), statisticController.getSummary);

// Thống kê thu nhập và chi tiêu theo tháng (biểu đồ cột/thanh) - cache 15 phút
router.get('/monthly', auth, cacheMiddleware(900, (req) =>
  `cache:stats:monthly:${req.user?.id}:${req.query.month || 'current'}:${req.query.year || new Date().getFullYear()}`
), statisticController.getMonthlyData);

// Thống kê tỷ lệ chi tiêu theo danh mục (biểu đồ tròn) - cache 15 phút
router.get('/category-spending', auth, cacheMiddleware(900, (req) =>
  `cache:stats:category:${req.user?.id}:${req.query.month || 'current'}:${req.query.year || new Date().getFullYear()}`
), statisticController.getCategorySpending);

// Biểu đồ so sánh thu chi theo thời gian - cache 30 phút
router.get('/income-expense-comparison', auth, cacheMiddleware(1800, (req) =>
  `cache:stats:comparison:${req.user?.id}:${req.query.period || 'month'}:${req.query.count || '6'}`
), statisticController.getIncomeExpenseComparison);

module.exports = router; 