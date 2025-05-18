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
        const data = await transactionService.getById(id);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching transaction',
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

module.exports = {
    create,
    getAll,
    getById,
    deleteTransaction,
    getAllUserTransactions
};