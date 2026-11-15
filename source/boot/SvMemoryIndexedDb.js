"use strict";

/**
 * @module boot
 */

/**
 * An in-memory stand-in for the browser's `indexedDB`, for browsers that have
 * none (Safari in Lockdown Mode, site storage turned off). It implements only
 * what SvIndexedDbFolder and SvIndexedDbTx call, with the browser API's own
 * shapes (plain properties such as `request.onsuccess` and `tx.oncomplete`),
 * so those two classes run unchanged on it and everything stored through them
 * can be read back until the page closes. Nothing survives a reload.
 *
 * It is never installed as the global `indexedDB`: other libraries that probe
 * for the real one must keep seeing that it is missing.
 *
 * Differences from the real thing, all deliberate:
 * - Values are kept by reference, not cloned.
 * - A transaction's writes take effect as each request runs and are undone on
 *   abort, so transactions are atomic but not isolated from one another.
 * - Requests answer in microtasks rather than tasks.
 * - commit() after the transaction has already completed delivers oncomplete
 *   instead of throwing.
 */

function svMemoryIdbError (name, message) {
    const error = new Error(message);
    error.name = name;
    return error;
}

/**
 * @class SvMemoryIdbRequest
 * @classdesc One request: `result` / `error`, answered through `onsuccess` / `onerror`.
 */
class SvMemoryIdbRequest {

    constructor () {
        this.result = undefined;
        this.error = null;
        this.onsuccess = null;
        this.onerror = null;
    }

    succeed (result) {
        this.result = result;
        if (this.onsuccess) {
            this.onsuccess({ target: this });
        }
    }

    fail (error) {
        this.error = error;
        if (this.onerror) {
            this.onerror({ target: this });
        }
    }
}

/**
 * @class SvMemoryIdbTransaction
 * @classdesc A transaction over one database. Completes by itself once it has
 * no request left to answer, as the browser's does; abort() undoes its writes.
 */
class SvMemoryIdbTransaction {

    constructor (connection, mode) {
        this.connection = connection;
        this.mode = mode;
        this.oncomplete = null;
        this.onerror = null;
        this.onabort = null;
        this.pendingCount = 0;
        this.undoSteps = [];
        this.isFinished = false;
        this.isAborted = false;
        this.hasDeliveredComplete = false;
        queueMicrotask(() => this.completeIfIdle());
    }

    objectStore (name) {
        const rows = this.connection.database.storeMaps.get(name);
        if (!rows) {
            throw svMemoryIdbError("NotFoundError", "no object store named '" + name + "'");
        }
        return new SvMemoryIdbObjectStore(this, name, rows);
    }

    assertActive () {
        if (this.isFinished) {
            throw svMemoryIdbError("TransactionInactiveError", "the transaction has finished");
        }
    }

    assertCanWrite () {
        this.assertActive();
        if (this.mode !== "readwrite") {
            throw svMemoryIdbError("ReadOnlyError", "the transaction is read-only");
        }
    }

    /**
     * Answers `request` with what `operation` returns, in a microtask.
     */
    run (request, operation) {
        this.assertActive();
        this.pendingCount++;
        queueMicrotask(() => {
            this.pendingCount--;
            if (this.isFinished) {
                return;
            }
            let result;
            try {
                result = operation();
            } catch (error) {
                this.failRequest(request, error);
                return;
            }
            request.succeed(result);
            queueMicrotask(() => this.completeIfIdle());
        });
        return request;
    }

    failRequest (request, error) {
        this.abort();
        try {
            request.fail(error);
        } finally {
            if (this.onerror) {
                this.onerror({ target: request });
            }
        }
    }

    addUndoStep (step) {
        this.undoSteps.push(step);
    }

    completeIfIdle () {
        if (!this.isFinished && this.pendingCount === 0) {
            this.isFinished = true;
            this.undoSteps = [];
            this.deliverComplete();
        }
    }

    deliverComplete () {
        if (this.oncomplete && !this.hasDeliveredComplete) {
            this.hasDeliveredComplete = true;
            this.oncomplete({ target: this });
        }
    }

    commit () {
        if (this.isAborted) {
            throw svMemoryIdbError("InvalidStateError", "the transaction was aborted");
        }
        queueMicrotask(() => {
            this.completeIfIdle();
            this.deliverComplete(); // already complete before a handler was set
        });
    }

    abort () {
        if (this.isFinished) {
            throw svMemoryIdbError("InvalidStateError", "the transaction has finished");
        }
        this.isFinished = true;
        this.isAborted = true;
        this.undoSteps.reverse().forEach((step) => step());
        this.undoSteps = [];
        if (this.onabort) {
            this.onabort({ target: this });
        }
    }
}

/**
 * @class SvMemoryIdbObjectStore
 * @classdesc A store of `{ key, value }` entries (key path "key"), seen through one transaction.
 */
class SvMemoryIdbObjectStore {

    constructor (tx, name, rows) {
        this.tx = tx;
        this.name = name;
        this.rows = rows; // Map of key -> entry
        this.indexNames = { contains: () => true };
    }

    createIndex () {
        return null; // lookups are by key only
    }

    sortedKeys () {
        return Array.from(this.rows.keys()).sort();
    }

    read (operation) {
        return this.tx.run(new SvMemoryIdbRequest(), operation);
    }

    write (operation) {
        this.tx.assertCanWrite();
        return this.tx.run(new SvMemoryIdbRequest(), operation);
    }

    get (key) {
        return this.read(() => this.rows.get(key));
    }

    count (key) {
        return this.read(() => (key === undefined) ? this.rows.size : (this.rows.has(key) ? 1 : 0));
    }

    getAllKeys () {
        return this.read(() => this.sortedKeys());
    }

    getAll () {
        return this.read(() => this.sortedKeys().map((key) => this.rows.get(key)));
    }

    openCursor () {
        const request = new SvMemoryIdbRequest();
        const keys = this.sortedKeys();
        let index = 0;
        const step = () => this.tx.run(request, () => {
            if (index >= keys.length) {
                return null;
            }
            const key = keys[index];
            return { key: key, value: this.rows.get(key), continue: () => { index++; step(); } };
        });
        step();
        return request;
    }

    setEntry (entry) {
        const rows = this.rows;
        const key = entry.key;
        const had = rows.has(key);
        const before = rows.get(key);
        rows.set(key, entry);
        this.tx.addUndoStep(() => { if (had) { rows.set(key, before); } else { rows.delete(key); } });
        return key;
    }

    add (entry) {
        return this.write(() => {
            if (this.rows.has(entry.key)) {
                throw svMemoryIdbError("ConstraintError", "key '" + entry.key + "' already exists in '" + this.name + "'");
            }
            return this.setEntry(entry);
        });
    }

    put (entry) {
        return this.write(() => this.setEntry(entry));
    }

    delete (key) {
        return this.write(() => {
            const rows = this.rows;
            if (rows.has(key)) {
                const before = rows.get(key);
                rows.delete(key);
                this.tx.addUndoStep(() => rows.set(key, before));
            }
            return undefined;
        });
    }

    clear () {
        return this.write(() => {
            const rows = this.rows;
            const before = Array.from(rows.entries());
            rows.clear();
            this.tx.addUndoStep(() => before.forEach(([key, entry]) => rows.set(key, entry)));
            return undefined;
        });
    }
}

/**
 * @class SvMemoryIdbConnection
 * @classdesc One open connection to a database (what `open()` answers with).
 */
class SvMemoryIdbConnection {

    constructor (database) {
        this.database = database; // { name, version, storeMaps }
        this.name = database.name;
        this.version = database.version;
        this.isClosed = false;
        this.onversionchange = null;
        this.onclose = null;
        this.onerror = null;
    }

    get objectStoreNames () {
        const names = Array.from(this.database.storeMaps.keys());
        names.contains = (name) => names.includes(name);
        return names;
    }

    createObjectStore (name) {
        const rows = new Map();
        this.database.storeMaps.set(name, rows);
        return new SvMemoryIdbObjectStore(new SvMemoryIdbTransaction(this, "readwrite"), name, rows);
    }

    transaction (storeNames, mode) {
        if (this.isClosed) {
            throw svMemoryIdbError("InvalidStateError", "The database connection is closing.");
        }
        return new SvMemoryIdbTransaction(this, mode || "readonly");
    }

    close () {
        this.isClosed = true;
    }
}

/**
 * @class SvMemoryIndexedDb
 * @classdesc The factory: `open`, `deleteDatabase`, `databases`. One shared
 * instance holds every database made through it.
 */
class SvMemoryIndexedDb {

    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            this._shared = new this();
        }
        return this._shared;
    }

    constructor () {
        this.databaseMap = new Map(); // name -> { name, version, storeMaps }
    }

    open (name, version) {
        const request = new SvMemoryIdbRequest();
        queueMicrotask(() => {
            let database = this.databaseMap.get(name);
            const isNew = !database;
            if (isNew) {
                database = { name: name, version: version || 1, storeMaps: new Map() };
                this.databaseMap.set(name, database);
            }
            request.result = new SvMemoryIdbConnection(database);
            if (isNew && request.onupgradeneeded) {
                request.onupgradeneeded({ target: request });
            }
            request.succeed(request.result);
        });
        return request;
    }

    deleteDatabase (name) {
        const request = new SvMemoryIdbRequest();
        queueMicrotask(() => {
            this.databaseMap.delete(name);
            request.succeed(undefined);
        });
        return request;
    }

    databases () {
        return Promise.resolve(Array.from(this.databaseMap.values()).map((d) => ({ name: d.name, version: d.version })));
    }
}

SvGlobals.set("SvMemoryIndexedDb", SvMemoryIndexedDb);
