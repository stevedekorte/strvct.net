/**
 * @module library.node.nodes.base
 * @class TitledNode
 * @extends SvNode
 * @classdesc Class for handling a node's:
 *     title
 *     subtitle
 *     summary
 *     icon/thumbnail (move to viewable?)
 * 
 * SvNode -> TitledNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode
 */

"use strict";

(class TitledNode extends SvNode {

    /**
     * @description Initializes the prototype slots for the TitledNode class.
     */
    initPrototypeSlots () {

        /**
         * @member {String} title
         */
        {
            const slot = this.newSlot("title", null);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("String");
        }

        /**
         * @member {String} subtitle
         */
        {
            const slot = this.newSlot("subtitle", null);
            slot.setAllowsNullValue(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("value");
            slot.setSlotType("String");
            slot.setInspectorPath("Node/Subtitle");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {SvNotification} note
         */
        {
            const slot = this.newSlot("note", null);
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        /**
         * @member {String} noteIconName
         */
        {
            const slot = this.newSlot("noteIconName", null);
            slot.setAllowsNullValue(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("icon");
            slot.setSlotType("String");
            slot.setValidValuesClosure((/*instance*/) => SvIconResources.shared().iconNames());
            slot.setInspectorPath("Node/Note");
        }

        /**
         * @member {Boolean} nodeCanEditTitle
         */
        {
            const slot = this.newSlot("nodeCanEditTitle", false);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} nodeCanEditSubtitle
         */
        {
            const slot = this.newSlot("nodeCanEditSubtitle", false);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("editable");
            slot.setSlotType("Boolean");
            slot.setInspectorPath("Node/Subtitle");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {Boolean} subtitleIsSubnodeCount
         */
        {
            const slot = this.newSlot("subtitleIsSubnodeCount", false);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} noteIsSubnodeCount
         */
        {
            const slot = this.newSlot("noteIsSubnodeCount", false);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype of the TitledNode class.
     */
    initPrototype () {
    }

    /**
     * @description Gets the subtitle of the node.
     * @returns {string|number} The subtitle or subnode count.
     */
    subtitle () {
        if (this.subtitleIsSubnodeCount() && this.subnodesCount()) {
            return this.subnodesCount();
        }
        
        return this._subtitle;
    }

    /**
     * @description Gets the count of subnodes.
     * @returns {number} The count of subnodes.
     */
    noteSubnodesCount () {
        return this.subnodesCount();
    }
    
    /**
     * @description Gets the note of the node.
     * @returns {string|number} The note or subnode count.
     */
    note () {
        if (this.noteIsSubnodeCount()) {
            const count = this.noteSubnodesCount();
            if (count) {
                return String(count);
            }

            return "";
        }
        
        return this._note;
    }

    /**
     * @description Gets the header title of the node.
     * @returns {string} The title of the node.
     */
    nodeHeaderTitle () {
        return this.title();
    }

    /**
     * @description Gets the path of the node.
     * @returns {Array} The path of the node.
     */
    nodePath () {
        if (this.parentNode()) {
            const parts = this.parentNode().nodePath();
            parts.push(this);
            return parts;
        }
        return [this];
    }

    /**
     * @description Gets the owner path string.
     * @returns {string} The owner path string.
     */
    ownershipPathString () {
        return this.ownershipChain().map(node => node.title()).join("/");
    }

    ownerRoot () {
        const components = this.ownerPathComponents();
        return components.first();
    }

    /**
     * @description Gets the node path array for given path components.
     * @param {Array} pathComponents - The path components.
     * @param {Array} [results=[]] - The results array.
     * @returns {Array} The node path array.
     */
    nodePathArrayForPathComponents (pathComponents, results = []) {
        results.push(this);

        const link = this.nodeTileLink();
        if (link && link !== this) {
            return link.nodePathArrayForPathComponents(pathComponents);
        }

        const pathComponent = pathComponents.first();
        if (pathComponent) {
            const nextNode = this.firstSubnodeWithTitle(pathComponent);
            if (nextNode) {
                return nextNode.nodePathArrayForPathComponents(pathComponents.rest());
            }
        }
        return results;
    }
    
    nodePathArray () {
        return this.nodePath();
    }

    /**
     * @description Gets the node path as a string.
     * @returns {string} The node path string.
     */
    nodePathString () {
        return this.nodePath().map(node => node.title()).join("/");
    }
    
    /**
     * @description Gets the node at a given subpath string.
     * @param {string} pathString - The subpath string.
     * @returns {TitledNode} The node at the subpath.
     */
    nodeAtSubpathString (pathString) {
        return this.nodeAtSubpathArray(pathString.split("/"));        
    }
    
    /**
     * @description Gets the node at a given subpath array.
     * @param {Array} subpathArray - The subpath array.
     * @returns {TitledNode} The node at the subpath.
     */
    nodeAtSubpathArray (subpathArray) {
        if (subpathArray.length) {
            const t = subpathArray.first();

            let subnode = null;
            if (Type.isArray(t)) {
                // supports a path component that is an ordered list of subnodes titles 
                subnode = this.firstSubnodeWithTitles(t);
            } else {
                subnode = this.firstSubnodeWithTitle(t);
            }

            if (subnode) {
                return subnode.nodeAtSubpathArray(subpathArray.rest());
            }
            return null;
        }        
        return this;
    }

    /**
     * @description Removes the first subnode with the given title.
     * @param {string} aString - The title to search for.
     * @returns {TitledNode} This node.
     */
    removeFirstSubnodeWithTitle (aString) {
        const sn = this.firstSubnodeWithTitle(aString);
        if (sn) {
            sn.delete();
        }
        return this;
    }

    /**
     * @description Finds the first subnode with the given title.
     * @param {string} aString - The title to search for.
     * @returns {TitledNode} The first subnode with the given title.
     */
    firstSubnodeWithTitle (aString) {
        return this.subnodes().detect(subnode => subnode.title() === aString);
    }

    /**
     * @description Finds the first subnode with any of the given titles.
     * @param {Array} titlesArray - The array of titles to search for.
     * @returns {TitledNode} The first subnode with any of the given titles.
     */
    firstSubnodeWithTitles (titlesArray) {
        for (let i = 0; i < titlesArray.length; i++) {
            const title = titlesArray[i];
            const subnode = this.firstSubnodeWithTitle(title);
            if (subnode) {
                return subnode;
            }
        }
        return null;
    }

    /**
     * @description Finds the first subnode with the given subtitle.
     * @param {string} aString - The subtitle to search for.
     * @returns {TitledNode} The first subnode with the given subtitle.
     */
    firstSubnodeWithSubtitle (aString) {
        return this.subnodes().detect(subnode => subnode.subtitle() === aString);
    }

    /**
     * @description Gets the root node.
     * @returns {TitledNode} The root node.
     */
    rootNode () {
        const store = this.defaultStore();
        const root = store.rootObject();
        return root;
    }

    /**
     * @description Gets or creates a subnode with the given title and prototype.
     * @param {string} aString - The title of the subnode.
     * @param {Object} aProto - The prototype for the subnode.
     * @returns {TitledNode} The subnode with the given title.
     */
    subnodeWithTitleIfAbsentInsertProto (aString, aProto) {
        const subnode = this.firstSubnodeWithTitle(aString);

        if (subnode) {
            if (subnode.svType() !== aProto.svType()) {
                // replace the subnode with matching title, 
                // if it's not of the requested class

                const newSubnode = aProto.clone();
                try {
                    newSubnode.copyFromAndIgnoreMissingSlots(subnode);
                } catch (error) {
                    /*
                    if (error instanceof MissingSlotError) {
                        // ?
                    } else {
                        error.rethrow();
                    }
                    */
                    error.rethrow();
                }
                this.replaceSubnodeWith(subnode, newSubnode);
                this.removeOtherSubnodesWithSameTitle(newSubnode);
                return newSubnode;
            }

            this.removeOtherSubnodesWithSameTitle(subnode);
            return subnode;
        }

        return this.subnodeWithTitleIfAbsentInsertClosure(aString, () => aProto.clone());
    }

    /**
     * @description Adds a subnode with the given name and class, and sets the corresponding slot.
     * @param {string} aName - The name of the subnode.
     * @param {Function} aClass - The class of the subnode.
     * @returns {TitledNode} The added subnode.
     */
    addSubnodeAndSetSlotForClass (aName, aClass) {
        const subnode = this.subnodeWithTitleIfAbsentInsertProto(aName, aClass);
        this.removeOtherSubnodesWithSameTitle(subnode);
        const slot = this.thisPrototype().slotNamed(aName.toLowerCase());
        assert(slot);
        if (slot) {
            slot.onInstanceSetValue(this, subnode); 
        }
        return subnode;
    }

    /**
     * @description Removes all subnodes with the given title.
     * @param {string} aString - The title of the subnodes to remove.
     * @returns {TitledNode} This node.
     */
    removeSubnodesWithTitle (aString) {
        this.subnodes().select(sn => sn.title() === aString).forEach(sn => sn.delete());
        return this;
    }

    /**
     * @description Removes other subnodes with the same title as the given subnode.
     * @param {TitledNode} aSubnode - The reference subnode.
     * @returns {TitledNode} This node.
     */
    removeOtherSubnodesWithSameTitle (aSubnode) {
        assert(this.hasSubnode(aSubnode));
        this.subnodes().shallowCopy().forEach((sn) => {
            if (sn !== aSubnode) {
                if (sn.title() === aSubnode.title()) {
                    this.removeSubnode(sn);
                }
            }
        });
        return this;
    }

    /**
     * @description Gets or creates a subnode with the given title using a closure.
     * @param {string} aString - The title of the subnode.
     * @param {Function} aClosure - The closure to create the subnode if absent.
     * @returns {TitledNode} The subnode with the given title.
     */
    subnodeWithTitleIfAbsentInsertClosure (aString, aClosure) {
        let subnode = this.firstSubnodeWithTitle(aString);

        if (!subnode && aClosure) {
            subnode = aClosure();
            subnode.setTitle(aString);
            this.addSubnode(subnode);
        }

        return subnode;
    }

    /**
     * @description Sets up sorting of subnodes by title.
     * @returns {TitledNode} This node.
     */
    makeSortSubnodesByTitle () {
        this.setSubnodeSortFunc(function (a, b) {
            const cleanedTitle = function (t) {
                return Type.isNullOrUndefined(t) ? "" : t;
            };

            let at = cleanedTitle(a.title());
            let bt = cleanedTitle(b.title());
            return at.localeCompare(bt);
        });
        return this;
    }

    /**
     * @description Determines if the node view should have a badge.
     * @returns {boolean} Whether the node view should have a badge.
     */
    nodeViewShouldBadge () {
        return false;
    }

    /**
     * @description Gets the badge title for the node view.
     * @returns {string|null} The badge title.
     */
    nodeViewBadgeTitle () {
        return null;
    }

    /**
     * @description Gets the summary of the node.
     * @returns {string} The summary of the node.
     */
    summary () {
        return this.title() + " " + this.subtitle();
    }

    recursiveFilter (aFilter) {
        const results = this.subnodes().select(aFilter);
        this.subnodes().forEach(subnode => {
            results.push(...subnode.recursiveFilter(aFilter));
        });
        return results;
    }
    
}.initThisClass());