module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the columns if they exist
    await queryInterface.removeColumn('communications', 'selected_battalions').catch(() => {});
    await queryInterface.removeColumn('communications', 'selected_battalion_names').catch(() => {});
    await queryInterface.removeColumn('communications', 'user_ids').catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    // Add columns back (best-effort)
    await queryInterface.addColumn('communications', 'selected_battalions', {
      type: Sequelize.STRING(40),
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('communications', 'selected_battalion_names', {
      type: Sequelize.JSON,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('communications', 'user_ids', {
      type: Sequelize.JSON,
      allowNull: true
    }).catch(() => {});
  }
};