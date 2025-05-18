const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Transaction = sequelize.define("Transaction", {
        transactionId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
        },
        type: {
            type: DataTypes.ENUM('income', 'expense'),
            allowNull: false,
            defaultValue: 'expense',
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'transactions',
        timestamps: true,
        indexes: [
            { fields: ['userId'] },
            { fields: ['categoryId'] },
        ],
    });

    return Transaction;
};