"use strict"

/*

    BMBlobs

    store a blob:

    const blob = blobs.blobForKey(k)
    // returns existing blob if there's a match
    //

*/

window.BMBlobs = class BMBlobs extends BMStorableNode {
    
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
        this.setTitle("Blobs")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(true)
        this.setAsyncDict(PersistentAsyncDictionary.clone().setName("blobs"))
        return this
    }

    blobForKey (key) {
        const wm = this.weakMap() 
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


}.initThisClass()

