/**
 * @module library.node.storage.base
 * @class StoreRef
 * @extends Object
 * @classdesc StoreRef class for handling store references and persistent IDs.
 */
(class StoreRef extends Object {

    /**
     * @description Initializes the StoreRef instance.
     * @category Initialization
     */
    init () {
        super.init();
        Object.defineSlot(this, "_store", null); // move to initPrototype?
    }

    /**
     * @description Sets the persistent ID for the StoreRef.
     * @param {*} aPid - The persistent ID to set.
     * @returns {StoreRef} Returns the StoreRef instance.
     * @category Data Management
     */
    setPid (aPid) {
        this["*"] = aPid;
        return this;
    }

    /**
     * @description Retrieves the persistent ID of the StoreRef.
     * @returns {*} The persistent ID.
     * @category Data Retrieval
     */
    pid () {
        return this.getOwnProperty("*");
    }

    /**
     * @description Sets the store for the StoreRef.
     * @param {Object} aStore - The store to set.
     * @returns {StoreRef} Returns the StoreRef instance.
     * @category Data Management
     */
    setStore (aStore) {
        this._store = aStore;
        return this;
    }

    /**
     * @description Retrieves the store of the StoreRef.
     * @returns {Object} The store.
     * @category Data Retrieval
     */
    store () {
        return this._store;
    }

    /**
     * @description Dereferences the StoreRef to get the actual object.
     * @returns {Object} The dereferenced object.
     * @category Data Retrieval
     */
    unref () {
        return this.store().objectForPid(this.pid());
    }

    /**
     * @description Creates a new reference for the current persistent ID.
     * @returns {StoreRef} A new StoreRef instance.
     * @category Object Creation
     */
    ref () {
        return this.store().refForPid(this.pid());
    }

}.initThisClass());
