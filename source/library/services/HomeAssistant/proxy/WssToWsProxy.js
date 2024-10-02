"use strict";

/**
 * @module services.HomeAssistant.proxy.WssToWsProxy
 */

/**
 * This is a secure websocket (wss) server which acts as a proxy to an insecure websocket (ws) server.
 * 
 * My use case is to allow a HTTPS web page to talk to a ws (HomeAssistant) server via this wss proxy server,
 * as browsers do not allow HTTPS pages to open ws connections.
 */

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const serverOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/localnode.ddns.net/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/localnode.ddns.net/fullchain.pem')
};

const server = https.createServer(serverOptions);
const wss = new WebSocket.Server({ server });

/**
 * Clips a string to a specified length and appends an ellipsis if necessary.
 * @param {number} length - The maximum length of the string.
 * @returns {string} The clipped string with an ellipsis if necessary.
 * @category String Manipulation
 */
String.clipWithEllipsis = function (length) {
    // Check if the length of the string is less than or equal to the specified length
    if (this.length <= length) {
        return this.toString();
    }
    // Clip the string to the specified length and append "..."
    return this.substring(0, length) + '...';
}

/**
 * Handles new WebSocket connections.
 * @param {WebSocket} ws - The WebSocket connection from the browser.
 * @category WebSocket
 */
wss.on('connection', async function(ws) {
  console.log('Got WS connection from browser and opening new connection to HomeAssistant...');

  ws.binaryType = 'utf8'; // This line ensures you receive text instead of Buffer objects

  const wsClient = new WebSocket('ws://localhost:8123/api/websocket', {
    rejectUnauthorized: false
  });
  wsClient.binaryType = 'utf8'; // This line ensures you receive text instead of Buffer objects

  let messageQueue = [];
  let wsClientOpen = false;

  /**
   * Handles the 'open' event of the WebSocket connection to HomeAssistant.
   * @category WebSocket
   */
  wsClient.on('open', async function() {
    console.log('Connected to the HomeAssistant WS server');
    wsClientOpen = true;
    // Send all queued messages
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      if (typeof(message) !== "string") {
        message = await message.toString();
      }
      console.log("WSS client - (unqueued) -> WS server:\n" + message.clipWithEllipsis(20) + "\n");
      wsClient.send(message);
    }
  });

  /**
   * Handles messages received from the browser.
   * @param {(string|Buffer)} message - The message received from the browser.
   * @category WebSocket
   */
  ws.on('message', async function (message) {
    if (typeof(message) !== "string") {
      message = await message.toString();
    }

    if (wsClientOpen) {
      wsClient.send(message);
      console.log("WSS client -> WS server:\n" + message.clipWithEllipsis(20) + "\n");
    } else {
      console.log('WSS client -> (queued) -> WS server:\n' + message.clipWithEllipsis(20) + "\n");
      messageQueue.push(message);
    }
  });

  /**
   * Handles messages received from HomeAssistant.
   * @param {(string|Buffer)} message - The message received from HomeAssistant.
   * @category WebSocket
   */
  wsClient.on('message', async function (message) {
    if (typeof(message) !== "string") {
      message = await message.toString();
    }

    console.log('WSS client <- WS server:\n' + message.clipWithEllipsis(20) + "\n");
    ws.send(message);
  });

  /**
   * Handles the 'close' event of the WebSocket connection from the browser.
   * @category WebSocket
   */
  ws.on('close', function() {
    console.log('WSS client disconnected');
    wsClient.close();
  });

  /**
   * Handles the 'close' event of the WebSocket connection to HomeAssistant.
   * @category WebSocket
   */
  wsClient.on('close', function() {
    console.log('WS server connection closed');
    wsClientOpen = false;
  });
});

/**
 * Starts the server listening on port 8124.
 * @category Server
 */
server.listen(8124, function() {
  console.log(`This is a secure WebSocket server running on port 8124
and acting as a proxy to a non-secure WebSocket server on port 8123.
Example use case: WSS client (e.g. HTTPS browser) <-> WSS proxy <-> WS server (e.g. HomeAssistant API).`);
});