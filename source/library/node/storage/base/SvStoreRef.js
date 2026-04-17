/** * @module library.node.storage.base
 */

/** * @class SvStoreRef
 * @extends Object
 * @classdesc SvStoreRef class for handling store references and persistent IDs.
 
 
 */

/**

 */
(class SvStoreRef extends Object {

    /**
     * @description Initializes the SvStoreRef instance.
     * @category Initialization
     */
    init () {
        super.init();
        Object.defineSlot(this, "_store", null); // move to initPrototype?
    }

    /**
     * @description Sets the persistent ID for the SvStoreRef.
     * @param {*} aPid - The persistent ID to set.
     * @returns {SvStoreRef} Returns the SvStoreRef instance.
     * @category Data Management
     */
    setPid (aPid) {
        this["*"] = aPid;
        return this;
    }

    /**
     * @description Retrieves the persistent ID of the SvStoreRef.
     * @returns {*} The persistent ID.
     * @category Data Retrieval
     */
    pid () {
        return this.getOwnProperty("*");
    }

    /**
     * @description Sets the store for the SvStoreRef.
     * @param {Object} aStore - The store to set.
     * @returns {SvStoreRef} Returns the SvStoreRef instance.
     * @category Data Management
     */
    setStore (aStore) {
        this._store = aStore;
        return this;
    }

    /**
     * @description Retrieves the store of the SvStoreRef.
     * @returns {Object} The store.
     * @category Data Retrieval
     */
    store () {
        return this._store;
    }

    /**
     * @description Dereferences the SvStoreRef to get the actual object.
     * @returns {Object} The dereferenced object.
     * @category Data Retrieval
     */
    unref () {
        return this.store().objectForPid(this.pid());
    }

    /**
     * @description Creates a new reference for the current persistent ID.
     * @returns {SvStoreRef} A new SvStoreRef instance.
     * @category Object Creation
     */
    ref () {
        return this.store().refForPid(this.pid());
    }

}.initThisClass());
