'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('transactions', 'Transactions_userId_categoryId_key');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addConstraint('transactions', {
      fields: ['user_id', 'category_id'],
      type: 'unique',
      name: 'Transactions_userId_categoryId_key',
    });
  }
};
