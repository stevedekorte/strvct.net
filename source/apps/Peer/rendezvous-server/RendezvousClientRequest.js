require("./Base.js");

(class RendezvousClientRequest extends Base {

    init () {
        this.newSlot("client", null)
        this.newSlot("id", null)
        this.newSlot("name", null)
        this.newSlot("data", null)
    }

    setFromString (s) {
        // expected format { id: string, name: string, data: any }
        try {
            const json = JSON.parse(s)
            this.setId(json.id)
            this.setName(json.name)
            this.setData(json.data)
        } catch (error) {
            console.log("RendezvousClientMessage setFromString() error parsing json '" + s + "' :". error)
        }
        return this
    }

    respondWithResult (result) {
        this.client().send('response', {
            id: this.id(),
            result: result
        })
    }

    respondWithSuccess () {
        this.respondWithResult('success');
    }

    respondWithError (aString) {
        this.client().send('response', {
            id: this.id(),
            error: aString
        })
    }
}.initThisClass());