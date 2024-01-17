const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

// SSL/TLS options for the secure WebSocket server (WSS)
const serverOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

// Creating a secure WebSocket server
const server = https.createServer(serverOptions);
const wss = new WebSocket.Server({ server });

wss.on('connection', function(ws) {
  // Create a connection to the insecure WebSocket server (WS)
  const wsClient = new WebSocket('ws://umbrel.local:8123/api/websocket', {
    rejectUnauthorized: false // This bypasses the certificate validation
  });

  wsClient.on('open', function() {
    console.log('Connected to the insecure WS server');
  });

  // Forward messages from WSS client to WS server
  ws.on('message', function(message) {
    console.log('Received message from WSS client:', message);
    wsClient.send(message);
  });

  // Forward messages from WS server to WSS client
  wsClient.on('message', function(message) {
    console.log('Received message from WS server:', message);
    ws.send(message);
  });

  ws.on('close', function() {
    console.log('WSS client disconnected');
    wsClient.close();
  });

  wsClient.on('close', function() {
    console.log('WS server connection closed');
  });
});

server.listen(8080, function() {
  console.log('Secure WebSocket server is running on port 8080');
});
