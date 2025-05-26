const express = require('express');
const transactionService = require('../../services/transactions');

const create = async (req, res) => {
    try {
        const { categoryId, type, amount, date, note } = req.body;
        const currentUserId = req.user.id;
        const data = await transactionService.create(currentUserId, categoryId, type, amount, date, note);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error creating transaction',
        });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await transactionService.getAll();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching transactions',
        });
    }
};

const getAllUserTransactions = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const data = await transactionService.getAllUserTransactions(currentUserId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching transactions',
        });
    }
}

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Getting transaction by ID:', id);
        const data = await transactionService.getById(id);
        console.log('Transaction found:', data);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in getById controller:', error);
        return res.status(400).json({
            message: error.message || 'Error fetching transaction',
        });
    }
};

const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryId, type, amount, date, note } = req.body;
        const currentUserId = req.user.id;
        
        console.log('Updating transaction ID:', id);
        console.log('Update data:', { categoryId, type, amount, date, note });
        
        const data = await transactionService.updateTransaction(
            id, 
            currentUserId, 
            { categoryId, type, amount, date, note }
        );
        
        console.log('Update successful, returning:', data);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in updateTransaction controller:', error);
        return res.status(400).json({
            message: error.message || 'Error updating transaction',
        });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await transactionService.deleteTransaction(id);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error deleting transaction',
        });
    }
};

const searchTransactions = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { 
            startDate, 
            endDate, 
            type, 
            categoryId, 
            minAmount, 
            maxAmount,
            keyword,
            sortBy, 
            sortOrder,
            page,
            limit
        } = req.query;
        
        const data = await transactionService.searchTransactions(
            currentUserId,
            { 
                startDate, 
                endDate, 
                type, 
                categoryId, 
                minAmount, 
                maxAmount,
                keyword,
                sortBy, 
                sortOrder,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            }
        );
        
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error searching transactions',
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    deleteTransaction,
    getAllUserTransactions,
    updateTransaction,
    searchTransactions
};