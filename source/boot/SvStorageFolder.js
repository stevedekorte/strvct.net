"use strict";

/**
 * @module boot
 */

/**
 * @class SvStorageFolder
 * @extends SvBase
 * @classdesc The contract every key-value folder keeps, and the behaviour they
 * share. A folder is a named store of string keys to string or ArrayBuffer
 * values, changed directly (promiseAtPut, promiseRemoveAt) or through a
 * transaction (newTransaction) that applies its writes all at once.
 *
 * Three kinds keep it:
 * - SvIndexedDbFolder (browser-only): IndexedDB.
 * - SvIndexedDbFolder (server-only): LevelDB.
 * - SvMemoryDbFolder: a Map, kept until the page closes. Used where the
 *   browser has no IndexedDB (Safari in Lockdown Mode, site storage turned
 *   off) or the address carries memoryOnly=1.
 *
 * Make folders with SvStorageFolder.newFolder(), which picks the kind. Each
 * kind must define every method in requiredMethodNames(); a kind that misses
 * one fails when its class loads (initThisClass), not when the method is first
 * called.
 */
(class SvStorageFolder extends SvBase {

    static _usesMemory = null;

    /**
     * The methods each kind implements itself. The base class's versions
     * of these only throw.
     * @returns {Array<string>}
     * @category Contract
     */
    static requiredMethodNames () {
        return [
            "isOpen", "promiseOpen", "close",
            "promiseAt", "promiseCount", "promiseAllKeys", "promiseAsMap",
            "promiseAtPut", "promiseRemoveAt", "promiseClear", "promiseDelete",
            "asyncTotalSize", "txClass"
        ];
    }

    /**
     * Registers the class, then checks a kind keeps the whole contract.
     * @returns {Function}
     * @category Contract
     */
    static initThisClass () {
        super.initThisClass();
        this.assertKeepsContract();
        return this;
    }

    /**
     * Throws if a subclass leaves a required method to this base class.
     * @category Contract
     */
    static assertKeepsContract () {
        const base = SvStorageFolder;
        if (this === base) {
            return;
        }
        const missing = this.requiredMethodNames().filter((name) => this.prototype[name] === base.prototype[name]);
        if (missing.length) {
            throw new Error(this.svType() + " does not implement " + missing.join(", ") + " (required by " + base.svType() + ")");
        }
    }

    // --- choosing a kind ---

    /**
     * A new folder of the kind this environment uses.
     * @returns {SvStorageFolder}
     * @category Kinds
     */
    static newFolder () {
        return this.folderClass().clone();
    }

    /**
     * @returns {Function} SvMemoryDbFolder or SvIndexedDbFolder.
     * @category Kinds
     */
    static folderClass () {
        return SvGlobals.get(this.usesMemory() ? "SvMemoryDbFolder" : "SvIndexedDbFolder");
    }

    /**
     * True when folders keep their contents in memory only, lost when the
     * page closes: the browser has no IndexedDB, or the page asked for it.
     * Decided once.
     * @returns {boolean}
     * @category Kinds
     */
    static usesMemory () {
        if (this.storageClass()._usesMemory === null) {
            this.storageClass()._usesMemory = !SvIndexedDbFolder.hasIndexedDB() || this.isMemoryOnlyRequested();
            if (this.storageClass()._usesMemory) {
                console.warn(this.logPrefix(), "storing in memory only: nothing is kept after this page closes.");
            }
        }
        return this.storageClass()._usesMemory;
    }

    /**
     * Where the decision is kept, so every kind answers the same.
     * @returns {Function}
     * @category Kinds
     */
    static storageClass () {
        return SvStorageFolder;
    }

    /**
     * True when the page's address carries memoryOnly=1 (anywhere in it), for
     * trying the memory kind in a browser that has IndexedDB. Never under
     * Node, which has no page address.
     * @returns {boolean}
     * @category Kinds
     */
    static isMemoryOnlyRequested () {
        return SvPlatform.isBrowserPlatform() && /[?&#]memoryOnly=1(&|#|$)/.test(SvPlatform.getWindowLocationURL().href);
    }

    // --- slots ---

    initPrototypeSlots () {
        /**
         * @member {string} path - The folder's name; ends with pathSeparator.
         */
        this.newSlot("path", "/");

        /**
         * @member {string} pathSeparator
         */
        this.newSlot("pathSeparator", "/");

        /**
         * @member {SvStorageTx} lastTx - The last transaction made.
         */
        this.newSlot("lastTx", null);
    }

    // --- shared behaviour ---

    /**
     * Sets the folder's name; not while it is open.
     * @param {string} aString
     * @returns {SvStorageFolder}
     * @category Naming
     */
    setPath (aString) {
        if (this._path !== aString) {
            assert(!this.isOpen(), "can't change the path on an open " + this.svType() + " instance");
            this._path = aString;
        }
        return this;
    }

    /**
     * @returns {string} The name the backing store knows the folder by.
     * @category Naming
     */
    storeName () {
        return this.path();
    }

    /**
     * @param {string} key
     * @returns {string}
     * @category Naming
     */
    pathForKey (key) {
        return this.path() + key;
    }

    /**
     * A folder of the same kind, named below this one.
     * @param {string} pathComponent
     * @returns {SvStorageFolder}
     * @category Naming
     */
    folderAt (pathComponent) {
        assert(!pathComponent.contains(this.pathSeparator()), "pathComponent contains pathSeparator");
        return this.thisClass().clone().setPath(this.path() + pathComponent + this.pathSeparator());
    }

    thisClass () {
        return this.constructor;
    }

    /**
     * @param {string} key
     * @returns {Promise<boolean>}
     * @category Reading
     */
    async promiseHasKey (key) {
        return (await this.promiseCount(key)) !== 0;
    }

    /**
     * @param {string} key
     * @returns {Promise<void>} Rejects when the key is missing.
     * @category Reading
     */
    async promiseAssertHasKey (key) {
        if (!(await this.promiseHasKey(key))) {
            throw new Error("promiseAssertHasKey(" + key + ") assert failed");
        }
    }

    /**
     * Logs the folder's contents when debugging.
     * @category Reading
     */
    async show () {
        const map = await this.promiseAsMap();
        this.logDebug(" " + this.path() + " = ", map);
    }

    /**
     * Removes every key in the set, in one transaction.
     * @param {Set<string>} keySet
     * @returns {Promise}
     * @category Writing
     */
    async promiseRemoveKeySet (keySet) {
        await this.promiseOpen();
        const tx = this.newTransaction();
        tx.begin();
        keySet.forEach((key) => tx.removeAt(key));
        return tx.promiseCommit();
    }

    /**
     * A transaction on this folder, not yet begun.
     * @returns {SvStorageTx}
     * @category Transactions
     */
    newTransaction () {
        const tx = this.txClass().clone().setDbFolder(this);
        this.setLastTx(tx);
        return tx;
    }

    /**
     * The same as newTransaction (kept for its callers).
     * @returns {SvStorageTx}
     * @category Transactions
     */
    privateNewTx () {
        return this.newTransaction();
    }

    /**
     * A transaction on this folder, once it is open.
     * @returns {Promise<SvStorageTx>}
     * @category Transactions
     */
    async promiseNewTx () {
        await this.promiseOpen();
        return this.newTransaction();
    }

    svDebugId () {
        return super.svDebugId() + " '" + this.path() + "'";
    }

    // --- the contract: each kind implements these ---

    subclassMustImplement (methodName) {
        throw new Error(this.svType() + " must implement " + methodName + "()");
    }

    isOpen () { this.subclassMustImplement("isOpen"); }
    async promiseOpen () { this.subclassMustImplement("promiseOpen"); }
    close () { this.subclassMustImplement("close"); }
    async promiseAt (/*key*/) { this.subclassMustImplement("promiseAt"); }
    async promiseCount (/*optionalKey*/) { this.subclassMustImplement("promiseCount"); }
    async promiseAllKeys () { this.subclassMustImplement("promiseAllKeys"); }
    async promiseAsMap () { this.subclassMustImplement("promiseAsMap"); }
    async promiseAtPut (/*key, value*/) { this.subclassMustImplement("promiseAtPut"); }
    async promiseRemoveAt (/*key*/) { this.subclassMustImplement("promiseRemoveAt"); }
    async promiseClear () { this.subclassMustImplement("promiseClear"); }
    async promiseDelete () { this.subclassMustImplement("promiseDelete"); }
    async asyncTotalSize () { this.subclassMustImplement("asyncTotalSize"); }
    txClass () { this.subclassMustImplement("txClass"); }

}.initThisClass());
