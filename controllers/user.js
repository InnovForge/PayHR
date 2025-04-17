const { sqls } = require('./../config/sqls');
const { mysql } = require('./../config/mysql');
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
  try {

    const employee = req.body;
    // if (!employee || !employee.employeeID) {
    //   return res.render('pages/user/createdb', {
    //     status: {
    //       error: 'Employee ID is required'
    //     }
    //   });
    // }
    // console.log(req.body);


    const mysqlData = {
      Employee_ID: employee.employeeID,
      Employee_Number: employee.employeeNumber,
      Last_Name: employee.lastName,
      First_Name: employee.firstName,
      SSN: employee.ssn,
      Pay_Rate: employee.payRate,
      Pay_Rate_ID: employee.payRateID,
      Vacation_Days: employee.vacationDays,
      Paid_To_Date: employee.paidToDate,
      Paid_Last_Year: employee.paidLastYear
    }
    // const conn = mysql.getConnection();
    const conn = await mysql.beginTransaction();
  
    await conn.query('INSERT INTO employee SET ?', mysqlData, (err, result) => {
      if (err) {
        conn.rollback();
        console.error('Error inserting data into MySQL:', err);
        return res.status(500).send('Internal Server Error');
      }
      console.log('Data inserted into MySQL:', result);
    });



    const firstName = employee.firstName;
    const lastName = employee.lastName;
    const middleInitial = employee.middleInitial
    const address1 = employee.address1;
    const address2 = employee.address2;
    const city = employee.city;
    const state = employee.state;
    const zip = employee.zip;
    const email = employee.email;
    const phone = employee.phoneNumber;
    const ssn = employee.ssn
    const driversLicense = employee.driversLicense;
    const maritalStatus = employee.maritalStatus
    const gender = employee.gender;
    const shareholderStatus = employee.shareholderStatus;
    const benefitPlans = employee.benefitPlans;
    const ethnicity = employee.ethnicity;


    let queries = [];
    // Thực hiện chèn dữ liệu
    // const query = sqls.request()
    //     .input('Employee_ID', sql.Numeric, i)
    //     .input('First_Name', sql.NVarChar, firstName)
    //     .input('Last_Name', sql.NVarChar, lastName)
    //     .input('Middle_Initial', sql.NVarChar, middleInitial)
    //     .input('Address1', sql.NVarChar, address1)
    //     .input('Address2', sql.NVarChar, address2)
    //     .input('City', sql.NVarChar, city)
    //     .input('State', sql.NVarChar, state)
    //     .input('Zip', sql.Numeric, zip)
    //     .input('Email', sql.NVarChar, email)
    //     .input('Phone_Number', sql.NVarChar, phone)
    //     .input('Social_Security_Number', sql.NVarChar, ssn)
    //     .input('Drivers_License', sql.NVarChar, driversLicense)
    //     .input('Marital_Status', sql.NVarChar, maritalStatus)
    //     .input('Gender', sql.Bit, gender)
    //     .input('Shareholder_Status', sql.Int, shareholderStatus)

    //     .input('Ethnicity', sql.NVarChar, ethnicity)
    //     .query(`
    //         INSERT INTO [dbo].[Personal] 
    //         ([Employee_ID], [First_Name], [Last_Name], [Middle_Initial], [Address1], [Address2], [City], [State], [Zip], [Email], 
    //          [Phone_Number], [Social_Security_Number], [Drivers_License], [Marital_Status], [Gender], [Shareholder_Status], [Ethnicity]) 
    //         VALUES (@Employee_ID, @First_Name, @Last_Name, @Middle_Initial, @Address1, @Address2, @City, @State, @Zip, @Email, 
    //                 @Phone_Number, @Social_Security_Number, @Drivers_License, @Marital_Status, @Gender, @Shareholder_Status, @Ethnicity);
    //     `);

    // queries.push(query);

    console.log(mysqlData);



    const sqlData = {

    }
    res.render('pages/user/createdb', { employee: {} });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).send('Internal Server Error');
  }
};
