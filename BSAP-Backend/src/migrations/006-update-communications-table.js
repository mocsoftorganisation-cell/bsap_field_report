const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('communications', 'battalion_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'battalions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('communications', 'selected_battalions', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('communications', 'selected_battalion_names', {
      type: Sequelize.JSON,
      allowNull: true
    });

    // Add index for battalion_id
    await queryInterface.addIndex('communications', ['battalion_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('communications', ['battalion_id']);
    await queryInterface.removeColumn('communications', 'selected_battalion_names');
    await queryInterface.removeColumn('communications', 'selected_battalions');
    await queryInterface.removeColumn('communications', 'battalion_id');
  }
};