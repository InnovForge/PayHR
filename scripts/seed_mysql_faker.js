
//const { mysql } = require('../config/mysql');
const mysql = require('mysql2/promise');
require('dotenv').config();

const { faker } = require('@faker-js/faker');


const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  database: process.env.MYSQL_DATABASE,
  password: process.env.MYSQL_PASSWORD || '',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function seedDatabase() {
  const connection = await pool.getConnection();
  console.log('✅ Connected to MySQL');
  
  try {
    await connection.beginTransaction(); // 🚀 Start transaction

    console.log('Seeding employees...');
    
    const batchSize = 1000; // 🚀 Insert theo từng batch 1000 dòng
    const totalRecords = 300000;
    
    for (let batchStart = 0; batchStart < totalRecords; batchStart += batchSize) {
      const employeeData = [];

      for (let i = batchStart; i < Math.min(batchStart + batchSize, totalRecords); i++) {
        employeeData.push([
          1 + i, // Employee_Number
          i + 1, // idEmployee
          faker.person.lastName(),
          faker.person.firstName(),
          faker.number.int({ min: 100000000, max: 999999999 }), // SSN
          faker.finance.amount(10, 50, 2), // Pay_Rate
          faker.number.int({ min: 1, max: 5 }), // PayRates_id
          faker.number.int({ min: 5, max: 20 }), // Vacation_Days
          faker.number.int({ min: 0, max: 99 }), // Paid_To_Date
          faker.number.int({ min: 0, max: 99 }), // Paid_Last_Year
        ]);
      }

      await connection.query(
        'INSERT INTO employee (Employee_Number, idEmployee, Last_Name, First_Name, SSN, Pay_Rate, PayRates_id, Vacation_Days, Paid_To_Date, Paid_Last_Year) VALUES ?;',
        [employeeData]
      );

      console.log(`✅ Inserted ${Math.min(batchStart + batchSize, totalRecords)} records`);
    }

    await connection.commit(); // 🚀 Commit tất cả một lần
    console.log('🎉 All employees inserted successfully!');
  } catch (error) {
    await connection.rollback(); // Nếu lỗi thì rollback
    console.error('❌ Error inserting data:', error);
  } finally {
    connection.release();
    console.log('Database seeding completed.');
  }
}

seedDatabase();
