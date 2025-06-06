const { Category } = require('../models');

const categories = [
    {
        "id": "39e10cd0-6a17-4c93-88ae-cd54dcc3b4f7",
        "name": "Shopping"
    },
    {
        "id": "005a35a6-bdd7-4d8d-b51b-2d9d13bc3858",
        "name": "Medical"
    },
    {
        "id": "694238aa-b659-46cb-8332-770195af6486",
        "name": "Salary"
    },
    {
        "id": "b20581c9-ee42-470a-a9a9-f98fa5c2dc76",
        "name": "Investment"
    },
    {
        "id": "e12c79f5-d490-4d5d-a6ca-ae9ff7f8111e",
        "name": "Side Income"
    },
    {
        "id": "ac277fe4-8320-471f-bdb7-eb3faa478783",
        "name": "Gift"
    },
    {
        "id": "7ad56daa-8746-4fa3-b422-d375f41ef47b",
        "name": "Refund"
    },
    {
        "id": "0164af0b-1783-4adb-883d-c1513c7b8764",
        "name": "Other Income"
    },
    {
        "id": "619c4ad6-00c1-4cfb-8ac6-ac57568ec375",
        "name": "Food & Dining"
    },
    {
        "id": "ab14dc59-6c0e-48ea-ac86-83c59854bb60",
        "name": "Bills"
    },
    {
        "id": "198d37bb-a7d9-4624-862d-b90bac70611b",
        "name": "Transportation"
    },
    {
        "id": "e3fb56fd-2f4e-4121-87fe-d34e1bbce106",
        "name": "Housing"
    },
    {
        "id": "1f965632-524a-48f4-9b3a-131cfceb5a0a",
        "name": "Entertainment"
    },
    {
        "id": "f71adc41-225d-4d73-8881-626401ec8b94",
        "name": "Education"
    },
    {
        "id": "571590f3-0a26-4007-8ce8-bf096fb899e9",
        "name": "Savings/Investment"
    },
    {
        "id": "6c820c7b-2df0-4b0a-91d1-6fb8636a8401",
        "name": "Charity"
    },
    {
        "id": "2be6e33b-8c23-4b84-9c93-c17580992c34",
        "name": "Pet"
    },
    {
        "id": "93517178-2412-49ad-938c-2bb3854d0351",
        "name": "Other Expenses"
    },
    {
        "id": "5757e0da-b385-456d-bd0e-8d1b203e0b15",
        "name": "Gym"
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