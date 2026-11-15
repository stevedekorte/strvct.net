"use strict";

/**
 * @module boot
 */

/**
 * @class SvMemoryDbTx
 * @extends SvStorageTx
 * @classdesc A transaction on an SvMemoryDbFolder. It records its writes and
 * applies them to the folder's Map in one step on commit, after checking that
 * every atAdd is for a key that is not there yet; if one is, none of the
 * writes are applied and the commit rejects. Nothing else can run during that
 * step, so the transaction is atomic and isolated without any timing rules.
 */
(class SvMemoryDbTx extends SvStorageTx {

    initPrototypeSlots () {
        /**
         * @member {Array<Object>} operations - The writes, in order: { action, key, value }.
         */
        this.newSlot("operations", null);
    }

    init () {
        super.init();
        this.setOperations([]);
        return this;
    }

    // --- writes ---

    begin () {
        this.assertNotCommitted();
        assert(this.dbFolder().isOpen(), "the folder must be open to begin a transaction");
        return this;
    }

    atAdd (key, value) {
        return this.pushOperation("add", key, value);
    }

    atUpdate (key, value) {
        return this.pushOperation("put", key, value);
    }

    removeAt (key) {
        this.assertNotCommitted();
        assert(typeof(key) === "string", "key must be a string");
        this.operations().push({ action: "remove", key: key });
        return this;
    }

    /**
     * @param {string} action - "add" or "put".
     * @param {string} key
     * @param {string|ArrayBuffer} value
     * @returns {SvMemoryDbTx}
     */
    pushOperation (action, key, value) {
        this.assertNotCommitted();
        this.assertValidKeyValue(key, value);
        this.operations().push({ action: action, key: key, value: value });
        return this;
    }

    // --- commit and abort ---

    /**
     * Applies every write, or none.
     * @returns {Promise<void>} Rejects with a ConstraintError when an atAdd's key exists.
     */
    async promiseCommit () {
        assert(!this.isFinished(), "the transaction has already finished");
        this.setIsCommitted(true);
        const rows = this.dbFolder().rows();
        const clash = this.firstAddClashIn(rows);
        if (clash) {
            this.setIsAborted(true);
            const error = new Error("key '" + clash.key + "' already exists in '" + this.dbFolder().path() + "'");
            error.name = "ConstraintError";
            throw error;
        }
        this.operations().forEach((op) => this.apply(op, rows));
        this.setIsCompleted(true);
    }

    /**
     * The first atAdd whose key is in `rows` or was put earlier in this transaction.
     * @param {Map} rows
     * @returns {Object|undefined}
     */
    firstAddClashIn (rows) {
        const present = new Set(rows.keys());
        return this.operations().find((op) => {
            const clashes = op.action === "add" && present.has(op.key);
            if (op.action === "remove") { present.delete(op.key); } else { present.add(op.key); }
            return clashes;
        });
    }

    apply (op, rows) {
        if (op.action === "remove") {
            rows.delete(op.key);
        } else {
            rows.set(op.key, op.value);
        }
    }

    abort () {
        this.assertNotCommitted();
        this.setOperations([]);
        this.setIsAborted(true);
        return this;
    }

}.initThisClass());
