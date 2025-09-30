const WebSocket = require('ws');

const url = 'wss://umbrel.local:8080/'; // Replace with your WebSocket server URL
const ws = new WebSocket(url, {
    rejectUnauthorized: false // This bypasses the certificate validation
});

ws.on('open', function open () {
    console.log('Successfully connected to:', url);
});

ws.on('error', function error (err) {
    console.error('Failed to connect to:', url, '\nError:', err.message);
});

ws.on('close', function close () {
    console.log('Connection closed');
});

