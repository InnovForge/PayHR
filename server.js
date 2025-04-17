

require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const expressLayouts = require('express-ejs-layouts');
const routes = require('./routes');
const WebSocket = require('ws');
const dbStatus = require('./middlewares/dbStatus');

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
app.use(dbStatus);
app.set('layout', 'layouts/layout');
app.use(express.urlencoded({ extended: true }));

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
        // console.log(data.toString())
        const e2 = JSON.parse(data.toString());
        const e = e2.data
        const emp = {
          Employee_ID: e.idEmployee,
          Employee_Number: e.employeeNumber,
          Last_Name: e.lastName,
          First_Name: e.firstName,
          SSN: e.ssn,
          Pay_Rate: e.payRate,
          Pay_Rate_ID: e.payRatesId,
          Vacation_Days: e.vacationDays,
          Paid_To_Date: e.paidToDate,
          Paid_Last_Year: e.paidLastYear
        }
        const jsonMessage = {
          type: 'new_data',
          data: emp
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


wss.on('connection', (ws,req) => {
  const clientIP = req.socket.remoteAddress; // Địa chỉ IP
  const connectionTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });; // Thời gian kết nối
  console.log(`New Socket client connected: ${clientIP} at ${connectionTime}`);
  clients.push(ws);

  const welcomeMessage = { type: "msg", message: 'Welcome to WebSocket server', status: 'success' };
  ws.send(JSON.stringify(welcomeMessage));

  ws.on('close', () => {
    const disconnectionTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });; // Thời gian ngắt kết nối
    console.log(`Socket client disconnected: ${clientIP} at ${disconnectionTime}`);
    clients.splice(clients.indexOf(ws), 1);
  });
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

const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});