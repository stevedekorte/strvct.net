
const WebSocket = require('ws');
require("./getGlobalThis.js");
require("./Base.js");


(class RendezvousTestClient extends Base {
    init () {
        this.newSlot("client", null)
        this.newSlot("pingTimeout", null)
        this.newSlot("serverPingInterval", 30 * 1000) // in milliseconds
        this.newSlot("port", 9000) // in milliseconds
    }
    
    clearPingTimeout () {
        if (this.pingTimeout()) {
            clearTimeout(this.pingTimeout());
        }
    }

    resetPingTimeout () {
        this.clearPingTimeout()

        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        const dt = this.serverPingInterval() * 1.1
        const timeout = setTimeout(() => { this.onTimeout(); }, dt);
        this.setPingTimeout(timeout)
        return this
    }

    onTimeout () {
        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        this.client().terminate();
    }

    start () {
        this.resetPingTimeout()

        const client = new WebSocket("ws://localhost:" + this.port() + "/");
        client.on('open', () => this.onOpen());
        client.on('ping', () => this.onPing()); 
        client.on('close', () => this.onClose());
        this.setClient(client)

        return this
    }

    onOpen () {
        console.log(this.type() + " onOpen()")
        this.resetPingTimeout()
    }

    onPing () {
        console.log(this.type() + " onPing()")
        this.resetPingTimeout()
        // server sends pings, client auto-responds with pongs, so we don't do a "pong" here
    }

    onClose () {
        console.log(this.type() + " onClose()")
        this.clearPingTimeout()
    }

}.initThisClass());


RendezvousTestClient.clone().start()