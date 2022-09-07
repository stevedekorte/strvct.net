"use strict";

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

(class BMBlobs extends BMStorableNode {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }
    
    initPrototypeSlots () {
        this.newSlot("store", null)
    }

    init () {
        super.init()
        this.setTitle("Blobs")
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)

        this.setStore(PersistentAsyncMap.clone().setName("BlobHashStore"))
        this.store().asyncOpen(() => {
            //this.removeAllSubnodes()
            //this.camForValue("hello world") 
            this.collectGarbage()
        })

        return this
    }

    blobWithName (aName) {
        return this.subnodeWithHash(aName)
    }

    hasBlobWithName (aName) {
        return !Type.isNullOrUndefined(this.blobWithName(aName))
    }

    createBlobWithNameAndValue (aName, aValue) {
        const oldBlob = this.blobWithName(aName)
        if (oldBlob) {
            oldBlob.setValue(aValue)
            return oldBlob
        }

        assert(!this.hasBlobWithName(aName))
        const blob = BMBlob.clone()
        blob.setName(aName)
        blob.setValue(aValue) // this will trigger an async compute of valueHash and store of value
        this.addSubnode(blob)
        return blob
    }

    collectGarbage () {
        this.subnodes().shallowCopy().forEach((blob) => {
            if (!blob.isValid()) {
                this.debugLog(" collecting inValid blob:", blob.description())
                blob.delete()
            }
        })

        const subnodeHashes = this.subnodes().map(sn => sn.valueHash()).asSet()
        const store = this.store()
        store.asyncAllKeys((storedHashes) => {
            storedHashes.forEach((h) => {
                if (!subnodeHashes.has(h)) {
                    this.debugLog("collecting unreferenced blob hash:", h)
                    store.asyncRemoveKey(h)
                }
            })
        })
    }

    static selfTest () {
        this.addTimeout(() => {
            const blob = BMBlobs.shared().blobForKey("http://test.com/")
            blob.setValue("test content")
            blob.asyncWrite()
        })
    }

}.initThisClass());
