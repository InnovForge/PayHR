require('dotenv').config();
const express = require('express');
const path = require('path');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const expressLayouts = require('express-ejs-layouts');
const routes = require('./routes');
const { sqls } = require('./config/sqls');
const { mysql } = require('./config/mysql');

const liveReloadServer = livereload.createServer();

liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

const app = express();

app.use(connectLiveReload());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

app.use('/', routes);

app.get('/', function (req, res) {
  res.redirect('/dashboard');
});

// NOTE: This is just a sample code to test the connection to the database
app.get('/api/sqls', function (req, res) {
  sqls.query('SELECT * FROM Personal', function (err, rows) {
    if (err) {
      console.log(err);
    }
    res.json(rows);
  });
});

app.get('/api/mysql', async function (req, res) {
  const [rows] = await mysql.query('SELECT * FROM users');
  res.json(rows);
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`Server is listening on port http://localhost:${PORT}`);
});
