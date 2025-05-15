const express = require('express');
const categoryService = require('../../services/categories');

const getAll = async (req, res) => {
    try {
        const data = await categoryService.getAll();
        return res.status(201).json(data)
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetch all categories'
        });
    }
}

const getById = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const data = await categoryService.getById(categoryId);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetch category'
        });
    }
}

const create = async (req, res) => {
    try {
        console.log("calllllllllllllllll")
        const { name } = req.body;
        console.log("name: ", name)
        const data = await categoryService.create(name);
        return res.status(201).json('User has been created successfully!');
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const data = await categoryService.deleteCategory(categoryId);
        return res.status(201).json("Category has been deleted!");
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
}

module.exports = {
    create,
    getAll,
    getById,
    deleteCategory
}