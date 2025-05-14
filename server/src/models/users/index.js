const { sequelize } = require('../../providers/db.js')
const { DataTypes, UUID } = require('sequelize')
const bcrypt = require('bcrypt')

module.exports = (sequelize) => {
    const User = sequelize.define("user", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name:{
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                args: true,
                msg: "Email must be unique"
            },
            validate: {
                isEmail: {
                    msg: "Must be a valid email address",
                }
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [6, 128],
                    msg: "Password must be between 6 and 128 characters",
                }
            },
            set(value) {
                const hash = bcrypt.hashSync(value, 10);
                this.setDataValue('password', hash);
            },
        }
    });
    return User;
}

