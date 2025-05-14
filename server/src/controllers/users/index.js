const express = require('express');
const userService = require('../../services/users');

const register = async (req, res) => {
    try {
        const { body } = req;
        const data = await userService.register(body);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error registering user'
        });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await userService.login(email, password);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error logining user'
        });
    }
}

const getAll = async (req, res) => {
    try {
        const data = await userService.getAll();
        return res.status(201).json(data)
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Error fetch all user'
        });
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const data = await userService.deleteUser(userId);
        res.status(201).json("User has been deleted successfully!");
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

module.exports = {
    register,
    login,
    getAll,
    deleteUser
}
