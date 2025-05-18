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
            validate: {
                min: 0,
            },
        }
    });
    return UserCategory;
}

