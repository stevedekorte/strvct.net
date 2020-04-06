"use strict"

/*

    BMBlobs

    blobs -> blob (name, valueHash) -> CamStore -> CamRecord (valueHash, valueData)

    A container for existing blobs. 
    A blob is a name to data hash entry.
    The data hash is used as a pointer to a CamRecord

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
    }

    init () {
        super.init()
        this.setTitle("Blobs")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(true)
        return this
    }

    blobForKey (key) {
        //const subnode = this.firstSubnodeWithTitle(key)
        const subnode = this.subnodeWithHash(key)
        if (subnode) {
            return subnode
        }

        const blob = this.newBlob()
        blob.seyKey(key)
        this.addSubnode(blob)
        return blob
    }


}.initThisClass()

