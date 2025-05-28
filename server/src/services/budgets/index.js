const { Budget, User } = require('../../models');
const { Sequelize } = require('sequelize');

const create = async (currentUserId, month, budget) => {
    try {
        if (!month || typeof budget !== 'number') {
            throw new Error('Valid month and budget are required');
        }
        if (budget < 0) {
            throw new Error('Budget must be non-negative');
        }

        const user = await User.findByPk(currentUserId);
        if (!user) {
            throw new Error('User not found');
        }

        const existingBudget = await Budget.findOne({
            where: { userId: currentUserId, month },
        });
        if (existingBudget) {
            throw new Error('Budget for this user and month already exists');
        }

        const newBudget = await Budget.create({ userId: currentUserId, month, budget });
        return newBudget;
    } catch (error) {
        throw new Error(error.message || 'Error creating budget');
    }
};

const getAll = async () => {
    try {
        const budgets = await Budget.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        return budgets;
    } catch (error) {
        throw new Error(error.message || 'Error fetching budgets');
    }
};

const getById = async (budgetId) => {
    try {
        const budget = await Budget.findByPk(budgetId, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        if (!budget) {
            throw new Error('Budget not found');
        }
        return budget;
    } catch (error) {
        throw new Error(error.message || 'Error fetching budget');
    }
};

const update = async (currentUserId, body) => {
    try {
        const { month, budget } = body;
        
        if (!month) {
            throw new Error('Month is required');
        }
        
        // Kiểm tra định dạng tháng
        if (!/^[A-Za-z]+ \d{4}$/.test(month)) {
            throw new Error('Invalid month format: Expected e.g., "May 2025"');
        }

        if (typeof budget !== 'number') {
            throw new Error('Budget must be a number');
        }
        if (budget < 0) {
            throw new Error('Budget must be non-negative');
        }

        // Tìm budget cho tháng cụ thể
        const existingBudget = await Budget.findOne({
            where: { userId: currentUserId, month: month }
        });
        
        // Nếu không tìm thấy, tạo mới
        if (!existingBudget) {
            const newBudget = await Budget.create({ 
                userId: currentUserId, 
                month: month, 
                budget: budget 
            });
            return newBudget;
        }

        // Nếu tìm thấy, cập nhật
        const [updated] = await Budget.update(
            { budget: budget }, 
            { where: { userId: currentUserId, month: month } }
        );
        
        if (updated === 0) {
            throw new Error('Failed to update budget');
        }

        return {
            message: "Budget updated successfully",
            month: month,
            budget: budget
        };
    } catch (error) {
        throw new Error(error.message || 'Error updating budget');
    }
};

const deleteBudget = async (budgetId, currentUserId) => {
    try {
        const budget = await Budget.findByPk(budgetId);
        if (!budget.userId) {
            throw new Error('Budget not found');
        }
        console.log(budget.userId, currentUserId)
        if(budget.userId != currentUserId) {
            throw new Error('Please authorize to delete Budget');
        }
        

        await Budget.destroy({ where: { id: budgetId } });
        return { message: 'Budget deleted successfully' };
    } catch (error) {
        throw new Error(error.message || 'Error deleting budget');
    }
};

const getCurrentUserBudget = async (currentUserId) => {
    try {
        const budgets = await Budget.findAll({
            where: { userId: currentUserId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        return budgets;
    } catch (error) {
        throw new Error(error.message || 'Error fetching current user budgets');
    }
};

// Lấy ngân sách của người dùng theo tháng
const getUserBudgetByMonth = async (userId, month) => {
    try {
        if (!month) {
            throw new Error('Month is required');
        }
        
        // Kiểm tra định dạng tháng
        if (!/^[A-Za-z]+ \d{4}$/.test(month)) {
            throw new Error('Invalid month format: Expected e.g., "May 2025"');
        }
        
        const budget = await Budget.findOne({
            where: { userId, month },
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
            ],
        });
        
        return budget;
    } catch (error) {
        throw new Error(error.message || 'Error fetching budget by month');
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    deleteBudget,
    getCurrentUserBudget,
    getUserBudgetByMonth,
};