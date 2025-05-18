const express = require('express');
const userCategoryService = require('../../services/usersCategories');

const create = async (req, res) => {
    try {
        const currentUserId = req.user.id
        const { categoryId, budget_limit, month } = req.body;
        console.log(month)
        const data = await userCategoryService.create(currentUserId, categoryId, budget_limit, month);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error creating user category',
        });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await userCategoryService.getAll();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching user categories',
        });
    }
};

const getById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await userCategoryService.getById(id);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching user category',
        });
    }
};

const getCurrentUserCategories = async (req, res) => {
    console.log('qq234qwrqweqwweqweqweqweqweqweqweqqwee')
    try {
        const currentUserId = req.user.id;
        console.log(currentUserId)
        const data = await userCategoryService.getCurrentUserCategories(currentUserId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetching user category',
        });
    }
}

const update = async (req, res) => {
    try {
        const id = req.params.id;
        const { budget_limit, month } = req.body;
        const data = await userCategoryService.update(id, budget_limit, month);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error updating user category',
        });
    }
};

const deleteUserCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await userCategoryService.deleteUserCategory(id);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error deleting user category',
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    deleteUserCategory,
    getCurrentUserCategories
};