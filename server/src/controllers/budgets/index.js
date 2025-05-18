const express = require('express');
const budgetService = require('../../services/budgets');

const create = async (req, res) => {
    try {
        const { month, budget } = req.body;
        const currentUserId = req.user.id; 
        const data = await budgetService.create(currentUserId, month, budget);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error creating budget',
        });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await budgetService.getAll();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching budgets',
        });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await budgetService.getById(id);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching budget',
        });
    }
};

const update = async (req, res) => {
    try {
        const body = req.body;
        const currentUserId = req.user.id;
        const data = await budgetService.update(currentUserId, body);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error updating budget',
        });
    }
};

const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const data = await budgetService.deleteBudget(id, currentUserId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error deleting budget',
        });
    }
};

const getCurrentUserBudget = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const data = await budgetService.getCurrentUserBudget(currentUserId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching current user budgets',
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    deleteBudget,
    getCurrentUserBudget,
};