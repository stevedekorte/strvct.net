"use strict"

/*

    BMCamStore

    Content Addressable Memory Store

    the subnodes are the "active" record 
    which are either in a state of sync loading or already loaded.

*/

window.BMCamStore = class BMCamStore extends BMStorableNode {
    
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
        this.setTitle("Content Addressable Memory Store")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(true)
        this.setStore(PersistentAsyncDictionary.clone().setName("CamStore"))
        this.store().asyncOpen()
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
        this.store().asyncAllKeys((keys) => {
            keys.forEach((key) => {
                const blob = this.blobForKey(key)
                this.addSubnodeIfAbsent(blob)
            })
        })
    }

}.initThisClass()

