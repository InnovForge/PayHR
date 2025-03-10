const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  database: process.env.MYSQL_DATABASE,
  password: process.env.MYSQL_PASSWORD || '',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

async function clearDatabase() {
  const connection = await pool.getConnection();
  console.log('Connected to MySQL');

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0'); // Tắt kiểm tra khóa ngoại
    await connection.query('DELETE FROM employee');
    await connection.query('DELETE FROM users');
    await connection.query('DELETE FROM pay_rates');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1'); // Bật lại kiểm tra khóa ngoại
    
    console.log('✅ All data deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting data:', error);
  } finally {
    connection.release();
    console.log('Database cleanup completed.');
  }
}

clearDatabase();
