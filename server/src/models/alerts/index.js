const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Alert = sequelize.define("Alert", {
        alertId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('total_limit', 'category_limit', 'income_vs_expense'),
            allowNull: false,
        },
        triggered_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
    return Alert;
};