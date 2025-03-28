const { mysql } = require('./../config/mysql');
const { sqls } = require('./../config/sqls');

exports.renderDashboard = async (req, res) => {
  try {
    let mysqlCount = 0;
    let sqlCount = 0;

    try {
      const [mysqlResult] = await mysql.query('SELECT COUNT(*) AS total FROM employee');
      mysqlCount = mysqlResult[0].total;
    } catch (err) {
      console.warn('⚠️ Unable to connect to MySQL:', err.message);
    }

    try {
      await sqls.connect();
      const sqlResult = await sqls.query('SELECT COUNT(*) AS total FROM Personal');
      sqlCount = sqlResult.recordset[0].total;
    } catch (err) {
      console.warn('⚠️ Unable to connect to SQL Server:', err.message);
    }

    const totalEmployees = mysqlCount + sqlCount;

    res.render('pages/dashboard', { 
      totalEmployees, 
      mysqlCount, 
      sqlCount, 
      dbStatus: {
        mysql: mysqlCount > 0 ? '🟢 Connected' : '🔴 Not connected',
        sqlserver: sqlCount > 0 ? '🟢 Connected' : '🔴 Not connected'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching employee count:', error);
    res.render('pages/dashboard', { 
      totalEmployees: 'Data unavailable', 
      mysqlCount: 0, 
      sqlCount: 0,
      dbStatus: {
        mysql: '🔴 Not connected',
        sqlserver: '🔴 Not connected'
      }
    });
  }
};
