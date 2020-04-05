"use strict"

/*

    BMCamStore

    Content Addressable Memory Store

*/

window.BMCamStore = class BMCamStore extends BMStorableNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("asyncDict", null)
        this.newSlot("syncsSubnodes", false)
    }

    init () {
        super.init()
        this.setTitle("Content Addressable Memory Store")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(true)
        this.setAsyncDict(PersistentAsyncDictionary.clone().setName("CamStore"))
        return this
    }

    blobForKey (key) {
        let blob = wm.get(key)
        if (!blob) {
            blob = this.newBlob()
            blob.seyKey(key)
            wm.set(key, blob)
        }
        return blob
    }

    newBlob () {
        const blob = BMBlob.clone().setBlobs(this)
        if (this.syncsSubnodes()) {
            this.addSubnode(blob)
        }
        return blob
    }


    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.asyncDict().asyncAllKeys((keys) => {
            keys.forEach((key) => {
                const blob = this.blobForKey(key)
                this.addSubnodeIfAbsent(blob)
            })
        })
    }

}.initThisClass()

