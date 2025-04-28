const { sendToKafka } = require('../kafka/producer');

const { mysql } = require('./../config/mysql');
const { sqls } = require('./../config/sqls');
const sql = require('mssql');

// exports.renderManage = async (req, res) => {
//   try {
//     const [mysqlRows] = await mysql.query('SELECT * FROM employee');
//     await sqls.connect();
//     const sqlResult = await sqls.query('SELECT * FROM Personal');

//     const mergedData = [];

//     mysqlRows.forEach(mysqlEmp => {
//       const sqlEmp = sqlResult.recordset.find(r => r.Employee_ID === mysqlEmp.idEmployee);

//       if (sqlEmp) { 
//         const mergedRecord = {
//           Employee_ID: mysqlEmp.idEmployee || sqlEmp.Employee_ID,
//           ...mysqlEmp,
//           ...sqlEmp
//         };

//         Object.keys(mergedRecord).forEach(field => {
//           const mysqlValue = mysqlEmp[field];
//           const sqlValue = sqlEmp[field];

//           if (mysqlValue !== undefined && sqlValue !== undefined && mysqlValue !== sqlValue) {
//             mergedRecord[field] = `${mysqlValue} (${sqlValue})`;
//           } else if (mysqlValue === undefined && sqlValue !== undefined) {
//             mergedRecord[field] = sqlValue;
//           } else if (sqlValue === undefined && mysqlValue !== undefined) {
//             mergedRecord[field] = mysqlValue;
//           }
//         });

//         mergedRecord.isNew = false;
//         mergedData.push(mergedRecord);
//       } else { 
//         mergedData.push({
//           Employee_ID: mysqlEmp.idEmployee,
//           ...mysqlEmp,
//           isNew: true
//         });
//       }
//     });

//     sqlResult.recordset.forEach(sqlEmp => {
//       const mysqlEmp = mysqlRows.find(emp => emp.idEmployee === sqlEmp.Employee_ID);

//       if (!mysqlEmp) { 
//         mergedData.push({
//           Employee_ID: sqlEmp.Employee_ID,
//           ...sqlEmp,
//           isNew: true
//         });
//       }
//     });

//     res.render('pages/manage', { employees: mergedData });

//   } catch (error) {
//     console.error('Error fetching and merging data:', error);
//     res.status(500).send('Server error');
//   }
// };

exports.renderManage = async (req, res) => {
  res.render('pages/manage/manage-list', { employees: [] });
}

exports.getEmployeeById = async (req, res) => {
  const employeeId = req.params.id;
  let mysqlEmployee = null;
  let sqlEmployee = null;

  try {
    const [mysqlRows] = await mysql.query(
      'SELECT * FROM employee WHERE idEmployee = ?',
      [employeeId]
    );
    mysqlEmployee = mysqlRows[0];
    // console.log("mysql", mysqlEmployee)
  } catch (err) {
    console.warn('Failed to query MySQL employee:', err.message);
  }

  try {
    await sqls.connect();
    const sqlResult = await sqls.query`SELECT * FROM Personal WHERE Employee_ID = ${employeeId}`;
    // console.log("sql", sqlResult.recordset)
    sqlEmployee = sqlResult.recordset[0];
  } catch (err) {
    console.warn('Failed to query SQL Server employee:', err.message);
  }

  if (!mysqlEmployee && !sqlEmployee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  res.render('pages/manage/manage-edit', { mysql: mysqlEmployee, sql: sqlEmployee });
}

exports.deleteEmployeeById = async (req, res) => {
  const employeeId = req.params.id;
  const mysqlTransaction = await mysql.getConnection();
  await mysqlTransaction.beginTransaction();

  const sqlTransaction = await sqls.transaction();
  await sqlTransaction.begin();

  try {
    await mysqlTransaction.query('DELETE FROM employee WHERE idEmployee = ?', [employeeId]);
    await sqls.request(sqlTransaction).query(`DELETE FROM Personal WHERE Employee_ID = ${employeeId}`)
    await mysqlTransaction.commit();
    await sqlTransaction.commit();
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    await mysqlTransaction.rollback();
    await mysqlTransaction.rollback();
    console.error('Error deleting employee:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting employee' });
  }
}

function isValidDecimal10_2(value) {
  if (typeof value !== 'string') {
    value = value.toString();
  }

  const decimalRegex = /^-?\d{1,8}(\.\d{1,2})?$/;

  return decimalRegex.test(value);
}


exports.updateEmployeeById = async (req, res) => {
  const employeeId = req.params.id;
  const employeeData = req.body;

  // console.log(employeeData)
  let mysqlTransaction;
  let sqlTransaction;

  try {

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }
    const errors = [];

    // Only validate fields that are NOT NULL in the database
    if (employeeData.gender === undefined || employeeData.gender === null) {
      errors.push("Gender is required.");
    }
    if (employeeData.shareholderStatus === undefined || employeeData.shareholderStatus === null) {
      errors.push("Shareholder Status is required.");
    }
    if (employeeData.paidToDate && !isValidDecimal10_2(employeeData.paidToDate)) {
      errors.push("Paid To Date must be a valid decimal(10,2) number.");
    }

    if (employeeData.paidLastYear && !isValidDecimal10_2(employeeData.paidLastYear)) {
      errors.push("Paid Last Year must be a valid decimal(10,2) number.");
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors
      });
    }

    sendToKafka("update-intergation", { type: "update", employeeId, data: employeeData });
    // Kết nối với MySQL và bắt đầu transaction
    // mysqlTransaction = await mysql.getConnection();
    // await mysqlTransaction.beginTransaction();

    // // Kết nối với SQL Server và bắt đầu transaction
    // sqlTransaction = await sqls.transaction();
    // await sqlTransaction.begin();

    // // Dữ liệu cần cập nhật cho MySQL
    // const mysqlData = {
    //   First_Name: employeeData.firstName,
    //   Last_Name: employeeData.lastName,
    //   SSN: employeeData.ssn,
    //   Pay_Rate: employeeData.payRate,
    //   PayRates_id: employeeData.payRatesId,
    //   Vacation_Days: employeeData.vacationDays,
    //   Paid_To_Date: employeeData.paidToDate,
    //   Paid_Last_Year: employeeData.paidLastYear
    // };

    // // Cập nhật dữ liệu vào MySQL
    // await mysqlTransaction.query('UPDATE employee SET ? WHERE idEmployee = ?', [mysqlData, employeeId]);

    // // Dữ liệu cần cập nhật cho SQL Server
    // const sqlData = {
    //   First_Name: employeeData.firstNameSql,
    //   Last_Name: employeeData.lastNameSql,
    //   Middle_Initial: employeeData.middleInitial,
    //   Address1: employeeData.address,
    //   Address2: employeeData.address2,
    //   City: employeeData.city,
    //   State: employeeData.state,
    //   Zip: employeeData.zip,
    //   Email: employeeData.email,
    //   Phone_Number: employeeData.phone,
    //   Social_Security_Number: employeeData.socialSecurityNumber,
    //   Drivers_License: employeeData.driversLicense,
    //   Marital_Status: employeeData.maritalStatus,
    //   Gender: employeeData.gender,
    //   Shareholder_Status: employeeData.shareholderStatus,
    //   Ethnicity: employeeData.ethnicity
    // };

    // // Cập nhật dữ liệu vào SQL Server
    // await sqls.request(sqlTransaction)
    //   .input('Employee_ID', sql.Numeric, employeeId)
    //   .input('First_Name', sql.NVarChar, sqlData.First_Name)
    //   .input('Last_Name', sql.NVarChar, sqlData.Last_Name)
    //   .input('Middle_Initial', sql.NVarChar, sqlData.Middle_Initial)
    //   .input('Address1', sql.NVarChar, sqlData.Address1)
    //   .input('Address2', sql.NVarChar, sqlData.Address2)
    //   .input('City', sql.NVarChar, sqlData.City)
    //   .input('State', sql.NVarChar, sqlData.State)
    //   .input('Zip', sql.Numeric, sqlData.Zip)
    //   .input('Email', sql.NVarChar, sqlData.Email)
    //   .input('Phone_Number', sql.NVarChar, sqlData.Phone_Number)
    //   .input('Social_Security_Number', sql.NVarChar, sqlData.Social_Security_Number)
    //   .input('Drivers_License', sql.NVarChar, sqlData.Drivers_License)
    //   .input('Marital_Status', sql.NVarChar, sqlData.Marital_Status)
    //   .input('Gender', sql.Bit, sqlData.Gender)
    //   .input('Shareholder_Status', sql.Int, sqlData.Shareholder_Status)
    //   .input('Ethnicity', sql.NVarChar, sqlData.Ethnicity)
    //   .query(`
    //     UPDATE [dbo].[Personal]
    //     SET 
    //       [First_Name] = @First_Name,
    //       [Last_Name] = @Last_Name,
    //       [Middle_Initial] = @Middle_Initial,
    //       [Address1] = @Address1,
    //       [Address2] = @Address2,
    //       [City] = @City,
    //       [State] = @State,
    //       [Zip] = @Zip,
    //       [Email] = @Email,
    //       [Phone_Number] = @Phone_Number,
    //       [Social_Security_Number] = @Social_Security_Number,
    //       [Drivers_License] = @Drivers_License,
    //       [Marital_Status] = @Marital_Status,
    //       [Gender] = @Gender,
    //       [Shareholder_Status] = @Shareholder_Status,
    //       [Ethnicity] = @Ethnicity
    //     WHERE [Employee_ID] = @Employee_ID
    //   `);

    // // Commit transactions
    // await mysqlTransaction.commit();
    // await sqlTransaction.commit();

    // Trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Employee update'
    });

  } catch (err) {
    console.error('Error updating employee:', err.message);

    // Rollback transactions trong trường hợp có lỗi
    if (mysqlTransaction) await mysqlTransaction.rollback();
    if (sqlTransaction) await sqlTransaction.rollback();

    // Trả về lỗi
    res.status(500).json({ message: 'Error updating employee' });
  }
};

exports.getAllEmployees = async (req, res) => {
  const limit = 20;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  let mysqlEmployeeIds = [];
  let sqlEmployeeIds = [];
  let mysqlConnected = true;
  let sqlConnected = true;

  // Get IDs from MySQL
  try {
    const [mysqlIds] = await mysql.query(
      'SELECT idEmployee FROM employee ORDER BY idEmployee DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    mysqlEmployeeIds = mysqlIds.map(emp => emp.idEmployee);
  } catch (err) {
    mysqlConnected = false;
    console.warn('MySQL connection failed:', err.message);
  }

  // Get IDs from SQL Server
  try {
    await sqls.connect();
    const sqlResult = await sqls.query(
      `SELECT Employee_ID FROM Personal ORDER BY Employee_ID DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
    );
    sqlEmployeeIds = sqlResult.recordset.map(emp => emp.Employee_ID);
  } catch (err) {
    sqlConnected = false;
    console.warn('SQL Server connection failed:', err.message);
  }

  const allEmployeeIds = Array.from(new Set([...mysqlEmployeeIds, ...sqlEmployeeIds]));

  let mysqlRows = [];
  let sqlRows = [];

  if (mysqlConnected && allEmployeeIds.length > 0) {
    try {
      [mysqlRows] = await mysql.query(
        'SELECT * FROM employee WHERE idEmployee IN (?)',
        [allEmployeeIds]
      );
    } catch (err) {
      console.warn('Failed to query MySQL employee details:', err.message);
    }
  }

  if (sqlConnected && allEmployeeIds.length > 0) {
    try {
      const result = await sqls.query(
        `SELECT * FROM Personal WHERE Employee_ID IN (${allEmployeeIds.join(',')})`
      );
      sqlRows = result.recordset;
    } catch (err) {
      console.warn('Failed to query SQL Server employee details:', err.message);
    }
  }

  const mergedData = allEmployeeIds.map(id => {
    const mysqlEmp = mysqlRows.find(emp => emp.idEmployee === id);
    const sqlEmp = sqlRows.find(emp => emp.Employee_ID === id);

    if (mysqlEmp && sqlEmp) {
      const merged = { Employee_ID: id, ...mysqlEmp, ...sqlEmp };
      Object.keys(merged).forEach(key => {
        const a = mysqlEmp[key];
        const b = sqlEmp[key];
        if (a !== undefined && b !== undefined && a !== b) {
          merged[key] = `${a} (${b})`;
        } else if (a === undefined) {
          merged[key] = b;
        }
      });
      merged.isNew = false;
      return merged;
    }

    if (mysqlEmp) return { Employee_ID: id, ...mysqlEmp, isNew: true };
    if (sqlEmp) return { Employee_ID: id, ...sqlEmp, isNew: true };
  });

  const hasMore = (mysqlConnected && mysqlEmployeeIds.length === limit)
    || (sqlConnected && sqlEmployeeIds.length === limit);

  res.status(200).json({
    employees: mergedData,
    hasMore
  });
};
