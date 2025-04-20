const { sqls } = require('./../config/sqls');
const { mysql } = require('./../config/mysql');
const sql = require('mssql');

exports.renderListUser = (req, res) => {
  res.render('pages/user/list');
};
exports.renderCreateUser = (req, res) => {
  res.render('pages/user/create');
};

exports.renderCreateDB = (req, res) => {
  res.render('pages/user/createdb', {
    employee: {
    }
  });
};

exports.createDB = async (req, res) => {

  let mysqlTransaction;
  let sqlTransaction;

  try {
    const employee = req.body;

    if (!employee.employeeID) {
    return res.status(500).json({
        success: false,
        message: "Please fill in all required employee information."
      })
    }
    mysqlTransaction = await mysql.getConnection();
    await mysqlTransaction.beginTransaction();

    sqlTransaction = await sqls.transaction();
    await sqlTransaction.begin();

    const mysqlData = {
      idEmployee: employee.employeeID,
      Employee_Number: employee.employeeNumber,
      Last_Name: employee.lastName,
      First_Name: employee.firstName,
      SSN: employee.ssn,
      Pay_Rate: employee.payRate,
      PayRates_id: employee.payRateID,
      Vacation_Days: employee.vacationDays,
      Paid_To_Date: employee.paidToDate,
      Paid_Last_Year: employee.paidLastYear
    };

    console.log("emp", req.body)
    await mysqlTransaction.query('INSERT INTO employee SET ?', mysqlData);

    await sqls.request(sqlTransaction)
      .input('Employee_ID', sql.Numeric, employee.employeeID)
      .input('First_Name', sql.NVarChar, employee.firstName)
      .input('Last_Name', sql.NVarChar, employee.lastName)
      .input('Middle_Initial', sql.NVarChar, employee.middleInitial)
      .input('Address1', sql.NVarChar, employee.address1)
      .input('Address2', sql.NVarChar, employee.address2)
      .input('City', sql.NVarChar, employee.city)
      .input('State', sql.NVarChar, employee.state)
      .input('Zip', sql.Numeric, employee.zip)
      .input('Email', sql.NVarChar, employee.email)
      .input('Phone_Number', sql.NVarChar, employee.phoneNumber)
      .input('Social_Security_Number', sql.NVarChar, employee.ssn)
      .input('Drivers_License', sql.NVarChar, employee.driversLicense)
      .input('Marital_Status', sql.NVarChar, employee.maritalStatus)
      .input('Gender', sql.Bit, employee.gender)
      .input('Shareholder_Status', sql.Int, employee.shareholderStatus)
      .input('Ethnicity', sql.NVarChar, employee.ethnicity)
      .query(`
        INSERT INTO [dbo].[Personal] (
          [Employee_ID], [First_Name], [Last_Name], [Middle_Initial], [Address1], [Address2], [City], [State], [Zip], [Email],
          [Phone_Number], [Social_Security_Number], [Drivers_License], [Marital_Status], [Gender], [Shareholder_Status], [Ethnicity]
        ) VALUES (
          @Employee_ID, @First_Name, @Last_Name, @Middle_Initial, @Address1, @Address2, @City, @State, @Zip, @Email,
          @Phone_Number, @Social_Security_Number, @Drivers_License, @Marital_Status, @Gender, @Shareholder_Status, @Ethnicity
        )
      `);

    await mysqlTransaction.commit();
    await sqlTransaction.commit();

   return res.status(200).json({
      success: true,
      message: "Data has been successfully created."
    });

  } catch (error) {

    if (mysqlTransaction) await mysqlTransaction.rollback().catch(err => console.error('Rollback MySQL failed:', err));
    if (sqlTransaction) await sqlTransaction.rollback().catch(err => console.error('Rollback SQL failed:', err));

    console.error('Transaction failed:', error);
   return res.status(500).json({
      success: false,
      message: "An error occurred while creating data. All changes were rolled back to maintain data integrity."
    })

  } finally {
    if (mysqlTransaction) mysqlTransaction.release?.();
  }
};
