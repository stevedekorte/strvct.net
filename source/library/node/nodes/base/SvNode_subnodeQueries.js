"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_subnodeQueries
 * @extends SvNode
 * @classdesc Subnode queries and tree edits: finding parents and subnodes by type, lookup by title or key, counting, sorting, indexing, moving subnodes between nodes, leaves, and option-node helpers.
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_subnodeQueries extends SvNode {

    // --- utility -----------------------------

    /**

     * @description Get the first parent node of a given class.
     * @param {string} className - The class name to search for.
     * @returns {SvNode|null} The first parent node of the given class, or null if not found.
     */
    parentNodeOfType (className) {
        if (this.svType() === className) {
            return this;
        }

        if (this.parentNode()) {
            return this.parentNode().parentNodeOfType(className);
        }

        return null;
    }

    /**

     * @description Get all parent nodes of this instance.
     * @returns {Array} An array of parent nodes.
     */
    parentNodes () {
        let node = this.parentNode();
        const results = [];

        while (node) {
            results.push(node);
            node = this.parentNode();
        }
        return results;
    }

    /**

     * @description Get the types of all parent nodes of this instance.
     * @returns {Array} An array of parent node types.
     */
    parentNodeTypes () {
        return this.parentNodes().map(node => node.svType());
    }

    // --- subnode lookup -----------------------------

    /**

     * @description Get all subnodes of this instance except for a given subnode.
     * @param {SvNode} aSubnode - The subnode to exclude.
     * @returns {Array} An array of subnodes excluding the given subnode.
     */
    subnodesSans (aSubnode) {
        return this.subnodes().select(subnode => subnode !== aSubnode);
    }

    /**

     * @description Get the first subnode of a given class.
     * @param {string|object} obj - The class or prototype to search for.
     * @returns {SvNode|null} The first subnode of the given class or prototype, or null if not found.
     */
    firstSubnodeOfType (obj) {
        // obj could be clas, prototype, or instance
        return this.subnodes().detect(subnode => subnode.svType() === obj.svType());
    }

    /**

     * @description Ensure a subnode of a given class exists and add it if not.
     * @param {string|object} aClass - The class or prototype to search for.
     * @returns {SvNode} The found or created subnode.
     */
    setupSubnodeOfType (aClass) {
        let subnode = this.firstSubnodeOfType(aClass);
        if (!subnode) {
            subnode = aClass.clone();
            this.addSubnode(subnode);
        }
        return subnode;
    }
    /**

     * @description Send a method to all subnodes that respond to it.
     * @param {string} aMethodName - The method name to send.
     * @param {Array} argumentList - The arguments to pass to the method.
     * @returns {SvNode} This instance.
     */
    sendRespondingSubnodes (aMethodName, argumentList) {
        this.subnodes().forEach((subnode) => {
            if (subnode[aMethodName]) {
                subnode[aMethodName].apply(subnode, argumentList);
            }
        });
        return this;
    }

    // --- subnodes -----------------------------
    /**

     * @description Get the number of subnodes of this instance. Alias of
     * subnodeCount() — shares its non-materializing lazy path.
     * @returns {number} The number of subnodes.
     */
    subnodesCount () {
        return this.subnodeCount();
    }

    /**

     * @description Handle the mutation of an object.
     * @param {object} anObject - The object that was mutated.
     */
    onDidMutateObject (anObject) {
        if (anObject === this._subnodes) {
            //assert(!this.subnodes().hasDuplicates());
            this.didChangeSubnodeList();
        }
    }

    /**

     * @description Watch the subnodes of this instance for changes.
     * @returns {SvNode} This instance.
     */
    watchSubnodes () {
        this._subnodes.addMutationObserver(this);
        return this;
    }

    /**

     * @description Check if this instance has any null subnodes.
     * @returns {boolean} True if there are null subnodes, false otherwise.
     */
    hasNullSubnodes () {
        return this.subnodes().indexOf(null) !== -1;
    }

    /**

     * @description Handle the update of the subnodes slot.
     * @param {Array} oldValue - The old subnodes array.
     * @param {Array} newValue - The new subnodes array.
     * @returns {SvNode} This instance.
     */
    didUpdateSlotSubnodes (oldValue, newValue) {
        // An SvStoreRef oldValue means a lazy subnodes slot is MATERIALIZING
        // (see Slot.onInstanceMaterializeLazySlot — the placeholder survives
        // to the setter precisely so this transition is derivable). The
        // placeholder was never observed, so there is nothing to remove.
        const isMaterialization = (oldValue instanceof SvStoreRef);
        if (oldValue && !isMaterialization) {
            oldValue.removeMutationObserver(this);
        }

        if (Type.isNullOrUndefined(newValue)) {
            console.warn("attempt to set subnodes array to null or undefined - possible corruption of object pool storage <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");

            newValue = [];
        }

        if (newValue.svType() !== "SvSubnodesArray") {

            this._subnodes = SvSubnodesArray.from(newValue);
            newValue.removeDuplicates();
            newValue = this._subnodes;
            assert(newValue.svType() === "SvSubnodesArray", "didUpdateSlotSubnodes: new value is not a SvSubnodesArray");
        } else {
            /*
            if (this.hasNullSubnodes()) {
                console.warn(this.svDebugId() + " hasNullSubnodes - removing nulls and continuing:", this.subnodes());
                this.subnodes().removeOccurancesOf(null);

            }
            */

            if (this.hasDuplicateSubnodes()) {
                console.warn(this.svDebugId() + " hasDuplicateSubnodes - removing duplicates and continuing");
                newValue.removeDuplicates();
            }
        }

        assert(newValue.owner() === null);
        newValue.setOwner(this);

        this.watchSubnodes();
        if (this._subnodes.contains(null)) { // what would cause this?

            console.warn(this.logPrefix(), "found null in subnodes array - removing");
            this._subnodes.filterInPlace(sn => !(sn === null));
        }

        this._subnodes.forEach(sn => sn.setParentNode(this)); // TODO: isn't this done elsewhere?

        if (isMaterialization) {
            // Materialization write-back: the assigned list IS the stored
            // list. The UI half of didChangeSubnodeList still applies (views
            // must render the loaded subnodes); nothing may reach storage,
            // because a load is not an edit (the slot setter's didMutate is
            // already skipped for an SvStoreRef → value transition, see
            // SvStorableNode.didUpdateSlot). Inlines the UI half; keep in
            // sync with didChangeSubnodeList.
            this.scheduleMethod("onDidReorderSubnodes");
            this.didUpdateNodeIfInitialized();
            return this;
        }

        this.didChangeSubnodeList(); // not handled automatically
        return this;
    }

    /**

     * @description Assert that all subnodes have a parent node.
     * @returns {SvNode} This instance.
     */
    assertSubnodesHaveParentNodes () {
        const missing = this.subnodes().detect(subnode => !subnode.parentNode());
        if (missing) {
            throw new Error("missing parent node on subnode " + missing.svType());
        }
        return this;
    }

    // --- subnode sorting ---

    /**

     * @description Set the sorting function for the subnodes.
     * @param {function} f - The sorting function. e.g. (a, b) => a.title().localeCompare(b.title())
     * @returns {SvNode} This instance.
     */
    setSubnodeSortFunc (f) {
        this.subnodes().setSortFunc(f);
        return this;
    }

    /**

     * @description Check if the subnodes are sorted.
     * @returns {boolean} True if the subnodes are sorted, false otherwise.
     */
    doesSortSubnodes () {
        return this.subnodes().doesSort();
    }

    // --- subnode indexing ---

    /**

     * @description Get the indexed subnodes of this instance.
     * @returns {Array} The indexed subnodes.
     */
    lazyIndexedSubnodes () {
        if (!this.subnodes().indexClosure()) {
            this.subnodes().setIndexClosure(sn => sn.hash());
        }
        return this.subnodes();
    }

    /**

     * @description Get the subnode with a given hash.
     * @param {string} h - The hash to search for.
     * @returns {SvNode|null} The subnode with the given hash, or null if not found.
     */
    subnodeWithHash (h) {
        return this.lazyIndexedSubnodes().itemForIndexKey(h);
    }

    /**

     * @description Remove the subnode with a given hash.
     * @param {string} h - The hash to search for.
     * @returns {SvNode} This instance.
     */
    removeSubnodeWithHash (h) {
        const subnode = this.subnodeWithHash(h);
        if (subnode) {
            this.removeSubnode(subnode);
        }
        return this;
    }

    /**

     * @description Check if this instance has a subnode with a given hash.
     * @param {string} h - The hash to search for.
     * @returns {boolean} True if the subnode exists, false otherwise.
     */
    hasSubnodeWithHash (h) {
        return this.lazyIndexedSubnodes().hasIndexKey(h);
    }

    // puuid lookup
    /**
     * @description Get the subnode with a given PUUID.
     * @param {string} puuid - The PUUID to search for.
     * @returns {SvNode|null} The subnode with the given PUUID, or null if not found.
     */
    subnodeWithPuuid (puuid) {
        return this.subnodes().detect(sn => sn.puuid() === puuid);
    }

    // visibility

    /**

     * @description Handle the node becoming visible.
     * @returns {SvNode} This instance.
     */
    nodeBecameVisible () {
        return this;
    }

    // -- view selection request events ---

    /**

     * @description Handle the request to select a decendant node.
     * @returns {boolean} False to allow propogation up the parentNode line.
     */
    onRequestSelectionOfDecendantNode () {
        return false; // allow propogation up the parentNode line
    }

    /**

     * @description Handle the request to select this node.
     * @returns {SvNode} This instance.
     */
    onRequestSelectionOfNode () {
        this.tellFirstRespondingParentNode("onRequestSelectionOfDecendantNode", this);
        return this;
    }

    /**

     * @description Handle the tap on this node.
     * @returns {SvNode} This instance.
     */
    onTapOfNode () {
        this.tellFirstRespondingParentNode("onTapOfDecendantNode", this);
        return this;
    }

    // ----

    /*
    validValuesForSlotName (slotName) {
        // if there's a method for this particular slot use it,
        // otherwise fail back on the validValues declared in the Slot

        const getterName = "validValuesForSlot" + slotName.capitalized();
        const m = this[getterName];
        if (m) {
            const validValues = m.call(this);
            if (validValues !== undefined) {
                return validValues;
            }
        }

        const slot = this.thisPrototype().slotNamed(slotName);
        assert(slot);
        return slot.validValues();
    }
    */

    /*
    moveSubnodeToNode (aSubnode, aNode) {
        this.removeSubnode(aSubnode);
        aNode.addSubnode(aSubnode);
        return this;
    }

    moveSubnodesToNode (aNode) {
        this.subnodes().shallowCopy().forEach(sn => {
            this.moveSubnodeToNode(sn, aNode);
        })
    }
    */

    /**

     * @description Collapse unbranching nodes.
     * @returns {SvNode} This instance.
     */
    collapseUnbranchingNodes () {
        this.subnodes().forEach(sn => sn.collapseUnbranchingNodes());
        this.subnodes().shallowCopy().forEach(sn => {
            const noSiblings = this.subnodes().length == 1 && sn.subnodes().length > 0;
            const oneChild = sn.subnodes().length == 1;

            const sns = sn.subnodes().shallowCopy();
            sns.forEach(node => node.removeFromParentNode());

            if (noSiblings || oneChild) {
                this.replaceSubnodeWithSubnodes(sn, sns);
            }
        });
        return this;
    }

    /**

     * @description Get the leaf subnodes of this instance.
     * @param {Array} results - The array to store the results.
     * @returns {Array} The leaf subnodes.
     */
    leafSubnodes (results = []) {
        this.subnodes().forEach(sn => sn.leafSubnodesIncludingSelf(results));
        return results;
    }

    /**

     * @description Get the leaf subnodes including this instance.
     * @param {Array} results - The array to store the results.
     * @returns {Array} The leaf subnodes including this instance.
     */

    leafSubnodesIncludingSelf (results = []) {
        if (!this.hasSubnodes()) {
            results.push(this);
        } else {
            this.subnodes().forEach(sn => sn.leafSubnodesIncludingSelf(results));
        }
        return results;
    }

    // --- options helper ---- TODO: move elsewhere

    /**

     * @description Add an option node for a dictionary.
     * @param {object} item - The dictionary containing node information.
     * @returns {SvNode} The new node.
     */
    addOptionNodeForDict (item) {
        const hasSubnodes = (item.options !== undefined) && (item.options.length > 0);
        const nodeClass = hasSubnodes ? SvFolderNode : SvOptionNode;
        const newNode = nodeClass.clone().setTitle(String(item.label));

        if (!hasSubnodes) {
            newNode.setValue(item.value !== undefined ? item.value : item.label);
            newNode.justSetIsPicked(item.isPicked === true);
            newNode.setNodeCanEditTitle(false);
        }

        if (item.subtitle) {
            newNode.setSubtitle(item.subtitle);
        }

        if (item.node) {
            newNode.setNode(item.node);
        }

        this.addSubnode(newNode);

        if (hasSubnodes) {
            newNode.addOptionNodesForArray(item.options);
        }

        return newNode;
    }

    /**

     * @description Add option nodes for an array of dictionaries.
     * @param {Array} itemDicts - The array of dictionaries.
     * @returns {SvNode} This instance.
     */
    addOptionNodesForArray (itemDicts) {
        if (itemDicts) {
            itemDicts.forEach(subitemDict => {
                this.addOptionNodeForDict(subitemDict);
            });
        }
        return this;
    }

}.initThisCategory());
