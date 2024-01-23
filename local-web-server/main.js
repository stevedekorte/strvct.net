

"use strict";

// get command line arguments
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).options({
  port: { type: 'number', demandOption: false, describe: 'Port number' },
  key: { type: 'string', demandOption: false, describe: 'Key file path' },
  cert: { type: 'string', demandOption: false, describe: 'Cert file path' }
}).argv;

console.log(argv);

require("./StrvctHttpsServer.js")

const server = StrvctHttpsServer.clone();

// apply command line arguments
if (argv.port) {
    server.setPort(argv.port);
}

if (argv.cert) {
    server.setCertPath(argv.cert);
}

if (argv.key) {
    server.setKeyPath(argv.key);
}

server.run()
