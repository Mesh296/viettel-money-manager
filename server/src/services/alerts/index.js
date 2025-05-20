const { Alert, User } = require('../../models');
const { Sequelize } = require('sequelize');

const create = async (currentUserId, message, type, triggered_at = new Date()) => {
    try {
        if (!currentUserId || !message || !type || !['total_limit', 'category_limit', 'income_vs_expense'].includes(type)) {
            throw new Error('Valid userId, message, and type (total_limit, category_limit, income_vs_expense) are required');
        }

        const user = await User.findByPk(currentUserId);
        if (!user) {
            throw new Error('User not found');
        }

        const alert = await Alert.create({ userId: currentUserId, message, type, triggered_at });
        return alert;
    } catch (error) {
        throw new Error(error.message || 'Error creating alert');
    }
};

const getAll = async () => {
    try {
        const alerts = await Alert.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        return alerts;
    } catch (error) {
        throw new Error(error.message || 'Error fetching alerts');
    }
};

const getById = async (alertId) => {
    try {
        const alert = await Alert.findByPk(alertId, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        if (!alert) {
            throw new Error('Alert not found');
        }
        return alert;
    } catch (error) {
        throw new Error(error.message || 'Error fetching alert');
    }
};

const getUserAlerts = async (currentUserId) => {
    try {
        console.log(currentUserId)
        const user = await User.findByPk(currentUserId);
        if (!user) {
            throw new Error('User not found');
        }

        const alerts = await Alert.findAll({
            where: { userId: currentUserId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        return alerts;
    } catch (error) {
        throw new Error(error.message || 'Error fetching user alerts');
    }
};

const update = async (alertId, message, type, triggered_at) => {
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) {
            throw new Error('Alert not found');
        }

        const [updated] = await Alert.update(
            { message, type, triggered_at },
            { where: { alertId } }
        );
        if (updated === 0) {
            throw new Error('Failed to update alert');
        }

        return await getById(alertId);
    } catch (error) {
        throw new Error(error.message || 'Error updating alert');
    }
};

const deleteAlert = async (alertId) => {
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) {
            throw new Error('Alert not found');
        }

        await Alert.destroy({ where: { alertId } });
        return { message: 'Alert deleted successfully' };
    } catch (error) {
        throw new Error(error.message || 'Error deleting alert');
    }
};

module.exports = {
    create,
    getAll,
    getById,
    getUserAlerts,
    update,
    deleteAlert,
};