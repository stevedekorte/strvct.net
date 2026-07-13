/** * @module library.node.storage.base
 */

/** * @class SvStoreRef
 * @extends Object
 * @classdesc SvStoreRef class for handling store references and persistent IDs.
 
 
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

    // --- failure bookkeeping (negative cache for lazy-slot materialization) ---
    //
    // A ref whose unref() failed (missing record) stays in the slot, so the
    // getter naturally retries on next access. UI sync hammers getters every
    // render pass, so without a latch one missing record means a pool lookup
    // and log line per tick. These fields rate-limit re-ATTEMPTS only — the
    // owner's onFailedLazyLoadSlot<Name> hook still runs on every failed
    // access (see Slot.onInstanceFailedLazyLoad). Today's failures are
    // deterministic (a record absent from the local pool stays absent), so
    // this is negative caching, not transient-error backoff; on success the
    // ref is replaced by the real value and this state dies with it.
    // Fields are defined lazily on first failure so the happy path pays
    // nothing.

    /**
     * @description Number of failed materialization attempts recorded on this ref.
     * @returns {Number}
     * @category Failure Handling
     */
    attemptCount () {
        return this._attemptCount || 0;
    }

    /**
     * @description The Error from the most recent failed attempt, or null.
     * @returns {Error|null}
     * @category Failure Handling
     */
    lastError () {
        return this._lastError || null;
    }

    /**
     * @description The kind of the most recent failure ("missingRecord" for now;
     * transient kinds arrive with async pools), or null.
     * @returns {String|null}
     * @category Failure Handling
     */
    lastErrorKind () {
        return this._lastErrorKind || null;
    }

    /**
     * @description Records a failed materialization attempt.
     * @param {Error} error - The failure.
     * @param {String} errorKind - Classification, e.g. "missingRecord".
     * @returns {SvStoreRef}
     * @category Failure Handling
     */
    recordFailedAttempt (error, errorKind) {
        if (!this._lastAttemptTime) {
            Object.defineSlot(this, "_attemptCount", 0);
            Object.defineSlot(this, "_lastAttemptTime", null);
            Object.defineSlot(this, "_lastError", null);
            Object.defineSlot(this, "_lastErrorKind", null);
        }
        this._attemptCount = this.attemptCount() + 1;
        this._lastAttemptTime = Date.now();
        this._lastError = error;
        this._lastErrorKind = errorKind;
        return this;
    }

    /**
     * @description Whether a materialization attempt (a pool lookup) is allowed
     * now: true if never attempted, or if the growing window since the last
     * failed attempt has elapsed (5s doubling per attempt, capped at 60s —
     * bounded, since deterministic failures shouldn't churn). There is no
     * terminal give-up state: the next access after the window may always retry.
     * @returns {Boolean}
     * @category Failure Handling
     */
    canAttemptNow () {
        if (!this._lastAttemptTime) {
            return true;
        }
        const windowMs = Math.min(5000 * Math.pow(2, this.attemptCount() - 1), 60000);
        return (Date.now() - this._lastAttemptTime) >= windowMs;
    }

}.initThisClass());
