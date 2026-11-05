"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_subnodes
 * @extends SvNode
 * @classdesc Subnodes: the parent link, adding, inserting, replacing, removing and reordering subnodes, accepted subnode types, and recursive walks.
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_subnodes extends SvNode {

    /**
     * @description True when this node is the root of its own pool: a direct
     * subnode of a collection whose subnodesArePools. (The home root has no
     * parent and is its pool's root by construction.)
     * @returns {Boolean}
     * @category Record Store
     */
    isPoolRoot () {
        const parent = this.parentNode();
        return !!(parent && parent.subnodesArePools && parent.subnodesArePools());
    }

    /**

     * @description Handle the update of the parent node slot.
     * @param {SvNode} oldValue - The old parent node.
     * @param {SvNode} newValue - The new parent node.
     */
    didUpdateSlotParentNode (/*oldValue, newValue*/) {
        // for subclasses to override
    }

    /**
     * @description End-of-event-loop orphan check, scheduled by setParentNode
     * when this node's parent transitions to null. If the node was re-homed
     * during the loop (reparent / replaceSubnodeWith readd) its parent is
     * non-null here and we do nothing. If it is STILL parentless, the reparent
     * never happened: the node is an orphan that something may still be holding
     * (a bound view, an in-flight loop). Surface it loudly and post
     * `nodeBecameOrphan` so a bound view/observer can react (rebind, navigate
     * away, error). Model announces the fact; the view decides what to do.
     * @category Lifecycle
     */
    /**
     * @description A node that hides itself must not remain the selection.
     * Hiding leaves the node in its parent's subnodes — only its tile is
     * display:none — so a selected node that goes invisible would keep its
     * content on screen under a tab that is no longer there. Posts
     * `nodeBecameInvisible` so a bound column can fold itself away.
     *
     * Same division of labour as nodeBecameOrphan: the model announces the
     * fact, the view decides what to do, and the note is dispatched by name to
     * whichever view defines a handler (only SvStackView does). Unlike
     * orphaning this needs no end-of-loop check — a visibility transition is
     * definitive, and a node that hides and re-shows within one loop posts
     * both notes, leaving the column re-derived either way.
     * @param {Boolean} oldValue
     * @param {Boolean} newValue
     * @category Lifecycle
     */
    didUpdateSlotIsVisible (oldValue, newValue) {
        if (oldValue !== false && newValue === false) {
            this.postNoteNamed("nodeBecameInvisible");
        }
        return this;
    }

    checkForOrphan () {
        if (this.parentNode() !== null) {
            return; // re-homed this event loop (reparent / replace-then-readd) — not an orphan
        }
        // Debug-only: this fires on every deliberate permanent removal too
        // (expired conditions, options rebuilds, deleted messages), and the
        // check can't tell those from a genuine leak. Re-enable via
        // isDebugging when hunting the stale-orphan bug class.
        this.isDebugging() && console.warn(this.svDebugId() + " became an orphan — parentNode is still null at end of the event loop (not re-homed by a reparent). A bound view or in-flight reference may now be dangling.");
        this.postNoteNamed("nodeBecameOrphan");
    }

    /**

     * @description Get the root node of this instance's parent chain.
     * @returns {SvNode} The root node.
     */
    rootNode () {
        const pn = this.parentNode();
        if (pn) {
            return pn.rootNode();
        }
        return this;
    }

    // subnodes

    /**

     * @description Get the number of subnodes.
     * @returns {number} The number of subnodes.
     */
    subnodeCount () {
        if (this.slotIsPendingMaterialization("subnodes")) {
            // Count from the stored record (an ordered list of element refs)
            // without materializing the child objects — so asking for a count
            // (e.g. a "N locations" note) doesn't trigger a lazy load.
            const c = this.pendingSubnodesCount();
            if (c !== null) {
                return c;
            }
            return this.subnodes().length; // fall back: materialize
        }
        return this._subnodes.length;
    }

    /**
     * @description Count of the still-lazy subnodes array, read from its stored
     * record without materializing the child objects. Returns null when the
     * count can't be derived cheaply (the store offers no synchronous
     * raw-record read, the record is absent, or it isn't the expected array
     * shape), so callers fall back to materializing. Store-neutral by
     * construction: a store that can't do a cheap synchronous read just gets
     * the fallback — nothing here forces materialization.
     * @returns {number|null}
     * @category Subnodes
     */
    pendingSubnodesCount () {
        const slot = this.thisPrototype().slotNamed("subnodes");
        const ref = slot ? slot.onInstanceRawGetValue(this) : null;
        if (typeof SvStoreRef === "undefined" || !(ref instanceof SvStoreRef)) {
            return null;
        }
        const store = ref.store();
        if (!store || typeof store.recordForPid !== "function") {
            return null;
        }
        let record;
        try {
            record = store.recordForPid(ref.pid()); // synchronous raw read; may be a no-op on async stores
        } catch {
            return null; // any store that can't answer cheaply → fall back
        }
        if (!record || !Array.isArray(record.values)) {
            return null;
        }
        return record.values.length; // element ref count == subnode count
    }

    firstVisibleSubnode () {
        return this.subnodes().detect(sn => this.subnodeIsVisible(sn));
    }

    /**
     * @description Whether a subnode is shown in this node's views: its own
     * isVisible(), unless this container holds it back. Views ask the parent
     * (visibleSubnodes, SvNodeView.nodeIsVisible), so a container's rule
     * applies to every kind of child whatever its isVisible() overrides.
     * @param {SvNode} aSubnode
     * @returns {Boolean}
     * @category Visibility
     */
    subnodeIsVisible (aSubnode) {
        return aSubnode.isVisible();
    }

    /**

     * @description Check if this instance has any subnodes.
     * @returns {boolean} Whether this instance has subnodes.
     */
    hasSubnodes () {
        return this.subnodeCount() > 0;
    }

    /**
     * @description The index a new subnode is appended at: the loaded array's
     * length. Never subnodeCount() — for a windowed collection that is the
     * store's count, which lags the array until the store pass runs (and is
     * larger than it when only a window is loaded), so a second element added
     * in the same tick would land before the first.
     * @returns {Number}
     * @category Node Structure
     */
    appendIndex () {
        return this.subnodes().length;
    }

    /**

     * @description Add a subnode to this instance without any checks.
     * @param {SvNode} aSubnode - The subnode to add.
     * @returns {SvNode} The added subnode.
     */
    justAddSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode));
        return this.justAddSubnodeAt(aSubnode, this.appendIndex());
    }

    /**

     * @description Add a subnode to this instance at a specific index without any checks.
     * @param {SvNode} aSubnode - The subnode to add.
     * @param {number} anIndex - The index at which to add the subnode.
     * @returns {SvNode} The added subnode.
     */
    justAddSubnodeAt (aSubnode, anIndex) {
        assert(!Type.isNullOrUndefined(aSubnode));
        assert(!this.hasSubnode(aSubnode));
        assert(aSubnode.thisClass().isKindOf(SvNode), "Attempt to add subnode of type '" + aSubnode.svType() + "' which does not inherit from SvNode (as subnodes are required to do)");
        this.subnodes().atInsert(anIndex, aSubnode);
        aSubnode.setParentNode(this);
        return aSubnode;
    }

    /**

     * @description Assert that a given subnode is a valid type.
     * @param {SvNode} aSubnode - The subnode to check.
     */
    assertValidSubnodeType (aSubnode) {
        assert(aSubnode.thisClass().isKindOf(SvNode), "Attempt to add subnode of type '" + aSubnode.svType() + "' which does not inherit from SvNode (as subnodes are required to do)");
    }

    /**

     * @description Add a subnode to this instance at a specific index.
     * @param {SvNode} aSubnode - The subnode to add.
     * @param {number} anIndex - The index at which to add the subnode.
     * @returns {SvNode} The added subnode.
     */
    addSubnodeAt (aSubnode, anIndex) {
        assert(!this.hasSubnode(aSubnode));
        this.assertValidSubnodeType(aSubnode);

        assert(anIndex >= 0);
        this.justAddSubnodeAt(aSubnode, anIndex);
        //this.didChangeSubnodeList(); // happens automatically from hooked array
        return aSubnode;
    }

    /**

     * @description Get the subnode before a given subnode.
     * @param {SvNode} aSubnode - The reference subnode.
     * @returns {SvNode|null} The subnode before the reference subnode, or null if it's the first subnode.
     */
    subnodeBefore (aSubnode) {
        const index = this.indexOfSubnode(aSubnode);
        assert(index !== -1);
        if (index > 0) {
            return this.subnodes().at(index - 1);
        }
        return null;
    }

    /**

     * @description Replace a subnode with another subnode.
     * @param {SvNode} aSubnode - The subnode to replace.
     * @param {SvNode} newSubnode - The new subnode.
     * @returns {SvNode} The new subnode.
     */
    replaceSubnodeWith (aSubnode, newSubnode) {
        assert(!this.hasSubnode(newSubnode));

        const index = this.indexOfSubnode(aSubnode);
        assert(index !== -1);
        this.removeSubnode(aSubnode);
        this.addSubnodeAt(newSubnode, index);
        return newSubnode;
    }

    /**

     * @description Replace a subnode with multiple subnodes.
     * @param {SvNode} aSubnode - The subnode to replace.
     * @param {Array} newSubnodes - The new subnodes.
     * @returns {SvNode} This instance.
     */
    replaceSubnodeWithSubnodes (aSubnode, newSubnodes) {
        let index = this.indexOfSubnode(aSubnode);
        assert(index !== -1);
        this.removeSubnode(aSubnode);

        newSubnodes.forEach(sn => {
            this.addSubnodeAt(sn, index);
            index ++;
        });
        return this;
    }

    /**

     * @description Move multiple subnodes to a specific index.
     * @param {Array} movedSubnodes - The subnodes to move.
     * @param {number} anIndex - The index to which to move the subnodes.
     * @returns {SvNode} This instance.
     */
    moveSubnodesToIndex (movedSubnodes, anIndex) {
        this.subnodes().moveItemsToIndex(movedSubnodes, anIndex);
        return this;
    }

    /**

     * @description Add a subnode to this instance.
     * @param {SvNode} aSubnode - The subnode to add.
     * @returns {SvNode} The added subnode.
     */
    addSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode), "addSubnode: subnode already exists");
        return this.addSubnodeAt(aSubnode, this.appendIndex());
    }

    /**

     * @description Add a link subnode to this instance.
     * @param {SvNode} aNode - The node to link to.
     * @returns {SvLinkNode} The created link subnode.
     */
    addLinkSubnode (aNode) {
        /*
        if (aNode.parentNode()) {
            console.warn("adding a link subnode to a node with no parent (yet)")
        }
        */
        const link = SvLinkNode.clone().setLinkedNode(aNode);
        this.addSubnode(link);
        return link;
    }

    addSubnodePointerFieldsFor (nodes) {
        nodes.forEach(node => {
            const pointerField = SvPointerField.clone().setValue(node);
            this.addSubnode(pointerField);
        });
        return this;
    }

    /*
    addSubnodeCopies (subnodes) {
        const copies = subnodes.map(subnode => subnode.duplicate());
        this.addSubnodes(copies);
        return this;
    }
    */

    /**

     * @description Add multiple subnodes to this instance.
     * @param {Array} subnodes - The subnodes to add.
     * @returns {SvNode} This instance.
     */
    addSubnodes (subnodes) {
        subnodes.forEach(subnode => this.addSubnode(subnode));
        return this;
    }

    /**

     * @description Add multiple subnodes to this instance if they are not already present.
     * @param {Array} subnodes - The subnodes to add.
     * @returns {SvNode} This instance.
     */
    addSubnodesIfAbsent (subnodes) {
        subnodes.forEach(subnode => this.addSubnodeIfAbsent(subnode));
        return this;
    }

    /**
     * @description Wraps each node in an SvLinkNode and adds it as a subnode.
     * This avoids reparenting the original nodes away from their owners.
     * @param {Array} nodes - The nodes to link.
     * @returns {SvNode} This instance.
     * @category Subnodes
     */
    addLinkSubnodes (nodes) {
        nodes.forEach(node => {
            const link = SvLinkNode.clone();
            link.setLinkedNode(node);
            this.addSubnode(link);
        });
        return this;
    }

    /**
     * @description Returns the linked nodes from all SvLinkNode subnodes.
     * @returns {Array} The linked node instances.
     * @category Subnodes
     */
    linkedSubnodes () {
        return this.subnodes().map(node => {
            assert(node.linkedNode, node.svType() + " is not an SvLinkNode");
            return node.linkedNode();
        });
    }

    /**

     * @description Get the prototype for creating new subnodes.
     * @returns {Function} The prototype for creating new subnodes.
     */
    subnodeProto () {
        return this.subnodeClasses().first();
    }

    /**

     * @description Set the prototype for creating new subnodes.
     * @param {Function} aProto - The prototype for creating new subnodes.
     * @returns {SvNode} This instance.
     */
    setSubnodeProto (aProto) {
        this.subnodeClasses().removeAll();
        this.subnodeClasses().appendIfAbsent(aProto);
        return this;
    }

    /**
     * @description Whether a node of aClass belongs in this collection.
     *
     * SUBCLASSES COUNT. An empty subnodeClasses() means "anything"; otherwise a
     * class is accepted when it IS one of the declared classes or DESCENDS from
     * one. Callers used to test `subnodeClasses().includes(aClass)`, an exact
     * match that rejected a subclass of a declared class — which contradicts the
     * polymorphism rule the model layer is built on: a UoArtifact that extends
     * UoItem IS a UoItem, and a collection of UoItem should take it. The exact
     * match silently dropped such a node with a console warning.
     * @param {Function} aClass - the candidate subnode's class
     * @returns {Boolean}
     * @category Subnodes
     */
    acceptsSubnodeClass (aClass) {
        const allowed = this.subnodeClasses();
        if (allowed.length === 0) {
            return true; // unconstrained
        }
        if (!aClass) {
            return false;
        }
        return allowed.some(allowedClass =>
            aClass === allowedClass
            || (aClass.isSubclassOf && aClass.isSubclassOf(allowedClass)));
    }

    /**

     * @description Get the accepted subnode types.
     * @returns {Array} An array of accepted subnode types.
     */
    acceptedSubnodeTypes () {
        const types = [];
        this.subnodeClasses().forEach(c => types.push(c.svType()));
        return types;
    }

    /**

     * @description Check if this instance accepts adding a given subnode.
     * @param {SvNode} aSubnode - The subnode to check.
     * @returns {boolean} Whether this instance accepts adding the subnode.
     */
    acceptsAddingSubnode (aSubnode) {
        if (aSubnode === this) {
            return false;
        }

        /*
        if (this.hasSubnode(aSubnode)) {
            return false;
        }
        */
        //const type = aSunode.svType();
        const ancestors = aSubnode.thisClass().ancestorClassesTypesIncludingSelf();
        return this.acceptedSubnodeTypes().canDetect(type => ancestors.contains(type));
    }

    /**

     * @description Perform a function on each subnode recursively.
     * @param {Function} fn - The function to perform on each subnode.
     */
    forEachSubnodeRecursively (fn) {
        this.subnodes().forEach(sn => {
            fn(sn);
            sn.forEachSubnodeRecursively(fn);
        });
    }

    /**

     * @description Select subnodes recursively based on a function.
     * @param {Function} fn - The function to select subnodes.
     * @returns {Array} An array of selected subnodes.
     */
    selectSubnodesRecursively (fn) {
        const results = [];
        this.forEachSubnodeRecursively(subnode => {
            if (fn(subnode)) {
                results.push(subnode);
            }
        });
        return results;
    }

    // --------

    /**

     * @description Add a subnode to this instance if it is not already present.
     * @param {SvNode} aSubnode - The subnode to add.
     * @returns {boolean} Whether the subnode was added.
     */
    addSubnodeIfAbsent (aSubnode) {
        if (!this.hasSubnode(aSubnode)) {
            this.addSubnode(aSubnode);
            return true;
        }
        return false;
    }

    /**

     * @description Remove a subnode from this instance if it is present.
     * @param {SvNode} aNode - The subnode to remove.
     * @returns {SvNode} This instance.
     */
    removeSubnodeIfPresent (aNode) {
        if (this.hasSubnode(aNode)) {
            this.removeSubnode(aNode);
        }
        return this;
    }

    /**

     * @description Get the hash value for this instance.
     * @returns {string} The hash value.
     */
    hash () {
        // don't assume hash() always returns the puuid as
        // subclasses can override to measure equality in their own way
        return this.puuid();
    }

    /**

     * @description Create an index for the subnodes array.
     * @returns {SvNode} This instance.
     */
    createSubnodesIndex () {
        this.subnodes().setIndexClosure(v => v.hash());
        return this;
    }

    cleanSubnodes () {
        const subnodes = this.subnodes();
        for (let index = subnodes.length - 1; index > -1; index--) {
            const sn = subnodes.at(index);
            if (Type.isNullOrUndefined(sn)) {
                const beforeCount = subnodes.length;
                subnodes.removeAt(index); // raw removal
                const afterCount = subnodes.length;
                if (beforeCount === afterCount) {
                    throw new Error("failed to remove subnode at index " + index);
                }
            }
        }
    }

    /**

     * @description Check if this instance has a given subnode.
     * @param {SvNode} aSubnode - The subnode to check.
     * @returns {boolean} Whether this instance has the subnode.
     */
    hasSubnode (aSubnode) {
        const subnodes = this.subnodes();
        if (subnodes.length > 100) {
            this.createSubnodesIndex();
            return subnodes.indexHasItem(aSubnode);
        }
        //return subnodes.detect(subnode => subnode === aSubnode);
        //this.cleanSubnodes(); // TODO: remove after debugging
        return subnodes.detect(subnode => {
            /*
            if (Type.isNullOrUndefined(subnode)) {
                this.cleanSubnodes();
            }
            */
            return subnode.isEqual(aSubnode);
        });
    }

    /**

     * @description Remove a subnode from this instance without any checks.
     * @param {SvNode} aSubnode - The subnode to remove.
     * @returns {SvNode} The removed subnode.
     */
    justRemoveSubnode (aSubnode) { // private method
        this.subnodes().remove(aSubnode);

        if (aSubnode.parentNode() === this) {
            aSubnode.setParentNode(null);
        }

        return aSubnode;
    }

    /**

     * @description Remove a subnode from this instance.
     * @param {SvNode} aSubnode - The subnode to remove.
     * @returns {SvNode} The removed subnode.
     */
    removeSubnode (aSubnode) {
        this.justRemoveSubnode(aSubnode);
        //this.didChangeSubnodeList(); // handled by hooked array
        return aSubnode;
    }

    /**

     * @description Remove multiple subnodes from this instance.
     * @param {Array} subnodeList - The subnodes to remove.
     * @returns {SvNode} This instance.
     */
    removeSubnodes (subnodeList) {
        subnodeList.forEach(sn => this.removeSubnode(sn));
        return this;
    }

    /**

     * @description Remove all subnodes from this instance.
     * @returns {SvNode} This instance.
     */
    removeAllSubnodes () {
        // the loaded subnodes, not subnodeCount(): for a windowed collection
        // that is the store's count, which misses elements added since the
        // last store pass — a chat holding only new messages was not cleared,
        // so a session's opening system prompt landed after them ("Invalid
        // message role: system" from Gemini)
        const hasLoaded = Array.isArray(this._subnodes) && this._subnodes.length > 0;
        if (hasLoaded || (!this.subnodesAreWindowed() && this.subnodeCount())) { // a lazy, unmaterialized list still counts
            this.subnodes().slice().forEach((subnode) => {
                this.justRemoveSubnode(subnode);
            });
            //this.didChangeSubnodeList() handled by hooked array but this could be more efficient
        }
        return this;
    }

    /**

     * @description Handle the reordering of parent subnodes.
     */
    didReorderParentSubnodes () {
    }

    /**

     * @description Handle the reordering of subnodes.
     */
    onDidReorderSubnodes () {
        if (!this._subnodes) {
            return this; // no array yet (never accessed, or restored to its pre-access state)
        }
        if (this.slotIsPendingMaterialization("subnodes")) {
            // A stale action from before the load parked the stub (init created
            // a default array, scheduling this; loadFromRecord replaced it).
            // Nothing to reorder — and materializing here would reschedule this
            // same action mid-pass, tripping the scheduler's loop guard.
            // Materialization re-fires didChangeSubnodeList anyway.
            return;
        }
        this.subnodes().forEach(subnode => subnode.didReorderParentSubnodes());
    }

    /**

     * @description Handle the change of the subnode list.
     * @returns {SvNode} This instance.
     */
    didChangeSubnodeList () {
        //this.subnodes().forEach(subnode => assert(subnode.parentNode() === this)); // TODO: remove after debugging
        this.scheduleMethod("onDidReorderSubnodes");
        //this.subnodes().forEach(subnode => subnode.didReorderParentSubnodes());
        if (this.hasDoneInit()) {
            this.didUpdateNode();
            // No storage relay here, deliberately. Storage does not need this
            // node to report the change: the subnodes array is itself an
            // active stored object (shouldStore true, referenced from this
            // node's record), so SvObjectPool observes the ARRAY directly —
            // the same hooked-array mutation that brought us here also
            // dirties the array in the pool, and serializing the array
            // enrolls any new child, whose later slot writes are then
            // observed. This node's own record ({"*": arrayPid}) does not
            // change on an append, so re-recording it would write an
            // identical record. Pinned by TestSubnodeAppendPersistence, in
            // the base pool and the sub-object pool, with this node's
            // didMutate silenced. (A relay to didMutate("subnodes") lived
            // here 2026-05 → 2026-09 on the theory that the pool observed
            // only the node; a whole-array replacement still reaches storage
            // through the slot setter — see didUpdateSlotSubnodes.)
        }
        return this;
    }

    /**

     * @description Copy subnodes from another instance.
     * @param {Array} newSubnodes - The new subnodes.
     * @returns {SvNode} This instance.
     */
    copySubnodes (newSubnodes) {
        newSubnodes.forEach(sn => {
            sn.setParentNode(this);
        });
        this.subnodes().copyFrom(newSubnodes);
        return this;
    }

    /**

     * @description Reorder the subnodes of this instance.
     * @param {Array} newSubnodes - The new order of subnodes.
     * @returns {SvNode} This instance.
     */
    nodeReorderSudnodesTo (newSubnodes) {
        this.copySubnodes(newSubnodes);
        return this;
    }

    /**

     * @description Move this instance to the first position in its parent's subnode list.
     * @returns {SvNode} This instance.
     */
    orderFirst () {
        this.parentNode().orderSubnodeFirst(this);
        return this;
    }

    /**

     * @description Move this instance to the last position in its parent's subnode list.
     * @returns {SvNode} This instance.
     */
    orderLast () {
        this.parentNode().orderSubnodeLast(this);
        return this;
    }

    /**

     * @description Move a subnode to the first position in this instance's subnode list.
     * @param {SvNode} aSubnode - The subnode to move.
     * @returns {SvNode} This instance.
     */
    orderSubnodeFirst (aSubnode) {
        assert(aSubnode, "orderSubnodeFirst: subnode is null");
        assert(this.hasSubnode(aSubnode), "orderSubnodeFirst: subnode does not exist");
        const subnodes = this.subnodes().shallowCopy();
        subnodes.remove(aSubnode);
        subnodes.atInsert(0, aSubnode);
        this.nodeReorderSudnodesTo(subnodes);
        return this;
    }

    /**

     * @description Move a subnode to the last position in this instance's subnode list.
     * @param {SvNode} aSubnode - The subnode to move.
     * @returns {SvNode} This instance.
     */
    orderSubnodeLast (aSubnode) {
        assert(this.hasSubnode(aSubnode), "orderSubnodeLast: subnode does not exist");
        const subnodes = this.subnodes().shallowCopy();
        subnodes.remove(aSubnode);
        subnodes.push(aSubnode);
        this.nodeReorderSudnodesTo(subnodes);
        return this;
    }

}.initThisCategory());
