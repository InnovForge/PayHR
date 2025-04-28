require('dotenv').config();
const { faker } = require('@faker-js/faker');
const sql = require('mssql');

const sqlConfig = {
    user: process.env.SQL_DB_USER,
    password: process.env.SQL_DB_PASSWORD,
    database: process.env.SQL_DB_NAME,
    port: parseInt(process.env.SQL_DB_PORT),
    server: process.env.SQL_DB_SERVER,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: false, // For Azure
        trustServerCertificate: true, // For local dev
    },
};
// Hàm clear toàn bộ dữ liệu trong bảng Personal
async function clearPersonalData() {
    try {
        let pool = await sql.connect(sqlConfig);
        console.log('✅ Connected to SQL Server');

        const result = await pool.request().query('DELETE FROM dbo.Personal');

        console.log(`🗑️ All data from Personal table has been deleted successfully!`);
        await sql.close();
    } catch (err) {
        console.error('❌ SQL Error during clear:', err);
    }
}

clearPersonalData();