const { Category } = require('../../models');
const { Sequelzie } = require('sequelize');

const create = async (name) => {
    try {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Category name must be a non-empty string');
        }

        const existingCategory = await Category.findOne({
            where: {
                name: name
            }
        })

        if (existingCategory) {
            throw new Error('Category already existed');
        }

        const category = await Category.create({name: name});
        return category;
    } catch (error) {
        throw new Error(error.message);
    }
}

const getAll = async() => {
    try {
        const categories =  await Category.findAll();
        return categories;
    } catch (error) {
        throw new Error(error.message);
    }
}

const getById = async(categoryId) => {
    try {
        const category = await Category.findByPk(categoryId)
        if (!category) {
            throw new Error('Category not found')
        }
        return category
    } catch (error) {
        throw new Error(error.message);
    }
}

const deleteCategory = async(categoryId) => {
    try {
        console.log(categoryId)
        await Category.destroy({where: {id: categoryId}})
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    create,
    getAll,
    getById,
    deleteCategory
}