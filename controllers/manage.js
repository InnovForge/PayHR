const { mysql } = require('./../config/mysql');
const { sqls } = require('./../config/sqls');

exports.renderManage = async (req, res) => {
  try {
    const [mysqlRows] = await mysql.query('SELECT * FROM employee');
    await sqls.connect();
    const sqlResult = await sqls.query('SELECT * FROM Personal');

    const mergedData = [];

    mysqlRows.forEach(mysqlEmp => {
      const sqlEmp = sqlResult.recordset.find(r => r.Employee_ID === mysqlEmp.idEmployee);

      if (sqlEmp) { 
        const mergedRecord = {
          Employee_ID: mysqlEmp.idEmployee || sqlEmp.Employee_ID,
          ...mysqlEmp,
          ...sqlEmp
        };

        Object.keys(mergedRecord).forEach(field => {
          const mysqlValue = mysqlEmp[field];
          const sqlValue = sqlEmp[field];

          if (mysqlValue !== undefined && sqlValue !== undefined && mysqlValue !== sqlValue) {
            mergedRecord[field] = `${mysqlValue} (${sqlValue})`;
          } else if (mysqlValue === undefined && sqlValue !== undefined) {
            mergedRecord[field] = sqlValue;
          } else if (sqlValue === undefined && mysqlValue !== undefined) {
            mergedRecord[field] = mysqlValue;
          }
        });

        mergedRecord.isNew = false;
        mergedData.push(mergedRecord);
      } else { 
        mergedData.push({
          Employee_ID: mysqlEmp.idEmployee,
          ...mysqlEmp,
          isNew: true
        });
      }
    });

    sqlResult.recordset.forEach(sqlEmp => {
      const mysqlEmp = mysqlRows.find(emp => emp.idEmployee === sqlEmp.Employee_ID);

      if (!mysqlEmp) { 
        mergedData.push({
          Employee_ID: sqlEmp.Employee_ID,
          ...sqlEmp,
          isNew: true
        });
      }
    });

    res.render('pages/manage', { employees: mergedData });

  } catch (error) {
    console.error('Error fetching and merging data:', error);
    res.status(500).send('Server error');
  }
};
