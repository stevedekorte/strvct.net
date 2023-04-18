"use strict";

/*

    BMBlobs

    Async storage for larger values.

    Motivation:
    Due to indexeddb only having an async API, we have to load the app's store 
    entirely into memory in order to be able to synchronously read it. 
    This works as long as the amount of data isn't too big.
    To help keep the store small, we put large objects, and objects which are ok to load asynchronously 
    (eg app resources like fonts, images) in blobs.

    blobs -> blob subnode (name, valueHash, date, etc) 

    A container for existing blobs. 
    A blob is an object that refs an entry in a PersistentAsyncMap (separate from the app's store).
    The data hash is used as a pointer to a CamRecord

    store a blob:

    const blob = blobs.blobWithName(k)
    // returns existing blob if there's a match

    NOTES:

    The Blobs object and it's subnodes should be stored in the app's
    store, so there will need to be a path from the app's root node to
    the BMBlobs singleton instance. It may be tricky to get this right as
    creating a BMBlobs before reading it out of the store would create a
    conflicting instance.

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
        return this
    }

    promiseOpen () {
        debugger
        return this.store().promiseOpen()
    }

    // --- lookup blob by name ---

    blobWithName (aName) {
        return this.subnodes().detect(sn => sn.title() === aName)
        //return this.firstSubnodeWithTitle(aName)
    }

    hasBlobWithName (aName) {
        return !Type.isNullOrUndefined(this.blobWithName(aName))
    }

    // --- lookup blob by hash ---

    hasBlobWithValueHash (h) {
        return !Type.isNullOrUndefined(this.blobWithValueHash(h))
    }

    blobWithValueHash (h) {
        //debugger
        return this.subnodes().detect(sn => sn.valueHash() === h) /// <------------------------------ TEMPORARY
        //return this.subnodeWithHash(h)
    }

    // create blob
    
    createBlobWithNameAndValue (aName, aValue) {
        //debugger
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
        // remove invalid Blob subnodes (thbose with null meta data)
        this.subnodes().shallowCopy().forEach((blob) => {
            if (!blob.isValid()) {
                this.debugLog(" collecting inValid blob:", blob.description())
                blob.delete()
            }
        })

        // remove store entries which are not referenced by a Blob subnode valueHash
        const subnodeHashes = this.subnodes().map(sn => sn.valueHash()).asSet()
        const store = this.store()

        //store.promiseClear()
        store.promiseAllKeys().then((storedHashes) => {
            storedHashes.forEach((h) => {
                if (!subnodeHashes.has(h)) {
                    this.debugLog("collecting unreferenced blob hash:", h)
                    store.promiseRemoveKey(h)
                }
            })
        })
    }

    static selfTest () {
        this.addTimeout(() => {
            const blob = BMBlobs.shared().blobForKey("http://test.com/")
            blob.setValue("test content")
            blob.promiseWrite()
        })
    }

}.initThisClass());
