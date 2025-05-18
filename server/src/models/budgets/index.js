const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Budget = sequelize.define("Budget", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        month: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: /^[A-Za-z]+ \d{4}$/, // Format: "Month YYYY" (e.g., "January 2025")
            },
        },
        budget: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0,
            validate: {
                min: 0,
            },
        },
    });

    return Budget;
};