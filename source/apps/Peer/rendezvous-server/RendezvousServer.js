
const WebSocket = require('ws');
require("getGlobalThis.js")
require("Base.js")
require("RendezvousClient.js")
require("RendezvousClientMessage.js")


(class RendezvousServer extends Base {

    init() {
        this.newSlot("port", 9000);
        this.newSlot("server", null);
        this.newSlot("clients", []);
    }

    options () {
        return {
            port: this.port()
        }
    }

    start() {
        const server = new WebSocket.Server(this.options())
        this.setServer(server);

        server.on('connection', (socket) => {
            this.onConnection(socket);
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

    onConnection (webSocket) {
        console.log('RendezvousServer onConnect');
        const client = new RendezvousClient();
        client.setServer(this);
        client.setWebSocket(webSocket);
        this.clients().push(client);
        return this;
    }

    removeClient (aClient) {
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


}.initThisClass())