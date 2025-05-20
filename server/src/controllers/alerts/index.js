const alertService = require('../../services/alerts');

const createAlert = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, type, triggered_at } = req.body;
        const alert = await alertService.create(userId, message, type, triggered_at);
        res.status(201).json(alert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAllAlerts = async (req, res) => {
    try {
        const alerts = await alertService.getAll();
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await alertService.getById(id);
        res.status(200).json(alert);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const getUserAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("controller: ", userId)
        const alerts = await alertService.getUserAlerts(userId);
        res.status(200).json(alerts);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const updateAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, type, triggered_at } = req.body;
        const alert = await alertService.update(id, message, type, triggered_at);
        res.status(200).json(alert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await alertService.deleteAlert(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = {
    createAlert,
    getAllAlerts,
    getAlertById,
    getUserAlerts,
    updateAlert,
    deleteAlert,
};