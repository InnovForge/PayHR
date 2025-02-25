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
    encrypt: false, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

const conn = new sql.ConnectionPool(sqlConfig);

const poolPromise = sql
conn.connect()  
  .then((pool) => {
    console.log('Connected to SQLS');
    return pool;
  })
  .catch((err) => console.error('Unable to connect to the database: ', err));

module.exports = {
  sqls: sql,
  poolPromise,
};
