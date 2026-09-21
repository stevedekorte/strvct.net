"use strict";

/**
 * @module library.ideal.transactions
 * @class SvTransactionContext
 * @extends ProtoClass
 * @classdesc The one place the runtime's hooks ask "is a transaction open, and
 * what should I tell it?" (Plans/Client Transactions). A context stack: the
 * outermost `pool.transaction(fn)` opens the transaction, a nested call on the
 * same pool joins it. Every hook is a no-op when no transaction is open — one
 * static read.
 *
 * Hooks that call in here:
 *   snapshotObjectIfNeeded      ProtoClass.setSlotValue, SvNode.setParentNode / setSubnodes
 *   snapshotCollectionIfNeeded  Object_mutation.willMutate (every hooked collection method)
 *   noteAllocated               ProtoClass.clone (SvNode kinds), before init
 *   noteLoaded                  SvObjectPool.objectForRecord, Slot.onInstanceMaterializeLazyJson
 *   noteEnrolled                SvObjectPool.addActiveObject
 *   noteScheduledAction / notePostedNote / noteTimeout   the three queues
 *   assertNoneOpen              app-owned effect queues and observed-slot rebinding
 */
(class SvTransactionContext extends ProtoClass {

    static stack () {
        if (!this._stack) {
            this._stack = [];
        }
        return this._stack;
    }

    /**
     * @description The open transaction, or null.
     * @returns {SvTransaction|null}
     * @category Context
     */
    static current () {
        const stack = this.stack();
        return stack.length > 0 ? stack[stack.length - 1] : null;
    }

    static push (transaction) {
        this.stack().push(transaction);
        return this;
    }

    static pop (transaction) {
        const stack = this.stack();
        assert(stack[stack.length - 1] === transaction, "transaction context stack out of order");
        stack.pop();
        return this;
    }

    /**
     * @description Whether applyJsonPatches wraps a batch in the root's pool
     * transaction (rolling back whole on any failure). Off until the patch
     * path is playtested with it (Plans/Client Transactions, prototype step 9).
     * @category Flags
     */
    static setPatchesUseTransactions (aBool) {
        this._patchesUseTransactions = aBool;
        return this;
    }

    static patchesUseTransactions () {
        return this._patchesUseTransactions === true;
    }

    // --- hooks ---

    static snapshotObjectIfNeeded (anObject) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring() && this.isModelObject(anObject)) {
            transaction.snapshotObject(anObject);
        }
    }

    /**
     * @description Transactions are a model concern: only SvNode kinds are
     * captured. Sync actions, notifications, observations, requests and views
     * set slots too, but are never tracked or restored.
     * @category Hooks
     */
    static isModelObject (anObject) {
        return typeof SvNode !== "undefined" && anObject instanceof SvNode;
    }

    static snapshotCollectionIfNeeded (aCollection) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring()) {
            transaction.snapshotCollection(aCollection);
        }
    }

    static noteAllocated (anObject) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring()) {
            transaction.allocatedObjects().add(anObject);
        }
    }

    static noteLoaded (anObject) {
        const transaction = this.current();
        if (transaction) {
            transaction.loadedObjects().add(anObject);
            transaction.allocatedObjects().delete(anObject);
        }
    }

    static noteEnrolled (anObject, aPool) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring() && aPool === transaction.pool()) {
            transaction.createdObjects().add(anObject);
        }
    }

    static noteScheduledAction (anAction) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring()) {
            transaction.taggedActions().add(anAction);
        }
    }

    static notePostedNote (aNote) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring()) {
            transaction.taggedNotes().add(aNote);
        }
    }

    static noteTimeout (anOwner, aTimeoutId) {
        const transaction = this.current();
        if (transaction && !transaction.isRestoring()) {
            transaction.taggedTimeouts().push([anOwner, aTimeoutId]);
        }
    }

    /**
     * @description Guards an operation that a transaction cannot undo (an
     * app-owned effect queue, rebinding an observed slot): when a transaction is
     * open it is marked rollback-only FIRST — a caller's try/catch may swallow
     * the throw — and then refused.
     * @param {String} what - the refused operation, for the message
     * @category Guards
     */
    static assertNoneOpen (what) {
        const transaction = this.current();
        if (transaction) {
            transaction.setIsRollbackOnly(true);
            throw new Error(what + " is not allowed inside a transaction (it cannot be rolled back); the transaction will roll back");
        }
    }

}.initThisClass());
