// websocket.js
const WebSocket = require('ws');

let wss;
const clients = [];

function initialize(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    const connectionTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    console.log(`New Socket client connected: ${clientIP} at ${connectionTime}`);

    clients.push(ws);

    const welcomeMessage = { type: "msg", message: 'Welcome to WebSocket server', status: 'success' };
    ws.send(JSON.stringify(welcomeMessage));

    ws.on('close', () => {
      const disconnectionTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
      console.log(`Socket client disconnected: ${clientIP} at ${disconnectionTime}`);
      clients.splice(clients.indexOf(ws), 1);
    });
  });
}

function broadcast(data) {
  if (!wss) return;
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = {
  initialize,
  broadcast,
  getClients: () => clients
};
