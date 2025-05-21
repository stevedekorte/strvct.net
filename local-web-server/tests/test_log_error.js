#!/usr/bin/env node

/**
 * Test script for the /log_error API endpoint.
 * This script sends a sample error log to the local web server.
 * 
 * Usage:
 * node test_log_error.js
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  host: 'localhost',
  port: 8000,
  path: '/log_error',
  method: 'POST',
  rejectUnauthorized: false, // Allow self-signed certificates
  headers: {
    'Content-Type': 'application/json'
  }
};

// Sample error data
const errorData = {
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  message: 'Test error message',
  stack: 'Error: Test error\n    at TestFunction (/path/to/file.js:123:45)\n    at processInput (/path/to/another/file.js:67:89)',
  userAgent: 'Mozilla/5.0 (Test User Agent)',
  component: 'TestComponent',
  details: {
    action: 'test-action',
    sessionId: '12345678',
    additionalInfo: 'This is a test error log'
  }
};

// Convert data to JSON string
const postData = JSON.stringify(errorData, null, 2);

// Add content length to headers
config.headers['Content-Length'] = Buffer.byteLength(postData);

// Create request
console.log(`Sending test error log to http${config.port === 443 ? 's' : ''}://${config.host}:${config.port}${config.path}`);

const req = (config.port === 443 ? https : http).request(config, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsedResponse = JSON.parse(responseData);
      console.log(JSON.stringify(parsedResponse, null, 2));
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();