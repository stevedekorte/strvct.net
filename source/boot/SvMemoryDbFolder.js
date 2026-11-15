"use strict";

/**
 * @module boot
 */

/**
 * @class SvMemoryDbFolder
 * @extends SvStorageFolder
 * @classdesc A folder kept in a Map, for browsers that keep nothing (Safari in
 * Lockdown Mode has no IndexedDB). Its contents last until the page closes.
 * Folders with the same path share one Map, as IndexedDB folders with the
 * same name share one database, so a folder can be closed and reopened, or
 * made twice, and see the same contents.
 *
 * Values are stored as given; an ArrayBuffer is not copied, so the caller must
 * not change one after storing it.
 */
(class SvMemoryDbFolder extends SvStorageFolder {

    static _databaseMap = new Map(); // path -> Map of key -> value

    /**
     * The Map for a path, made when first asked for.
     * @param {string} path
     * @returns {Map}
     * @category Storage
     */
    static rowsForPath (path) {
        if (!this._databaseMap.has(path)) {
            this._databaseMap.set(path, new Map());
        }
        return this._databaseMap.get(path);
    }

    /**
     * Forgets a path's Map (promiseDelete).
     * @param {string} path
     * @category Storage
     */
    static removeRowsForPath (path) {
        this._databaseMap.delete(path);
    }

    /**
     * @returns {Array<string>} Every path with a Map.
     * @category Storage
     */
    static paths () {
        return Array.from(this._databaseMap.keys());
    }

    initPrototypeSlots () {
        /**
         * @member {Map|null} rows - This folder's Map while open.
         */
        this.newSlot("rows", null);
    }

    txClass () {
        return SvMemoryDbTx;
    }

    // --- open and close ---

    isOpen () {
        return this.rows() !== null;
    }

    async promiseOpen () {
        if (!this.isOpen()) {
            this.setRows(this.thisClass().rowsForPath(this.path()));
        }
    }

    close () {
        this.setRows(null);
        return this;
    }

    // --- reading ---

    async promiseAt (key) {
        await this.promiseOpen();
        return this.rows().get(key);
    }

    async promiseCount (optionalKey) {
        await this.promiseOpen();
        if (optionalKey === undefined) {
            return this.rows().size;
        }
        return this.rows().has(optionalKey) ? 1 : 0;
    }

    /**
     * @returns {Promise<Array<string>>} Sorted, as IndexedDB returns them.
     */
    async promiseAllKeys () {
        await this.promiseOpen();
        return Array.from(this.rows().keys()).sort();
    }

    async promiseAsMap () {
        const keys = await this.promiseAllKeys();
        return new Map(keys.map((key) => [key, this.rows().get(key)]));
    }

    async asyncTotalSize () {
        await this.promiseOpen();
        let total = 0;
        this.rows().forEach((value) => {
            total += (typeof(value) === "string") ? value.length * 2 : value.byteLength;
        });
        return total;
    }

    // --- writing ---

    /**
     * Stores a value; an undefined value removes the key.
     */
    async promiseAtPut (key, value) {
        if (value === undefined) {
            return this.promiseRemoveAt(key);
        }
        const tx = await this.promiseNewTx();
        tx.begin();
        tx.atUpdate(key, value);
        return tx.promiseCommit();
    }

    async promiseRemoveAt (key) {
        const tx = await this.promiseNewTx();
        tx.begin();
        tx.removeAt(key);
        return tx.promiseCommit();
    }

    async promiseClear () {
        await this.promiseOpen();
        this.rows().clear();
    }

    async promiseDelete () {
        assert(!this.isOpen(), this.svType() + " is open");
        this.thisClass().removeRowsForPath(this.path());
    }

}.initThisClass());
