"use strict";

/**
 * @module boot
 */

/**
 * @class SvStorageTx
 * @extends SvBase
 * @classdesc The contract every folder transaction keeps (see SvStorageFolder).
 * A transaction is made by its folder (newTransaction), begun, given writes
 * (atAdd, atUpdate, removeAt), and then committed — its writes take effect
 * together or not at all — or aborted. atAdd fails the commit when the key
 * already exists.
 *
 * Kinds: SvIndexedDbTx (browser-only, IndexedDB; server-only, LevelDB) and
 * SvMemoryDbTx. Each must define every method in requiredMethodNames(); one
 * that misses any fails when its class loads.
 */
(class SvStorageTx extends SvBase {

    /**
     * @returns {Array<string>}
     * @category Contract
     */
    static requiredMethodNames () {
        return ["begin", "atAdd", "atUpdate", "removeAt", "promiseCommit", "abort"];
    }

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
        const base = SvStorageTx;
        if (this === base) {
            return;
        }
        const missing = this.requiredMethodNames().filter((name) => this.prototype[name] === base.prototype[name]);
        if (missing.length) {
            throw new Error(this.svType() + " does not implement " + missing.join(", ") + " (required by " + base.svType() + ")");
        }
    }

    initPrototypeSlots () {
        /**
         * @member {SvStorageFolder} dbFolder - The folder this transaction writes to.
         */
        this.newSlot("dbFolder", null);

        /**
         * @member {boolean} isCommitted - True once commit has been asked for.
         */
        this.newSlot("isCommitted", false);

        /**
         * @member {boolean} isAborted
         */
        this.newSlot("isAborted", false);

        /**
         * @member {boolean} isCompleted - True once the writes have taken effect.
         */
        this.newSlot("isCompleted", false);

        /**
         * @member {string|null} txId - A name for the transaction, for logs (set by its caller).
         */
        this.newSlot("txId", null);
    }

    /**
     * @returns {boolean}
     * @category State
     */
    isFinished () {
        return this.isAborted() || this.isCompleted();
    }

    assertNotCommitted () {
        assert(this.isCommitted() === false, "the transaction is already committed");
    }

    /**
     * Keys are strings; values are strings or ArrayBuffers.
     * @param {string} key
     * @param {string|ArrayBuffer} value
     * @category Validation
     */
    assertValidKeyValue (key, value) {
        assert(typeof(key) === "string", "key must be a string");
        assert(typeof(value) === "string" || (typeof(value) === "object" && Object.getPrototypeOf(value) === ArrayBuffer.prototype), "value must be a string or an ArrayBuffer");
    }

    svDebugId () {
        return this.dbFolder() ? this.dbFolder().svDebugId() + " tx" : super.svDebugId();
    }

    // --- the contract: each kind implements these ---

    subclassMustImplement (methodName) {
        throw new Error(this.svType() + " must implement " + methodName + "()");
    }

    begin () { this.subclassMustImplement("begin"); }
    atAdd (/*key, value*/) { this.subclassMustImplement("atAdd"); }
    atUpdate (/*key, value*/) { this.subclassMustImplement("atUpdate"); }
    removeAt (/*key*/) { this.subclassMustImplement("removeAt"); }
    async promiseCommit () { this.subclassMustImplement("promiseCommit"); }
    abort () { this.subclassMustImplement("abort"); }

}.initThisClass());
