"use strict";

/*

    BMNetCache

    Example use:

    BMNetworkCache.shared().asyncRequestDataForUrlAndHash(url, hash, resolve, reject)

    If hash argument is non-null, then it looks in BMBlobs for a blob whose name matches the hash.
    If found, it asks the blob to load it's value from indexeddb (if not already loaded).
    When ready, it calls resolve.

    If hash is null, or no matching blob is found, a XMLHttpRequest tries to load the url.
    After loading, it will verify the hash (and error if it doesn't match), store the value in a blob and
    call resolve with the data.

    NOTES:

    If two requests to the same hash or URL occur at the same (before one has resolved),
    we want them share the XMLHttpRequest and/or indexeddb request, so both should have a way of
    maintaining a set of resolve functions to be called when completed.

    QUESTIONS:

    Should this also look in Cam.js?

*/

(class BMNetCache extends BMNode {

    static initClass () {
        this.setIsSingleton(true);
        return this;
    }

    initPrototypeSlots () {
        this.newSlot("blobs", null);
        this.newSlot("requestSet", null);
    }

    init () {
        super.init();
        this.setTitle("Network Cache");
        this.setRequestSet(new Set());
        this.setBlobs(BMBlobs.shared());
        /*
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        */
        return this;
    }

    hasDataForHash (h) {
        return this.blobs().hasBlobNamed(h);
    }

    asyncRequestDataForUrlWithHash (urlString, resolve, reject) {
        const blob = this.blobs().hasBlobNamed(urlString);
        if (blob) {
            blob.asyncReadValue(() => {
                resolve(blob.value());
            });
        }
    }

    loadData () {
        const req = new XMLHttpRequest();
        req.open("GET", this.path(), true);
        req.responseType = "arraybuffer";

        req.onload = (event) => {
            const arrayBuffer = req.response; // Note: not req.responseText
            if (arrayBuffer) {
                this.onLoadData(arrayBuffer);
            }
        };

        req.send(null);
    }

    /*
    static selfTest () {
        this.addTimeout(() => {
            const blob = BMBlobs.shared().blobForKey("http://test.com/")
            blob.setValue("test content")
            blob.asyncWrite()
        })
    }
    */

}.initThisClass());
