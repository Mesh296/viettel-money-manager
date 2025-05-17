const { sequelize } = require('../../providers/db.js')
const { DataTypes, UUID } = require('sequelize')
const bcrypt = require('bcrypt')

module.exports = (sequelize) => {
    const Category = sequelize.define("category", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name:{
            type: DataTypes.STRING,
            allowNull: false
        },
    });
    return Category;
}

