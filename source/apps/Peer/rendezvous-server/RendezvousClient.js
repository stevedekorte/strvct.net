
/*

    TODO:

    - timeout if no client id sent

*/

(class RendezvousClient extends Base {
    init () {
        this.newSlot("server", null);
        this.newSlot("webSocket", null);
        this.newSlot("id", null); // client id
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
        }
    }

    onClose (code, reason) {
        this.server().removeClient(this);
    }

    onMessage (data) {
        console.log('Client received: ' + data.toString());
        
        try {
            const json = JSON.parse(data)
        } catch (error) {
            console.log("error parsing message '" + data + "'")
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
            case 'ping':
                this.onPing(message);
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
        }
        else {
            console.warn('webSocket was closed');
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

    onPing (messageJson) {
        message.respondWithSuccess();
    }
}.initThisClass());
