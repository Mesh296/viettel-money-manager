const { Transaction, UserCategory, Budget, User, Category } = require('../../models');
const { Sequelize } = require('sequelize');

const parseDate = (dateString) => {
    if (!dateString) return new Date(); // Default to current date if not provided
    const [day, month, year] = dateString.split('-').map(Number);
    console.log(dateString)
    console.log(day, month, year)
    if (!day || !month || !year || day > 31 || month > 12 || year < 1900 || year > 2100) {
        throw new Error('Invalid date format: Expected DD-MM-YYYY, year between 1900 and 2100');
    }
    const date = new Date(year, month - 1, day); // month is 0-based in JavaScript
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date: Unable to parse date');
    }
    return date;
};

const create = async (currentUserId, categoryId, type, amount, date = null, note = null) => {
    try {
        if (!categoryId || !['income', 'expense'].includes(type) || typeof amount !== 'number' || amount < 0) {
            throw new Error('Valid categoryId, type (income/expense), and non-negative amount are required');
        }

        const user = await User.findByPk(currentUserId);
        const category = await Category.findByPk(categoryId);
        if (!user || !category) {
            throw new Error('User or category not found');
        }

        const transactionDate = parseDate(date);
        console.log("date: ", transactionDate);
        const transactionMonth = transactionDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        console.log()
        
        let userCategory = await UserCategory.findOne({ where: { userId: currentUserId, categoryId, month: transactionMonth } });
        if (!userCategory) {
            userCategory = await UserCategory.create({
                userId: currentUserId,
                categoryId,
                budget_limit: type === 'expense' ? 0.0 : amount,
                month: transactionMonth, // Set month to match transaction
            });
        }
        console.log("runheeeee")
        let budget = await Budget.findOne({ where: { userId: currentUserId, month: transactionMonth } });
        if (!budget) {
            budget = await Budget.create({
                userId: currentUserId,
                month: transactionMonth,
                budget: type === 'expense' ? 0.0 : amount,
            });
        }

        const transaction = await Transaction.create({
            userId: currentUserId,
            categoryId: categoryId,
            type,
            amount,
            date: transactionDate,
            note,
        });

        if (type === 'expense') {
            // Deduct the full amount from both budget_limit and budget, allowing negative values
            const amountToDeductFromUserCategory = amount;
            const amountToDeductFromBudget = amount;

            if (amountToDeductFromUserCategory > 0) {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit - ${amountToDeductFromUserCategory}`) },
                    { where: { userId: currentUserId, categoryId, month: transactionMonth } }
                );
            }

            if (amountToDeductFromBudget > 0) {
                await Budget.update(
                    { budget: Sequelize.literal(`budget - ${amountToDeductFromBudget}`) },
                    { where: { userId: currentUserId, month: transactionMonth } }
                );
            }
        } else if (type === 'income') {
            await UserCategory.update(
                { budget_limit: Sequelize.literal(`budget_limit + ${amount}`) },
                { where: { userId: currentUserId, categoryId } }
            );
            await Budget.update(
                { budget: Sequelize.literal(`budget + ${amount}`) },
                { where: { userId: currentUserId, month: transactionMonth } }
            );
        }

        return transaction;
    } catch (error) {
        throw new Error(error.message || 'Error creating transaction');
    }
};

const getAll = async () => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        return transactions;
    } catch (error) {
        throw new Error(error.message || 'Error fetching transactions');
    }
};

const getAllUserTransactions = async (currentUserId) => {
    try {
        const transactions = await Transaction.findAll({
            where: { userId: currentUserId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        return transactions;
    } catch (error) {
        throw new Error(error.message || 'Error fetching transactions');
    }
}

const getById = async (transactionId) => {
    try {
        const transaction = await Transaction.findByPk(transactionId, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return transaction;
    } catch (error) {
        throw new Error(error.message || 'Error fetching transaction');
    }
};

const deleteTransaction = async (transactionId) => {
    try {
        const transaction = await Transaction.findByPk(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const { userId, categoryId, type, amount, date } = transaction;
        const transactionMonth = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Find associated UserCategory and Budget
        const userCategory = await UserCategory.findOne({ where: { userId, categoryId } });
        const budget = await Budget.findOne({ where: { userId, month: transactionMonth } });

        if (userCategory && budget) {
            if (type === 'expense') {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit + ${amount}`) },
                    { where: { userId, categoryId } }
                );
                await Budget.update(
                    { budget: Sequelize.literal(`budget + ${amount}`) },
                    { where: { userId, month: transactionMonth } }
                );
            } else if (type === 'income') {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit - ${amount}`) },
                    { where: { userId, categoryId } }
                );
                await Budget.update(
                    { budget: Sequelize.literal(`budget - ${amount}`) },
                    { where: { userId, month: transactionMonth } }
                );
            }
        }

        await Transaction.destroy({ where: { transactionId } });
        return { message: 'Transaction deleted successfully' };
    } catch (error) {
        throw new Error(error.message || 'Error deleting transaction');
    }
};

module.exports = {
    create,
    getAll,
    getById,
    deleteTransaction,
    getAllUserTransactions
};