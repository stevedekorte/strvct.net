"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_notifications
 * @extends SvNode
 * @classdesc Notifications: progress shared up the parent chain, and the notes a node posts for views (didUpdateNode, focus and navigation requests).
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_notifications extends SvNode {

    // --- parent chain notifications ---

    shareProgress (status, visited = new Set()) {
        assert(!visited.has(this), "shareProgress: loop detected");
        visited.add(this);

        const msg = "onDescendantProgress";
        const o = this.ownerOrParentNode();
        if (o) {
            if (o.respondsTo(msg)) {
                o.perform(msg, this, status);
            } else {
                o.shareProgress(status, visited);
            }
        }
    }

    notifyOwners (msg, args = []) {
        // WHY:
        // this pattern avoids:
        // - having to set delegates (and managing their lifetimes)
        // - dealing with passing messages up through collection or other intermediary objects
        // CONVENTIONS:
        // - use await instead of delegate messages for COMPLETION & ERRORS (check error slot)
        // - use notifyOwners() for PROGRESS messages - the receiver might forward it further, possibly changing the arguments
        // e.g. a node might report it's complete, and the receiver might forward the current number of complete items
        this.tellFirstRespondingOwnerOrParentNode(msg, args);
    }

    tellFirstRespondingOwnerOrParentNode (msg, args = [], visited = new Set()) {
        // the chain shouldn't have loops, but let's be safe
        assert(!visited.has(this), "tellFirstRespondingOwnerOrParentNode: loop detected");
        visited.add(this);
        const o = this.ownerOrParentNode();
        if (o) {
            if (o.respondsTo(msg)) {
                // NOTE: we leave it up to the receiving node to forward it
                // further up the chain if needed
                // IMPORTANT: it should pass the visited set
                o.perform(msg, args, visited);
                return;
            } else {
                o.tellFirstRespondingOwnerOrParentNode(msg, args, visited);
            }
        }
    }

    /**

     * @description Send a message to this instance's parent nodes.
     * @param {string} msg - The message to send.
     * @param {*} aNode - The node associated with the message.
     */
    tellFirstRespondingParentNode (msg, args = []) {
        // the chain shouldn't have loops
        const p = this.parentNode();
        if (p) {
            if (p.respondsTo(msg)) {
                p.perform(msg, args);
                return;
            } else {
                // we leave it up to the responding parent to forward it
                // further up the chain if needed
                p.tellFirstRespondingParentNode(msg, args);
            }
        }
    }

    /**

     * @description Get the parent chain of this instance.
     * @param {Array} [chain=[]] - The current parent chain.
     * @returns {Array} The parent chain of this instance.
     */
    parentChainNodes (chain = []) {
        chain.unshift(this);
        const p = this.parentNode();
        if (p) {
            p.parentChainNodes(chain);
        }
        return chain;
    }

    /**

     * @description Get the parent chain from this instance to a given node.
     * @param {SvNode} node - The target node.
     * @param {Array} [chain=[]] - The current parent chain.
     * @returns {Array} The parent chain from this instance to the target node.
     */
    parentChainNodeTo (node, chain = []) {
        if (this !== node) {
            chain.unshift(this);
            const p = this.parentNode();
            if (p) {
                p.parentChainNodeTo(node, chain);
            }
        }
        return chain;
    }

    /**

     * @description Get the first parent node of a given class in this instance's parent chain.
     * @param {Function} aClass - The class to search for.
     * @returns {SvNode|null} The first parent node of the given class, or null if not found.
     */
    firstParentChainNodeOfClass (aClass) {
        //return this.firstParentChainNodeDetect(node => node.thisClass().isSubclassOf(aClass));

        if (this.thisClass().isSubclassOf(aClass)) {
            return this;
        }

        if (this.parentNode()) {
            return this.parentNode().firstParentChainNodeOfClass(aClass);
        }

        return null;
    }

    /**
     * @description Get the first owner node of a given class in this instance's ownership chain.
     * @param {Function} aClass - The class to search for.
     * @returns {SvNode|null} The first owner node of the given class, or null if not found.
     */

    firstOwnerChainNodeOfClass (aClass) {
        return this.ownershipChain().detect(node => node.thisClass().isSubclassOf(aClass));
    }

    /**
     * @description Get the first owner node that responds to a given method in this instance's ownership chain.
     * @param {string} methodName - The method name to search for.
     * @returns {SvNode|null} The first owner node that responds to the given method, or null if not found.
     */
    firstOwnerChainNodeThatRespondsTo (methodName) {
        return this.ownershipChain().detect(node => node.respondsTo(methodName));
    }

    responseFromFirstOwnerChainNodeThatRespondsTo (methodName) {
        const node = this.firstOwnerChainNodeThatRespondsTo(methodName);
        if (node) {
            return node[methodName]();
        }
        return undefined;
    }

    /**

     * @description Get the first parent node that responds to a given method in this instance's parent chain.
     * @param {string} methodName - The method name to search for.
     * @returns {SvNode|null} The first parent node that responds to the given method, or null if not found.
     */
    firstParentChainNodeThatRespondsTo (methodName) {
        return this.firstParentChainNodeDetect(node => node.respondsTo(methodName));
    }

    /**

     * @description Get the first parent node that satisfies a given condition in this instance's parent chain.
     * @param {Function} func - The condition function.
     * @returns {SvNode|null} The first parent node that satisfies the condition, or null if not found.
     */
    firstParentChainNodeDetect (func) {
        // return this.parentChainNodes().detect(func);
        if (func(this)) {
            return this;
        }

        if (this.parentNode()) {
            return this.parentNode().firstParentChainNodeDetect(func);
        }

        return null;
    }

    // --- post notifications ----------------------------------------

    /**

     * @description Post the shouldFocusSubnode notification.
     * @param {SvNode} aSubnode - The subnode to focus.
     * @returns {SvNode} This instance.
     */
    postShouldFocusSubnode (aSubnode) {
        assert(aSubnode);
        this.shouldFocusSubnodeNote().setInfo(aSubnode).post();
        return this;
    }

    /**

     * @description Post the shouldFocusAndExpandSubnode notification.
     * @param {SvNode} aSubnode - The subnode to focus and expand.
     * @returns {SvNode} This instance.
     */
    postShouldFocusAndExpandSubnode (aSubnode) {
        assert(aSubnode);
        this.shouldFocusAndExpandSubnodeNote().setInfo(aSubnode).post();
        return this;
    }

    /**
     * @description Post the onRequestNavigateToNode notification.
     * @returns {SvNode} This instance.
     */
    postOnRequestNavigateToNode () {
        /*
        if (this.parentNode()) {
            this.parentNode().postShouldFocusSubnode(this);
        }
        */
        this.postNoteNamed("onRequestNavigateToNode", this);
        return this;
    }

    // -- adding subnodes by instantiating subnode class ----

    /**

     * @description Add a new subnode at a given index without any checks.
     * @param {number} anIndex - The index at which to add the subnode.
     * @returns {SvNode|null} The added subnode, or null if no subnode was added.
     */
    justAddAt (anIndex) {
        const classes = this.subnodeClasses().shallowCopy();

        let newSubnode = null;
        if (classes.length === 0) {
            newSubnode = null;
        } else if (classes.length === 1) {
            let aClass = classes.first();
            if (Type.isString(aClass)) {
                SvGlobals.assertHas(aClass, "class '" + aClass + "' not found");
                aClass = SvGlobals.get(aClass);
                assert(Type.isClass(aClass), "value not a class");
            }
            newSubnode = aClass.clone();
        } else {
            newSubnode = SvCreatorNode.clone();
            newSubnode.addSubnodesForObjects(classes);
        }

        if (newSubnode) {
            this.addSubnodeAt(newSubnode, anIndex);
        }
        return newSubnode;
    }

    /**

     * @description Add a new subnode at the end of the subnode list without any checks.
     * @returns {SvNode|null} The added subnode, or null if no subnode was added.
     */
    justAdd () {
        return this.justAddAt(this.appendIndex());
    }

    /**

     * @description Add a new subnode at a given index.
     * @param {number} anIndex - The index at which to add the subnode.
     * @returns {SvNode|null} The added subnode, or null if no subnode was added.
     */
    addAt (anIndex) {
        const newSubnode = this.justAddAt(anIndex);
        if (newSubnode) {
            this.didUpdateNodeIfInitialized();
            this.postShouldFocusAndExpandSubnode(newSubnode);
        }
        return newSubnode;
    }

    /**

     * @description Add a new subnode at the end of the subnode list.
     * @returns {SvNode|null} The added subnode, or null if no subnode was added.
     */
    add (noArg) {
        assert(noArg === undefined);
        return this.addAt(this.appendIndex());
    }

    /**

     * @description Remove this instance from its parent node.
     * @returns {SvNode} This instance.
     */
    removeFromParentNode () {
        const pn = this.parentNode();
        if (pn) {
            pn.removeSubnode(this);
        } else {
            throw new Error("missing parentNode");
        }
        return this;
    }

    /**

     * @description Remove this instance from its parent node and destroy it.
     * @returns {SvNode} This instance.
     */
    delete () {
        // Deletion marker, set BEFORE detaching: parent containers observe
        // removals for many reasons (structural swaps like
        // replaceSubnodeWith included), and only true deletions should have
        // deletion side effects (e.g. SvCloudFolder queueing a cloud
        // delete). Transient — never stored.
        this._isBeingDeleted = true;
        this.removeFromParentNode();
        return this;
    }

    /**
     * @description Whether this node is being (or has been) deleted via
     * delete(), as opposed to merely removed/re-parented. Containers use
     * this to distinguish deletions from structural removals.
     * @returns {Boolean}
     * @category Deletion
     */
    isBeingDeleted () {
        return this._isBeingDeleted === true;
    }

    deleteNodeAndNavigateToParent () {
        const parentNode = this.parentNode();
        this.delete();
        // An already-detached/orphaned node has no parent to navigate to.
        // Still perform the delete (above), just skip the navigation
        // rather than throwing on a null parent.
        if (parentNode && typeof parentNode.postOnRequestNavigateToNode === "function") {
            parentNode.postOnRequestNavigateToNode();
        }
        return this;
    }

}.initThisCategory());
