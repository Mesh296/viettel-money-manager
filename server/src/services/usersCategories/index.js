const { UserCategory, User, Category } = require('../../models');
const { Sequelize } = require('sequelize');

const create = async (userId, categoryId, budget_limit, month) => {
    try {
        if (!userId || !categoryId || typeof budget_limit !== 'number' || !month) {
            throw new Error('Valid userId, categoryId, budget_limit (number), and month (e.g., "May 2025") are required');
        }
        console.log("here")
        // Check if user and category exist
        const user = await User.findByPk(userId);
        const category = await Category.findByPk(categoryId);
        if (!user) {
            throw new Error('User not found');
        }
        if (!category) {
            throw new Error('Category not found');
        }

        // Check for existing UserCategory
        const existingUserCategory = await UserCategory.findOne({
            where: {
                userId,
                categoryId,
                month,
            },
        });

        if (existingUserCategory) {
            throw new Error(`User already assigned to this category in month ${month}`);
        }

        const userCategory = await UserCategory.create({ userId, categoryId, budget_limit, month });
        return userCategory;
    } catch (error) {
        throw new Error(error.message || 'Error creating user category');
    }
};


const getAll = async () => {
    try {
        const userCategories = await UserCategory.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        return userCategories;
    } catch (error) {
        throw new Error(error.message || 'Error fetching user categories');
    }
};

const getById = async (id) => {
    try {
        const userCategory = await UserCategory.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        console.log(id)
        if (!userCategory) {
            throw new Error('User category not found');
        }
        return userCategory;
    } catch (error) {
        throw new Error(error.message || 'Error fetching user category');
    }
};

const getCurrentUserCategories = async (currentUserId) => {
    try {
        const userCategories = await UserCategory.findAll({
            where: { userId: currentUserId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        })
        return userCategories;
    } catch (error) {
        throw new Error(error.message || 'Error fetching user category');
    }
}

const update = async (id, budget_limit, month) => {
    try {
        const userCategory = await UserCategory.findByPk(id);
        if (!userCategory) {
            throw new Error('User category not found');
        }

        if (month && !isValidMonthFormat(month)) {
            throw new Error('Invalid month format: Expected e.g., "May 2025"');
        }

        const [updated] = await UserCategory.update(
            { budget_limit, month },
            { where: { id } }
        );
        if (updated === 0) {
            throw new Error('Failed to update user category');
        }

        const updatedUserCategory = await getById(id);
        return updatedUserCategory;
    } catch (error) {
        throw new Error(error.message || 'Error updating user category');
    }
};

const deleteUserCategory = async (id) => {
    try {
        const userCategory = await UserCategory.findByPk(id);
        if (!userCategory) {
            throw new Error('User category not found');
        }

        await UserCategory.destroy({ where: { id } });
        return { message: 'User category deleted successfully' };
    } catch (error) {
        throw new Error(error.message || 'Error deleting user category');
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    deleteUserCategory,
    getCurrentUserCategories
};