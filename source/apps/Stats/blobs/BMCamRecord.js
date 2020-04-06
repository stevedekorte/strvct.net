"use strict"

/*

    BMCamRecord

    A record in a BMCamStore

    readyState:

    uninitialized - Has not started loading yet
    loading - Is loading
    loaded - Has been loaded
    interactive - Has loaded enough and the user can interact with it
    complete - Fully loaded

*/

window.BMCamRecord = class BMCamRecord extends BMNode {
    
    initPrototype () {
        this.newSlot("camStore", null).setShouldStoreSlot(false)
        this.newSlot("hash", null).setShouldStoreSlot(true)
        this.newSlot("size", 0).setShouldStoreSlot(true)
        this.newSlot("readyState", 0).setShouldStoreSlot(false)
        this.newSlot("value", null).setShouldStoreSlot(false)
    }

    init () {
        super.init()
        this.setTitle("CamRecord")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(false)
        this.setShouldStore(false)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        return this
    }

    async asyncComputeHash () {
        const digest = await this.value().asyncSha256Digest()
        const hash = digest.base64Encoded()
        this.setHash(hash)
        this.didComputeHash()
    }

    didComputeHash () {
        console.log("didComputeHash: ", this.hash())
    }

    async asyncRead () {
        assert(this.hash())
        this.camStore().asyncDict().at(this.hash())
    }

    async asyncWrite () {
        if (!this.hash()) {
            await this.asyncComputeHash()
        }
        this.camStore().atPut(this.hash(), this.value())
    }

    static selfTest () {
        const record = BMCamRecord.clone()
        record.setValue("hello world")
        record.asyncComputeHash()
        return this
    }

}.initThisClass().selfTest()



