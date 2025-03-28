const { mysql } = require('./../config/mysql');
const { sqls } = require('./../config/sqls');

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
  res.render('pages/manage', { employees:[] });
}

exports.getAllEmployees = async (req, res) => {
  try {
    const limit = 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    let mysqlEmployeeIds = [];
    let sqlEmployeeIds = [];

    try {
      const [mysqlIds] = await mysql.query(
        'SELECT idEmployee FROM employee ORDER BY idEmployee DESC LIMIT ? OFFSET ?', 
        [limit, offset]
      );
      mysqlEmployeeIds = mysqlIds.map(emp => emp.idEmployee);
    } catch (err) {
      console.warn('Unable to connect to MySQL:', err.message);
    }

    try {
      await sqls.connect();
      const sqlResult = await sqls.query(
        `SELECT Employee_ID FROM Personal ORDER BY Employee_ID DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
      );
      sqlEmployeeIds = sqlResult.recordset.map(emp => emp.Employee_ID);
    } catch (err) {
      console.warn('Unable to connect to SQL Server:', err.message);
    }

    let allEmployeeIds;
    if (mysqlEmployeeIds.length === 0) {
      allEmployeeIds = sqlEmployeeIds;
    } else if (sqlEmployeeIds.length === 0) {
      allEmployeeIds = mysqlEmployeeIds;
    } else {
      allEmployeeIds = Array.from(new Set([...mysqlEmployeeIds, ...sqlEmployeeIds]));
    }


    let mysqlRows = [], sqlDetails = { recordset: [] };

    if (mysqlEmployeeIds.length > 0) {
      try {
        [mysqlRows] = await mysql.query(
          'SELECT * FROM employee WHERE idEmployee IN (?)', 
          [allEmployeeIds]
        );
      } catch (err) {
        console.warn('Error querying MySQL:', err.message);
      }
    }

    if (sqlEmployeeIds.length > 0) {
      try {
        sqlDetails = await sqls.query(
          `SELECT * FROM Personal WHERE Employee_ID IN (${allEmployeeIds.join(',')})`
        );
      } catch (err) {
        console.warn('Error querying SQL Server:', err.message);
      }
    }

  
    const mergedData = [];

    allEmployeeIds.forEach(id => {
      const mysqlEmp = mysqlRows.find(emp => emp.idEmployee === id);
      const sqlEmp = sqlDetails.recordset.find(emp => emp.Employee_ID === id);

      if (mysqlEmp && sqlEmp) {
        const mergedRecord = { Employee_ID: id, ...mysqlEmp, ...sqlEmp };

        Object.keys(mergedRecord).forEach(field => {
          const mysqlValue = mysqlEmp[field];
          const sqlValue = sqlEmp[field];

          if (mysqlValue !== undefined && sqlValue !== undefined && mysqlValue !== sqlValue) {
            mergedRecord[field] = `${mysqlValue} (${sqlValue})`;
          } else if (mysqlValue === undefined) {
            mergedRecord[field] = sqlValue;
          }
        });

        mergedRecord.isNew = false;
        mergedData.push(mergedRecord);
      } else if (mysqlEmp) {
        mergedData.push({ Employee_ID: id, ...mysqlEmp, isNew: true });
      } else if (sqlEmp) {
        mergedData.push({ Employee_ID: id, ...sqlEmp, isNew: true });
      }
    });

    res.status(200).json({
      employees: mergedData,
      hasMore: mysqlEmployeeIds.length > 0 || sqlEmployeeIds.length > 0
    });

  } catch (error) {
    console.error('General error:', error);
    res.status(500).send('Internal server error');
  }
};