const express = require('express');
const transactionService = require('../../services/transactions');
const budgetService = require('../../services/budgets');

// Lấy thống kê tổng thu nhập, tổng chi tiêu và số dư
const getSummary = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { month, year } = req.query;
        
        const data = await transactionService.getSummaryStats(currentUserId, month, year);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching summary statistics',
        });
    }
};

// Lấy dữ liệu thu nhập và chi tiêu theo tháng cho biểu đồ cột/thanh
const getMonthlyData = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { month, year } = req.query;
        
        const data = await transactionService.getMonthlyStats(currentUserId, month, year);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching monthly statistics',
        });
    }
};

// Lấy tỷ lệ chi tiêu theo danh mục cho biểu đồ tròn
const getCategorySpending = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { month, year } = req.query;
        
        const data = await transactionService.getCategorySpendingStats(currentUserId, month, year);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching category spending statistics',
        });
    }
};

// Lấy dữ liệu so sánh thu nhập và chi tiêu theo thời gian
const getIncomeExpenseComparison = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { period, count } = req.query; // period: 'day', 'week', 'month', 'year'
        
        const data = await transactionService.getIncomeExpenseComparisonStats(currentUserId, period, count);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching income-expense comparison',
        });
    }
};

module.exports = {
    getSummary,
    getMonthlyData,
    getCategorySpending,
    getIncomeExpenseComparison
}; 