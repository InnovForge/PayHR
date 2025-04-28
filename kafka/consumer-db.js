require('dotenv').config();
const { mysql } = require('../config/mysql');
const { sqls } = require('../config/sqls');
const sql = require('mssql')

const kafka = require('../config/kafka');
const clients = require('../websocket');

const consumer = kafka.consumer({ groupId: 'update-db' });

async function startConsumerDb() {
  await consumer.connect();
  await consumer.subscribe({ topics: ['update-intergation'], fromBeginning: true },);

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        console.log('Received integration data:', data);

        switch (topic) {
          case 'update-intergation':
            await processIntegrationData(data);
            break;
          default:
            console.log(`Unhandled topic: ${topic}`);
            break;
        }

      } catch (err) {
        console.error(`Error processing message on topic "${topic}":`, err);
      }
    },
  });
}


async function processIntegrationData(data) {
  console.log('Received integration data:', data);

  const employeeData = data.data;
  const employeeId = data.employeeId

  const mysqlTransaction = await mysql.getConnection();
  const sqlTransaction = await sqls.transaction();

  try {
    // Kết nối với SQL Server và bắt đầu transaction

    await sqlTransaction.begin();
    await mysqlTransaction.beginTransaction();
    // Dữ liệu cần cập nhật cho MySQL
    const mysqlData = {
      First_Name: employeeData.firstName,
      Last_Name: employeeData.lastName,
      SSN: employeeData.ssn,
      Pay_Rate: employeeData.payRate,
      PayRates_id: employeeData.payRatesId,
      Vacation_Days: employeeData.vacationDays,
      Paid_To_Date: employeeData.paidToDate,
      Paid_Last_Year: employeeData.paidLastYear
    };

    // Cập nhật dữ liệu vào MySQL
    await mysqlTransaction.query('UPDATE employee SET ? WHERE idEmployee = ?', [mysqlData, employeeId]);

    // Dữ liệu cần cập nhật cho SQL Server
    const sqlData = {
      First_Name: employeeData.firstNameSql,
      Last_Name: employeeData.lastNameSql,
      Middle_Initial: employeeData.middleInitial,
      Address1: employeeData.address,
      Address2: employeeData.address2,
      City: employeeData.city,
      State: employeeData.state,
      Zip: employeeData.zip,
      Email: employeeData.email,
      Phone_Number: employeeData.phone,
      Social_Security_Number: employeeData.socialSecurityNumber,
      Drivers_License: employeeData.driversLicense,
      Marital_Status: employeeData.maritalStatus,
      Gender: parseInt(employeeData.gender),
      Shareholder_Status: employeeData.shareholderStatus,
      Ethnicity: employeeData.ethnicity
    };

    // Cập nhật dữ liệu vào SQL Server
    await sqls.request(sqlTransaction)
      .input('Employee_ID', sql.Numeric, employeeId)
      .input('First_Name', sql.NVarChar, sqlData.First_Name)
      .input('Last_Name', sql.NVarChar, sqlData.Last_Name)
      .input('Middle_Initial', sql.NVarChar, sqlData.Middle_Initial)
      .input('Address1', sql.NVarChar, sqlData.Address1)
      .input('Address2', sql.NVarChar, sqlData.Address2)
      .input('City', sql.NVarChar, sqlData.City)
      .input('State', sql.NVarChar, sqlData.State)
      .input('Zip', sql.Numeric, sqlData.Zip)
      .input('Email', sql.NVarChar, sqlData.Email)
      .input('Phone_Number', sql.NVarChar, sqlData.Phone_Number)
      .input('Social_Security_Number', sql.NVarChar, sqlData.Social_Security_Number)
      .input('Drivers_License', sql.NVarChar, sqlData.Drivers_License)
      .input('Marital_Status', sql.NVarChar, sqlData.Marital_Status)
      .input('Gender', sql.Bit, sqlData.Gender)
      .input('Shareholder_Status', sql.Int, sqlData.Shareholder_Status)
      .input('Ethnicity', sql.NVarChar, sqlData.Ethnicity)
      .query(`
        UPDATE [dbo].[Personal]
        SET 
          [First_Name] = @First_Name,
          [Last_Name] = @Last_Name,
          [Middle_Initial] = @Middle_Initial,
          [Address1] = @Address1,
          [Address2] = @Address2,
          [City] = @City,
          [State] = @State,
          [Zip] = @Zip,
          [Email] = @Email,
          [Phone_Number] = @Phone_Number,
          [Social_Security_Number] = @Social_Security_Number,
          [Drivers_License] = @Drivers_License,
          [Marital_Status] = @Marital_Status,
          [Gender] = @Gender,
          [Shareholder_Status] = @Shareholder_Status,
          [Ethnicity] = @Ethnicity
        WHERE [Employee_ID] = @Employee_ID
      `);

    await mysqlTransaction.commit();
    await sqlTransaction.commit();
  }
  catch (error) {
    console.error('Error during transaction:', error);
    await mysqlTransaction.rollback();
    await sqlTransaction.rollback();
    throw error;
  } finally {
    mysqlTransaction.release();
    sqlTransaction.release();
  }

}

async function waitForKafkaResult(correlationId, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {

    consumer.off('message', onMessage); // hủy lắng nghe nếu timeout
      resolve(null); // timeout thì resolve null
    }, timeoutMs);

    
    function onMessage(msg) {
      // Giả sử msg là dạng object đã parse
      if (msg.correlationId === correlationId) {
        clearTimeout(timeout);
        consumer.
      
        resolve(msg);
      }
    }

    consumer.on('message', onMessage);
  });
}

module.exports = {
  startConsumerDb,
  waitForKafkaResult
};
