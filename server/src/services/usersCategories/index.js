const { UserCategory, User, Category } = require('../../models');
const { Sequelize } = require('sequelize');

const create = async (userId, categoryId, budget_limit) => {
    try {
        if (!userId || !categoryId || typeof budget_limit !== 'number' || budget_limit < 0) {
            throw new Error('Valid userId, categoryId, and non-negative budget_limit are required');
        }

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
            },
        });

        if (existingUserCategory) {
            throw new Error('User already assigned to this category');
        }

        const userCategory = await UserCategory.create({ userId, categoryId, budget_limit });
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

const update = async (id, budget_limit) => {
    try {
        const userCategory = await UserCategory.findByPk(id);
        if (!userCategory) {
            throw new Error('User category not found');
        }

        if (typeof budget_limit !== 'number' || budget_limit < 0) {
            throw new Error('Valid non-negative budget_limit is required');
        }

        const [updated] = await UserCategory.update({ budget_limit }, { where: { id } });
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
};