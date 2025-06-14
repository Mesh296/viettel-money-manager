const { Category } = require('../models');

const categories = [
    {
        "name": "Shopping"
    },
    {
        "name": "Medical"
    },
    {
        "name": "Salary"
    },
    {
        "name": "Investment"
    },
    {
        "name": "Side Income"
    },
    {
        "name": "Gift"
    },
    {
        "name": "Refund"
    },

    {
        "name": "Food & Dining"
    },
    {
        "name": "Bills"
    },
    {
        "name": "Transportation"
    },
    {
        "name": "Housing"
    },
    {
        "name": "Entertainment"
    },
    {
        "name": "Education"
    },
    {
        "name": "Savings/Investment"
    },
    {
        "name": "Charity"
    },
    {
        "name": "Pet"
    },

    {
        "name": "Gym"
    },
    {
        "name": "Coffee & Snacks"
    },
    {
        "name": "Other Expenses"
    },
    {
        "name": "Other Income"
    }
];

const seedCategories = async () => {
    try {
        console.log('Starting to seed categories...');
        
        // Check if categories already exist
        const count = await Category.count();
        if (count > 0) {
            console.log('Categories already exist, skipping seed.');
            return;
        }
        
        // Create categories in bulk
        await Category.bulkCreate(categories);
        console.log('Categories seeded successfully!');
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
};

module.exports = seedCategories;