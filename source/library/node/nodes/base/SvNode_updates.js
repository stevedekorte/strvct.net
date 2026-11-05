"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_updates
 * @extends SvNode
 * @classdesc The update / sync system: didUpdateNode and its relatives, the subnode-index queries the update path uses, and first-access preparation.
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_updates extends SvNode {

    // --- update / sync system ----------------------------

    /**

     * @description Trigger the didUpdateNode method if this instance has been initialized.
     * @returns {boolean} Whether the didUpdateNode method was triggered.
     */
    didUpdateNodeIfInitialized () {
        if (this.hasDoneInit()) {
            this.didUpdateNode();
        }
    }

    /**
     * @description Called by this node's pool when a flush stored a real change
     * to its record (not a re-store of the same content). Passed up the same
     * chain didUpdateNode climbs, so every ancestor that tracks local edits
     * (SvSyncableJsonGroup) hears of it.
     * @category Storage
     */
    didStoreChangedContent () {
        const up = this.parentNode() || this.ownerNode();
        if (up && up !== this && up.didStoreChangedContent) {
            up.didStoreChangedContent();
        }
    }

    /**

     * @description Trigger the didUpdateNode notification.
     * @returns {boolean} Whether the notification was posted.
     */
    didUpdateNode () {
        if (!this.hasDoneInit()) {
            return false;
        }

        const note = this.didUpdateNodeNote();

        if (note) {
            note.post();
        }

        // TODO: make this more efficient, as we don't always need it

        if (this.parentNode()) {
            assert(this.parentNode() !== this, "didUpdateNode: parent node is self");
            this.parentNode().didUpdateNodeIfInitialized();
        } else if (this.ownerNode()) {
            this.ownerNode().didUpdateNodeIfInitialized();
        }

        return true;
    }

    /**

     * @description Check if this instance has duplicate subnodes.
     * @returns {boolean} Whether this instance has duplicate subnodes.
     */
    hasDuplicateSubnodes () {
        return this.subnodes().hasDuplicates();
    }

    /**

     * @description Get the index of a subnode in this instance's subnode list.
     * @param {SvNode} aSubnode - The subnode to find.
     * @returns {number} The index of the subnode, or -1 if not found.
     */
    indexOfSubnode (aSubnode) {
        return this.subnodes().indexOf(aSubnode);
    }

    /**

     * @description Get the index of this instance in its parent's subnode list.
     * @returns {number} The index of this instance in its parent's subnode list.
     */
    subnodeIndexInParent () {
        const p = this.parentNode();
        if (p) {
            return p.indexOfSubnode(this);
        }
        return 0;
    }

    /**

     * @description Get the depth of this instance in the node hierarchy.
     * @returns {number} The depth of this instance in the node hierarchy.
     */
    nodeDepth () {
        const p = this.parentNode();
        if (p) {
            return p.nodeDepth() + 1;
        }
        return 0;
    }

    // ---------------------------------------

    /**

     * @description Prepare this instance to access its subnodes.
     */
    prepareToAccess () {
        // this should be called whenever subnodes need to be accessed? See willGetSlotSubnodes
        if (!this.didPrepareForFirstAccess()) {
            this.setDidPrepareForFirstAccess(true);
            this.prepareForFirstAccess();
        }
    }

    /**

     * @description Prepare this instance for the first access to its subnodes.
     */
    prepareForFirstAccess () {
        // subclasses can override
    }

    /*
    willGetSlotSubnodes () {
        this.prepareToAccess(); // infinite loop?
    }
    */

}.initThisCategory());
