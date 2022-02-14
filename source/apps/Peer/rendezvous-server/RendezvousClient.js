
/*

    See:

        https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

    for WebSocket module docs

    TODO:

    

*/

require("./Base.js");

(class RendezvousClient extends Base {
    init () {
        this.newSlot("connectionRequest", null);
        this.newSlot("server", null);
        this.newSlot("webSocket", null);
        this.newSlot("id", null); // client id
        this.newSlot("error", null); 
        this.newSlot("pingPeriod", 30 * 1000); // milliseconds
        this.newSlot("sendPingTimeout", null); // timeout to send next ping
        this.newSlot("pongTimeout", null); // timeout to stop waiting for pong and close
    }

    ipAddress () {
        const req = this.connectionRequest()
        const forward = req.headers['x-forwarded-for']
        if (forward) {
            // When the server runs behind a proxy like NGINX, 
            // the de-facto standard is to use the X-Forwarded-For header.
            return forward.split(',')[0].trim();
        }
        return req.socket.remoteAddress
    }

    setWebSocket (aWebSocket) {
        this._webSocket = aWebSocket;
        this.setupWebSocket();
        return this
    }
        
    setupWebSocket () {
        const ws = this.webSocket()
        if (ws) {
            ws.on('close', (code, reason) => {
                this.onClose(code, reason)
            });

            ws.on('message', (data) => {
                this.onMessage(data);
            });

            ws.on('error', (data) => {
                this.onError(data);
            });

            ws.on('pong', (data) => {
                this.onPong(data);
            });
        }
        this.sendPing()
    }

    onClose (code, reason) {
        console.log(this.type() + " onClose: '" + reason + "'")
        this.shutdown(this);
    }

    shutdown () {
        console.log(this.type() + " shutdown")
        this.clearTimeouts()
        this.webSocket().terminate()
        this.server().removeClient(this);
    }

    onError (data) {
        console.log(this.type() + " onError: '" + data + "'")
        this.setError(data)
        debugger
        //this.close()
    }

    onMessage (data) {
        console.log(this.type() + " received: " + data.toString());
        
        try {
            const json = JSON.parse(data)
        } catch (error) {
            console.log(this.type() + " error parsing message '" + data + "'")
            return 
        }

        const message = new RendezvousClientRequest();
        message.setClient(this);
        message.setFromString(data.toString());
        
        switch (message.name()) {
            case 'requestId':
                this.onRequestId(message);
                break;
            case 'listAllPeers':
                this.onListAllPeers(message);
                break;
            case 'signalToPeer':
                this.onSignalToPeer(message);
                break;
            default:
                message.respondWithError('Server does not respond to message: ' + message.name);
        }
    }

    isOpen () {
        return this.webSocket() && this.webSocket().readyState == this.webSocket.OPEN
    }

    send (json) {
        if (this.isOpen()) {
            const message = JSON.stringify(json);
            console.log('Client sent: ' + message);
            this.webSocket.send(message);
        } else {
            console.warn(this.type() + " send() - error: can't send as webSocket was closed");
        }
        return this
    }

    allClients () {
        return this.server().clients()
    }

    // handle messages

    onRequestId (message) {
        const id = message.data().requestedId
        if (this.server().clientWithId(id)) {
            message.respondWithError('Existing peer with id ' + message.data.requestedId);
        }
        else {
            this.setId(message.data().requestedId);
            message.respondWithSuccess();
        }
    }
 
    onListAllPeers (message) {
        message.respondWithResult(this.server().clientIds());
    }

    onSignalToPeer (messageJson) {
        const client = this.server().clientWithId(message.data().toPeer);
        if (client) {
            client.send({
                name: 'signalFromPeer',
                signal: message.data.signal,
                fromPeer: this.id
            });

            message.respondWithSuccess();
        } else {
            message.respondWithError('Peer ' + message.data.toPeer + ' is not online');
        }
    }

    // --- timeouts ---

    clearTimeouts () {
        this.clearSendPingTimeout()
        this.clearPongTimeout()
    }

    clearSendPingTimeout () {
        if (this.sendPingTimeout()) {
            clearTimeout(this.sendPingTimeout())
            this.setSendPingTimeout(null) 
        }
    }

    clearPongTimeout () {
        if (this.pongTimeout()) {
            clearTimeout(this.pongTimeout())
            this.setPongTimeout(null) 
        }
    }

    onPong () {
        this.clearPongTimeout()
        const timeout = setTimeout(() => { this.sendPing() }, this.pingPeriod()) // setup timer to send next ping
        this.setSendPingTimeout(timeout)
    }

    sendPing () {
        console.log(this.type() + " sendPing")
        this.webSocket().ping() // pong should be automatically returned
        const timeout = setTimeout(() => { this.onPongTimeout() }, this.pingPeriod())
        this.setPongTimeout(timeout)
    }

    onPongTimeout () {
        console.log(this.type() + " onPongTimeout")
        // our last ping to the client didn't return a pong in the pong timeout period
        this.shutdown()
    }

}.initThisClass());
