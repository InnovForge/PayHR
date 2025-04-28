require('dotenv').config();
const sql = require('mssql')
const { mysql } = require('./../config/mysql');
const { sqls } = require('./../config/sqls');

const kafka = require('../config/kafka');
const clients = require('../websocket');

async function startConsumerRealTime() {
  const consumer = kafka.consumer({ groupId: 'sync-hr-payroll-consumer' });
  await consumer.connect();
  await consumer.subscribe({ topics: ['payroll-created', 'payroll-updated', 'payroll-deleted', 'hr-created', 'hr-updated', 'hr-deleted'], fromBeginning: false },);

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value.toString());

        switch (topic) {
          case 'payroll-created':
            await processPayrollUpdate(data, "new_data");
            break;
          case 'payroll-updated':
            await processPayrollUpdate(data, "update_data");
            break;
          case 'payroll-deleted':
            await processPayrollDelete(data);
            break;
          case 'hr-created':
            await processHRUpdate(data, "new_data");
            break;
          case 'hr-updated':
            await processHRUpdate(data, "update_data");
            break;
          case 'hr-deleted':
            await processHRDelete(data);
            break;
          default:
            console.log(`Unhandled topic: ${topic}`);
            break;
        }

      } catch (err) {
        console.error(`Error processing message on topic "${topic}":`, err);
        // Optionally: Gửi vào dead-letter queue hoặc log ra file
      }
    },
  });
}

async function fetchPersonalData(employeeId) {
  try {
    await sqls.connect();
    const sqlResult = await sqls.query`SELECT * FROM Personal WHERE Employee_ID = ${employeeId}`;
    const sqlEmployee = sqlResult.recordset[0];

    return sqlEmployee;
  } catch (error) {
    console.error(`Error fetching employee data for ID ${employeeId}:`, error);
    return null
  }
}

async function fetchEmployeeData(employeeId) {
  try {
    const [mysqlRows] = await mysql.query('SELECT * FROM employee WHERE idEmployee = ?', [employeeId]);
    const mysqlEmployee = mysqlRows[0];;
    return mysqlEmployee
  } catch (error) {
    console.error(`Error fetching employee data for ID ${employeeId}:`, error);
    return null
  }
}

function mergeEmployeeData(mysqlEmployee, sqlEmployee, id) {
  const merged = { Employee_ID: id, ...mysqlEmployee, ...sqlEmployee };

  if (mysqlEmployee && sqlEmployee) {
    Object.keys(merged).forEach(key => {
      const a = mysqlEmployee[key];
      const b = sqlEmployee[key];
      if (a !== undefined && b !== undefined && a !== b) {
        merged[key] = `${a} (${b})`;
      } else if (a === undefined) {
        merged[key] = b;
      }
    });
    return merged;
  }

  return null;
}

async function processPayrollUpdate(data, type) {
  console.log('Received payroll update:', data);
  const employeeId = data.idEmployee || data.employeeNumber;
  const emp = {
    Employee_ID: data.idEmployee,
    Employee_Number: data.employeeNumber,
    Last_Name: data.lastName,
    First_Name: data.firstName,
    SSN: data.ssn,
    Pay_Rate: data.payRate,
    Pay_Rate_ID: data.payRatesId,
    Vacation_Days: data.vacationDays,
    Paid_To_Date: data.paidToDate,
    Paid_Last_Year: data.paidLastYear
  }
  const sqlEmployee = await fetchPersonalData(employeeId)
  console.log("sqlEmployee:", sqlEmployee);
  if (sqlEmployee) {
    const merged = mergeEmployeeData(emp, sqlEmployee, employeeId);
    console.log("Merged data:", merged);
    clients.broadcast(JSON.stringify({ type, data: merged }));
    return
  }

  clients.broadcast(JSON.stringify({ type, data: emp }));
  console.log("not merge:", emp);
}

async function processPayrollDelete(data) {
  const emp = {
    Employee_ID: data.idEmployee,
    Employee_Number: data.employeeNumber,
    Last_Name: data.lastName,
    First_Name: data.firstName,
    SSN: data.ssn,
    Pay_Rate: data.payRate,
    Pay_Rate_ID: data.payRatesId,
    Vacation_Days: data.vacationDays,
    Paid_To_Date: data.paidToDate,
    Paid_Last_Year: data.paidLastYear
  }
  clients.broadcast(JSON.stringify({ type: 'delete_data', data: emp }));
}


async function processHRUpdate(data, type) {
  console.log('Received HR update_create:', data);
  const employeeId = data.Employee_ID;
  const mysqlEmployee = await fetchEmployeeData(employeeId)
  const emp = {
    Employee_ID: mysqlEmployee.idEmployee,
    Employee_Number: mysqlEmployee.Employee_Number,
    Last_Name: mysqlEmployee.Last_Name,
    First_Name: mysqlEmployee.First_Name,
    SSN: mysqlEmployee.SSN,
    Pay_Rate: mysqlEmployee.Pay_Rate,
    Pay_Rate_ID: mysqlEmployee.Pay_Rates_id,
    Vacation_Days: mysqlEmployee.Vacation_Days,
    Paid_To_Date: mysqlEmployee.Paid_To_Date,
    Paid_Last_Year: mysqlEmployee.Paid_Last_Year
  }
  if (mysqlEmployee) {
    const merged = mergeEmployeeData(emp, data, employeeId);
    console.log("Merged data:", merged);
    clients.broadcast(JSON.stringify({ type, data: merged }));
    return
  }
  clients.broadcast(JSON.stringify({ type, data: data }));
  console.log("not merge:", emp);
}

async function processHRDelete(data) {
  console.log('Received HR delete:', data);
  clients.broadcast(JSON.stringify({ type: 'delete_data', data: data }));
}

module.exports = startConsumerRealTime;
