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

// Hàm kiểm tra Employee_ID có tồn tại không
async function checkEmployeeExists(pool, employeeID) {
    const result = await pool.request()
        .input('Employee_ID', sql.Numeric, employeeID)
        .query('SELECT COUNT(*) AS count FROM dbo.Personal WHERE Employee_ID = @Employee_ID');

    return result.recordset[0].count > 0;
}

// Hàm tạo dữ liệu giả và chèn vào Personal
async function insertFakePersonalData() {
    try {
        let pool = await sql.connect(sqlConfig);
        console.log('✅ Connected to SQL Server');

        let queries = [];
        for (let i = 1000; i <= 10000; i++) {
            // Kiểm tra nếu Employee_ID đã tồn tại, bỏ qua
            if (await checkEmployeeExists(pool, i)) {
                console.log(`⚠️ Employee_ID ${i} đã tồn tại, bỏ qua...`);
                continue;
            }

            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const middleInitial = faker.string.alpha(1).toUpperCase();
            const address1 = faker.location.streetAddress();
            const address2 = faker.datatype.boolean() ? faker.location.secondaryAddress() : null;
            const city = faker.location.city();
            const state = faker.location.state();
            const zip = faker.location.zipCode();
            const email = faker.internet.email({ firstName, lastName });
            const phone = faker.phone.number();
            const ssn = faker.string.numeric(9);
            const driversLicense = faker.string.alphanumeric(10);
            const maritalStatus = faker.helpers.arrayElement(['Single', 'Married', 'Divorced', 'Widowed']);
            const gender = parseInt(faker.helpers.arrayElement([0, 1]));
            const shareholderStatus = faker.datatype.boolean() ? 1 : 0;
            const benefitPlans = faker.number.int({ min: 100, max: 999 });
            const ethnicity = faker.helpers.arrayElement(['Asian', 'Black', 'White', 'Hispanic', 'Other']);

            // Thực hiện chèn dữ liệu
            const query = pool.request()
                .input('Employee_ID', sql.Numeric, i)
                .input('First_Name', sql.NVarChar, firstName)
                .input('Last_Name', sql.NVarChar, lastName)
                .input('Middle_Initial', sql.NVarChar, middleInitial)
                .input('Address1', sql.NVarChar, address1)
                .input('Address2', sql.NVarChar, address2)
                .input('City', sql.NVarChar, city)
                .input('State', sql.NVarChar, state)
                .input('Zip', sql.Numeric, zip)
                .input('Email', sql.NVarChar, email)
                .input('Phone_Number', sql.NVarChar, phone)
                .input('Social_Security_Number', sql.NVarChar, ssn)
                .input('Drivers_License', sql.NVarChar, driversLicense)
                .input('Marital_Status', sql.NVarChar, maritalStatus)
                .input('Gender', sql.Bit, gender)
                .input('Shareholder_Status', sql.Int, shareholderStatus)

                .input('Ethnicity', sql.NVarChar, ethnicity)
                .query(`
                    INSERT INTO [dbo].[Personal] 
                    ([Employee_ID], [First_Name], [Last_Name], [Middle_Initial], [Address1], [Address2], [City], [State], [Zip], [Email], 
                     [Phone_Number], [Social_Security_Number], [Drivers_License], [Marital_Status], [Gender], [Shareholder_Status], [Ethnicity]) 
                    VALUES (@Employee_ID, @First_Name, @Last_Name, @Middle_Initial, @Address1, @Address2, @City, @State, @Zip, @Email, 
                            @Phone_Number, @Social_Security_Number, @Drivers_License, @Marital_Status, @Gender, @Shareholder_Status, @Ethnicity);
                `);

            queries.push(query);

            // Chèn dữ liệu theo batch (mỗi 1000 bản ghi một lần)
            if (queries.length >= 1000) {
                await Promise.all(queries);
                console.log(`✅ Inserted up to Employee_ID: ${i}`);
                queries = []; // Reset batch
            }
        }

        // Chèn nốt dữ liệu còn lại
        if (queries.length > 0) {
            await Promise.all(queries);
        }

        console.log('🎉 All fake data inserted successfully!');
        await sql.close();
    } catch (err) {
        console.error('❌ SQL Error:', err);
    }
}

// Chạy script chèn dữ liệu
insertFakePersonalData();
