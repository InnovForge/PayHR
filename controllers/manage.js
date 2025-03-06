const { mysql } = require('./../config/mysql');
const {  sqls } = require('./../config/sqls');

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
        };

        Object.keys(mergedRecord).forEach(field => {
          const mysqlValue = mergedRecord[field];
          const sqlValue = sqlEmp[field];

          if (mysqlValue !== null && mysqlValue !== undefined && sqlValue !== null && sqlValue !== undefined) {
            if (mysqlValue !== sqlValue) {
              mergedRecord[field] = `${mysqlValue} (${sqlValue})`;
            }
          } else if (mysqlValue === null && sqlValue !== null) {
            mergedRecord[field] = sqlValue;
          } else if (sqlValue === null && mysqlValue !== null) {
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
