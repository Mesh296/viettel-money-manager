const express = require('express');
const userController = require('../../controllers/users');
const auth = require('../../middlewares/authentication.js');
const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/all', userController.getAll);
router.delete('/delete/:id', userController.deleteUser);

module.exports = router;