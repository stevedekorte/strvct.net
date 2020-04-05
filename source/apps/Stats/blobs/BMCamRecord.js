"use strict"

/*

    BMCamRecord

    A record in a BMCamStore

*/

window.BMCamRecord = class BMCamRecord extends BMNode {
    
    initPrototype () {
        this.newSlot("camStore", null)
        this.newSlot("hash", null)
        this.newSlot("value", null)
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
        let digest = await this.value().asyncSha256Digest()
        let hash = digest.base64Encoded()
        this.setHash(hash)
        this.didComputeHash()
    }

    didComputeHash () {
        console.log("didComputeHash: ", this.hash())
    }

    async asyncRead () {
        assert(this.hash())
        this.camStore().at(this.hash())
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



