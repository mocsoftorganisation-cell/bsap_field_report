const sequelize = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const tables = ['topic', 'topics', 'Topics'];
    for (const tbl of tables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\` WHERE id = :id`, { replacements: { id: 149 } });
        console.log(`Table ${tbl}:`, results[0]?.cnt ?? results.cnt ?? JSON.stringify(results));
      } catch (e) {
        console.log(`Table ${tbl}: error (${e.message})`);
      }
    }

    // List tables
    try {
      const [rows] = await sequelize.query("SHOW TABLES");
      console.log('Tables in DB:');
      console.log(rows.map(r => Object.values(r)[0]));
    } catch (e) {
      console.log('Error listing tables:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
})();
