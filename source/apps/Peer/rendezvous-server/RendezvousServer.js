
const WebSocket = require('ws');
require("./getGlobalThis.js");
require("./Base.js");
require("./RendezvousClient.js");
require("./RendezvousClientRequest.js");


Object.defineSlot(Array.prototype, "remove",
    function (item) {
        return this.splice(this.indexOf(item), 1);
    }
);

(class RendezvousServer extends Base {

    init () {
        this.newSlot("port", 9000);
        this.newSlot("server", null);
        this.newSlot("clients", []);
    }

    options () {
        return {
            port: this.port()
        }
    }

    start () {
        const server = new WebSocket.Server(this.options())
        this.setServer(server);

        server.on('connection', (webSocket) => {
            this.onConnection(webSocket);
        })

        /*
        server.on("message", (data, id) => {
            this.onMessage(data, id)
        });

        this.server().on('closedconnection', (id) => {
            this.onClosedConnection(id);
        })
        */

        console.log('RendezvousServer listening on port ' + this.port());
    }

    onConnection (webSocket, request) {
        console.log('RendezvousServer onConnect()');
        const client = RendezvousClient.clone();
        client.setConnectionRequest(request)
        client.setServer(this);
        client.setWebSocket(webSocket);
        this.clients().push(client);
        return this;
    }

    removeClient (aClient) {
        console.log('RendezvousServer removeClient()');
        this.clients().remove(aClient);
        return this;
    }

    clientIds () {
        // need to filter out clients that have not yet requested an id
        const clientIds = this.clients().filter(c => c.id()).map(c => c.id());
        return clientIds
    }

    clientWithId (id) {
        const client = this.allClients().find(c => c.id() == id);
        return client
    }

}.initThisClass());