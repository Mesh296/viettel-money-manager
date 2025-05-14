const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config()
const userService = require('../services/users')

if (!process.env.SECRET_KEY) {
    throw new Error('Missing SECRET_KEY in environment variables');
}
const SECRET_KEY = process.env.SECRET_KEY;

const authenticate = async(req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('Missing token');
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const userData = await userService.getById(decoded.id);

        if (!userData) {
            throw new Error('User not found');
        }

        req.user = userData
        next();

    } catch (error) {
        res.status(401).json('Please authenticate');
    }
}

module.exports = authenticate;