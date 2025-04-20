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
