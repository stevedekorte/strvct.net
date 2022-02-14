# Rendezvous Server for voluntary.net

## Running

node main.js


### protocol

On client connect, server shares list of peers.
When clients declare id or leave, the server broadcasts that info so clients can 
keep their own lists of clients for that server in sync.

The server maintains a list of client entries. Each looks like this:

    {
        sid: tmp server assigned id - unique while server is running,
        info: {
            type: "Peer",
            pubkey: pk,
            willRelayBloom: bloom filter of pubkeys client will relay for,
        }
    }

    {
        sid: 
        info: {
            type: "RendezvousServer",
            address: { protocol: ip: port: },
        }
    }


    
The server takes this and adds it's own client id (which could be a sequential number, or a UUID, but it has to
remain the same for that client while the client is connected.


server sends list of pubkeys matching client bloom filter,
and sends new matches (if any) on new client connections


On first start of client:

Client comes with some rendezvous server seeds
Client connects to seeds and gets list of clients

Step 1: Get full list of servers

Client picks some other clients at random and asks for their rendezvous server list (each server entry is an ip & port).

Step 2: now we're ready to find friend messages

For each friend pubkey, choose a rendezvous server whose hash is closest to hash of friend pubkey.
Connect to 


