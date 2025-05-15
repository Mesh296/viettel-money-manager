const { sequelize } = require('../../providers/db.js')
const { DataTypes, UUID } = require('sequelize')
const bcrypt = require('bcrypt')

module.exports = (sequelize) => {
    const UserCategory = sequelize.define("userCategory", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        }
    });
    return UserCategory;
}

