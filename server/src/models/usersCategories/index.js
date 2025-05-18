const { sequelize } = require('../../providers/db.js')
const { DataTypes, UUID } = require('sequelize')
const bcrypt = require('bcrypt')

module.exports = (sequelize) => {
    const UserCategory = sequelize.define("userCategory", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        budget_limit: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
        },
        month: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: /^[A-Za-z]+ \d{4}$/, // Format: "Month YYYY" (e.g., "January 2025")
            },
        },
    });
    return UserCategory;
}

