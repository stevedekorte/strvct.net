"use strict"

/*

    BMCams

    Content Addressable Memory Store


*/

window.BMCams = class BMCams extends BMStorableNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("store", null)
    }

    init () {
        super.init()
        this.setTitle("Cams")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        this.setStore(PersistentAsyncDictionary.clone().setName("CamStore"))
        this.asyncOpen(() => {
            this.removeAllSubnodes()
            this.camForValue("hello world") 
        })

        /*
        setTimeout(() => {
            this.removeAllSubnodes()
            this.asyncOpen(() => { this.camForValue("hello world") })
        }, 1000)
        */
        return this
    }

    asyncOpen (callback) {
        this.store().asyncOpen(callback)
    }

    camForHash (hash) {
        //const subnode = this.firstSubnodeWithTitle(hash)
        return this.subnodeWithHash(hash)
    }

    async camForValue (aValue) {
        const digest = await aValue.asyncSha256Digest()
        const hash = digest.base64Encoded()
        const existingCam = this.camForHash(hash)
        if (existingCam) {
            return existingCam
        }

        const newCam = BMCam.clone()
        this.addSubnode(newCam)
        newCam.setHash(hash)
        newCam.setValue(aValue)
        await newCam.asyncWriteValue()
        return newCam
    }
    
    static selfTest () {
        const cams = this.clone()
        cams.asyncOpen(() => { cams.camForValue("hello world") })
    }

    /*
    loadFromRecord (aRecord, aStore) {
        super.loadFromRecord(aRecord, aStore)
        this.thisPrototype().ownSlotNamed("subnodes").onInstanceLoadRef(this)
        return this
    }
    */

}.initThisClass()




