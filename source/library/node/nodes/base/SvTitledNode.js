/** * @module library.node.nodes.base
 */

/** * @class SvTitledNode
 * @extends SvNode
 * @classdesc Class for handling a node's:
 *     title
 *     subtitle
 *     summary
 *     icon/thumbnail (move to viewable?)
 *
 * SvNode -> SvTitledNode -> SvInspectableNode -> SvViewableNode -> SvStyledNode -> SvBaseNode -> StorableNode
 
 
 */

/**

 */

"use strict";

(class SvTitledNode extends SvNode {

    /**
     * @description Initializes the prototype slots for the SvTitledNode class.
     */
    initPrototypeSlots () {

        /**
         * @member {String} title
         */
        {
            const slot = this.newSlot("title", null);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("String");
            slot.setSyncsToView(true);
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
            slot.setSyncsToView(true);
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
     * @description Initializes the prototype of the SvTitledNode class.
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
     * @returns {SvTitledNode} The node at the subpath.
     */
    nodeAtSubpathString (pathString) {
        return this.nodeAtSubpathArray(pathString.split("/"));
    }

    /**
     * @description Gets the node at a given subpath array.
     * @param {Array} subpathArray - The subpath array.
     * @returns {SvTitledNode} The node at the subpath.
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
     * @returns {SvTitledNode} This node.
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
     * @returns {SvTitledNode} The first subnode with the given title.
     */
    firstSubnodeWithTitle (aString) {
        return this.subnodes().detect(subnode => subnode.title() === aString);
    }

    /**
     * @description Finds the first subnode with any of the given titles.
     * @param {Array} titlesArray - The array of titles to search for.
     * @returns {SvTitledNode} The first subnode with any of the given titles.
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
     * @returns {SvTitledNode} The first subnode with the given subtitle.
     */
    firstSubnodeWithSubtitle (aString) {
        return this.subnodes().detect(subnode => subnode.subtitle() === aString);
    }

    /**
     * @description Gets the root node.
     * @returns {SvTitledNode} The root node.
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
     * @returns {SvTitledNode} The subnode with the given title.
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
                    if (error instanceof SvMissingSlotError) {
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
     * @returns {SvTitledNode} The added subnode.
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
     * @returns {SvTitledNode} This node.
     */
    removeSubnodesWithTitle (aString) {
        this.subnodes().select(sn => sn.title() === aString).forEach(sn => sn.delete());
        return this;
    }

    /**
     * @description Removes other subnodes with the same title as the given subnode.
     * @param {SvTitledNode} aSubnode - The reference subnode.
     * @returns {SvTitledNode} This node.
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
     * @returns {SvTitledNode} The subnode with the given title.
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
     * @returns {SvTitledNode} This node.
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

    // --- ARIA accessibility overrides ---

    /**
     * @description Gets the ARIA label for this node. Returns title() by default.
     * Domain objects can override this to provide a more descriptive label for screen readers.
     * @returns {string} The ARIA label.
     */
    nodeAriaLabel () {
        return this.title();
    }

    /**
     * @description Gets the ARIA role override for this node. Returns null by default,
     * meaning the view class provides its own default role. Domain objects can override
     * this to specify a more semantically appropriate role (e.g., "listbox", "option").
     * @returns {string|null} The ARIA role, or null to use the view's default.
     */
    nodeAriaRole () {
        return null;
    }

    /**
     * @description Gets the ARIA read-only state for this node. Returns null by default,
     * meaning the view determines read-only state from slot editability.
     * Domain objects can override this to force read-only state.
     * @returns {boolean|null} True/false to override, or null to use the view's default.
     */
    nodeAriaIsReadOnly () {
        return null;
    }

    /**
     * @description Gets the ARIA required state for this node. Returns null by default,
     * meaning the view determines required state from slot metadata.
     * Domain objects can override this to force required state.
     * @returns {boolean|null} True/false to override, or null to use the view's default.
     */
    nodeAriaIsRequired () {
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

    // --- footer node ---

    /**
     * @description Sets up the "add" footer node.
     * @returns {SvTitledNode} This node.
     */
    setupAddFooterNode () {
        const firstSubnodeClass = this.subnodeClasses().first();
        if (!firstSubnodeClass) {
            return;
        }
        const typeName = firstSubnodeClass.svTypeSansPrefix();
        const f = SvActionField.clone();
        f.setTitle("New " + typeName);
        f.setCanDelete(false);
        f.setTarget(this);
        f.setMethodName("addSubnodeViaFooterNode");
        this.setFooterNode(f);
        if (this.nodeCanAddSubnode()) {
            this.setNodeCanAddSubnode(false); // to disable the click on column to add feature
            // TODO: add a slot for whether tap-to-add is enabled?
        }
    }

    addSubnodeViaFooterNode () {
        const newSubnode = this.justAdd();
        if (newSubnode) {
            this.postShouldFocusAndExpandSubnode(newSubnode);
        }
    }

}.initThisClass());
