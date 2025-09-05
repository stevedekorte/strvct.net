/**
 * @module library.storage
 */

"use strict";

/**
 * @class SvMediaCache 
 * @extends ProtoClass
 * @classdesc A cache for media files. Uses SvHashCache for local cache and Firestore for remote storage.
 */

(class SvMediaCache extends ProtoClass {
    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {SvHashCache} hashCache
             * @category Data
             */
            const slot = this.newSlot("hashCache", null);
            slot.setSlotType("SvHashCache");
        }

        {
            /**
             * @member {Promise} openPromise
             * @category Data
             */
            const slot = this.newSlot("openPromise", null);
            slot.setSlotType("Promise");
        }
    }

    /**
     * @description Initializes the instance.
     * @category Initialization
     */
    init () {
        super.init();
        const hashCache = SvHashCache.clone().setName("mediaCache");
        this.setHashCache(hashCache);
        this.setOpenPromise(this.hashCache().promiseOpen());
    }



    /**
     * @description Closes the map.
     * @returns {SvMediaCache} - Returns this instance.
     * @category Operation
     */
    close () {
        this.hashCache().close();
        return this;
    }
	
    async asyncGet (hash) {
        if (await this.asyncHasLocal(hash)) {
            return this.asyncGetLocal(hash);
        }
        if (await this.asyncHasRemote(hash)) {
            return this.asyncGetRemote(hash);
        }
        return null;
    }

    async asyncStore (mediaObject) {
        await this.asyncStoreLocalIfAbsent(mediaObject);
        await this.asyncStoreRemoteIfAbsent(mediaObject);
    }

    // --- cached media object ---

    async asyncHasLocal (hash) {
        return this.hashCache().promiseHasKey(hash);
    }

    async asyncGetLocal (hash) { // sha256 hash string of media object (in the format it would be in a file system) - not a hasf of a dataUrl
        const data = await this.hashCache().promiseAt(hash);
        if (data) {
            return this.mediaObjectForData(data);
        }
        return null;
    }

    async asyncStoreLocal (mediaObject) {
        const hash = await mediaObject.asyncSha256Hash();
        const data = mediaObject.data();
        return this.hashCache().promiseAtPut(hash, data);
    }

    async asyncStoreLocalIfAbsent (mediaObject) {
        const hash = await mediaObject.asyncSha256Hash();
        if (!await this.asyncHasLocal(hash)) {
            await this.asyncStoreLocal(mediaObject);
        }
    }

    // --- remote media object ---
    // we'll load and store using Firestore

    async asyncHasRemote (hash) {
        return this.firestore().promiseHasKey(hash);
    }

    async asyncGetRemote (hash) {
        const data = await this.firestore().promiseAt(hash);
        if (data) {
            return this.mediaObjectForData(data);
        }
        return null;
    }

    async asyncStoreRemote (mediaObject) {
        const hash = await mediaObject.asyncSha256Hash();
        const data = mediaObject.data();
        return this.firestore().promiseAtPut(hash, data);
    }

    async asyncStoreRemoteIfAbsent (mediaObject) {
        const hash = await mediaObject.asyncSha256Hash();
        if (!await this.asyncHasRemote(hash)) {
            await this.asyncStoreRemote(mediaObject);
        }
    }

    // --- media object ---

    mediaObjectForData (data) {
        // TODO: handle different media types
        return SvImage.clone().setData(data);
    }
    
}.initThisClass());