const { mysql } = require('./../config/mysql');
const { sqls } = require('./../config/sqls');

module.exports = async (req, res, next) => {
  let mysqlStatus = '🔴 Not Connected';
  let sqlStatus = '🔴 Not Connected';

  try {
    const conn = await mysql.getConnection();
    await conn.query('SELECT 1');
    mysqlStatus = '🟢 Connected';
    conn.release(); 
  } catch (err) {
    console.warn('⚠️ MySQL Connection Failed:', err.message);
  }

  try {
    const pool = await sqls;
    await pool.request().query('SELECT 1');
    sqlStatus = '🟢 Connected';
  } catch (err) {
    console.warn('⚠️ SQL Server Connection Failed:', err.message);
  }

  res.locals.mysqlStatus = mysqlStatus;
  res.locals.sqlStatus = sqlStatus;
  res.locals.wsUrl = process.env.WS_URL || 'ws://localhost:8090';
  next();
};
