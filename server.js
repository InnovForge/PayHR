require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const expressLayouts = require('express-ejs-layouts');
const routes = require('./routes');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

app.use(express.json());
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



const wsClient = new WebSocket('ws://localhost:8080/springapp/socket');

wsClient.on('open', function open() {
  console.log('Connected to Spring Boot WebSocket');
  wsClient.send('Hello from Node.js');
});

wsClient.on('message', function message(data) {
  console.log('Received from Spring Boot:', data.toString());
  if (data.toString().includes('Hello from Spring Boot')) {
    const jsonMessage = { type: 'msg', message: 'Hello from Node.js WebSocket' };
    wsClient.send(JSON.stringify(jsonMessage));
  } else {
    wsClient.on('message', function message(data) {
      try {


        const jsonMessage = {
          type: 'new_data',
          data: data.data
        };
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(jsonMessage));
          }
        });
      } catch (error) {
        console.error('Error parsing received data:', error);
      }
    });

  }
});

wsClient.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

const wss = new WebSocket.Server({ server });

const clients = [];


wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.push(ws);


  // ws.on('message', (message) => {
  //   console.log('Received from client: ', message.toString());
  //   const response = { message: 'Hello from Node.js WebSocket server!', status: 'success' };
  //   ws.send(JSON.stringify(response));
  // });

  const welcomeMessage = { type: "msg", message: 'Welcome to WebSocket server', status: 'success' };
  ws.send(JSON.stringify(welcomeMessage));
});

app.post("/api/v1/partner/personal", async function (req, res) {
  console.log(req.body);
  const jsonMessage = { type: 'new_data', data: req.body };
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(jsonMessage));
    }
  });
  return res.json({ message: "success" });
});

// app.get('/api/v1/sqls', async function (req, res) {
//   await conn.connect();
//   const result = await conn.query('SELECT * FROM Personal');
//   console.log(result.recordset);
//   res.json(result.recordset);
// });


// app.get('/api/v1/mysql', async function (req, res) {
//   const [rows] = await mysql.query('SELECT * FROM employee');
//   res.json(rows);
// });



const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});

