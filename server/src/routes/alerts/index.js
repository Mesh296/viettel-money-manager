const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authentication.js');
const alertController = require('../../controllers/alerts');

router.post('/create', auth, alertController.createAlert);
router.get('/all', auth, alertController.getAllAlerts);
router.get('/current', auth, alertController.getUserAlerts);
router.get('/:id', auth, alertController.getAlertById);
router.put('/update/:id', auth, alertController.updateAlert);
router.delete('/delete/:id', auth, alertController.deleteAlert);

module.exports = router;