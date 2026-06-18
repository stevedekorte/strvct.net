/** * @module library.node.nodes
 */

/** * @class SvLinkNode
 * @extends SvSummaryNode
 * @classdesc A node that represents a link to another node, which is not a subnode
 */

"use strict";

(class SvLinkNode extends SvSummaryNode {

    /**
     * @static
     * @description Indicates if this node is available as a primitive
     * @returns {boolean} True if available as a node primitive
     * @category Utility
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the SvLinkNode
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {SvNode} linkedNode
         * @description The node that this link points to
         * @category Link Management
         */
        {
            const slot = this.newSlot("linkedNode", null);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("SvNode");
            slot.setSyncsToView(true);
        }

        /**
         * @member {String} linkLabel
         * @description An explicit display label for the link, independent of the
         * linked node's own title. When set (non-empty), title() returns it; this
         * lets a link present a fixed label (e.g. a "Character" tab) while still
         * navigating into its target. Null by default (fall back to the linked
         * node's title). Note: the inherited `title` slot can't be used for this —
         * it carries a placeholder value on link instances.
         * @category Link Management
         */
        {
            const slot = this.newSlot("linkLabel", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} willDuplicateLinkedObject
         * @description Indicates if the linked object should be duplicated when this node is duplicated
         * @category Link Management
         */
        {
            const slot = this.newSlot("willDuplicateLinkedObject", false);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("Will duplicate linked object");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {string} unlinkedTitle
         * @description Title shown when no node is linked. Overridable per instance
         * so callers can display something meaningful (e.g. "My Sessions")
         * before the target node finishes loading.
         * @category Placeholders
         */
        {
            const slot = this.newSlot("unlinkedTitle", "Unlinked");
            slot.setSlotType("String");
        }

        /**
         * @member {string} unlinkedSubtitle
         * @description Subtitle shown when no node is linked. Defaults to a
         * drop-to-link affordance; override to show a loading state.
         * @category Placeholders
         */
        {
            const slot = this.newSlot("unlinkedSubtitle", "drop tile to link");
            slot.setSlotType("String");
        }

        /**
         * @member {boolean} nodeAcceptsDrop
         * @description Whether this node accepts a dropped tile as a link target.
         * Default true — matches the prior method behavior. Set to false on
         * link nodes whose target is wired up programmatically and should not
         * be re-linked by user drag-and-drop.
         * @category Drop Handling
         */
        {
            const slot = this.newSlot("nodeAcceptsDrop", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype of the SvLinkNode
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
        this.setNodeCanInspect(true);
        this.setNodeCanEditTitle(true);

        this.setCanDelete(true);
        this.setNodeCanInspect(true);
    }

    /*
    didUpdateSlotLinkedNode (oldValue, newValue) {
        assert(Type.isNull(newValue) || Type.isObject(newValue));

        if (Type.isObject(newValue)) {
            const isNode = newValue.thisClass().isKindOf(SvNode);
            assert(isNode);
        }
        return this;
    }
    */

    /**
     * @description Handles the event when a node is dropped onto this node
     * @param {SvNode} aNode - The node that was dropped
     * @category Drop Handling
     */
    nodeDropped (aNode) {
        this.setLinkedNode(aNode);
    }

    /**
     * @description Creates a duplicate of this node
     * @returns {SvLinkNode} The duplicated node
     * @category Node Operations
     */
    duplicate (refs = new Set()) {
        assert(!refs.has(this), "duplicate: recursive reference detected");
        refs.add(this);
        const dup = super.duplicate(refs);
        if (this.willDuplicateLinkedObject()) {
            const ln = this.linkedNode();
            if (ln) {
                dup.setLinkedNode(ln.duplicate(refs));
            }
        }
        return dup;
    }

    /**
     * @description Gets the title of the node. An explicitly-set own title wins
     * (so a link can present a fixed label, e.g. a "Character" tab pointing at a
     * specific character); otherwise it falls back to the linked node's title,
     * then the unlinkedTitle when nothing is linked.
     * @returns {string} The display title.
     * @category Node Information
     */
    title () {
        const label = this.linkLabel();
        if (typeof label === "string" && label.length > 0) {
            return label; // an explicit link label wins (e.g. a "Character" tab)
        }
        const ln = this.linkedNode();
        if (ln) {
            return ln.title();
        }
        return this.unlinkedTitle();
    }

    /*
    setTitle (s) {
        const ln = this.linkedNode()
        if (ln) {
            return ln.setTitle(s)
        }
        return this
    }
    */

    /**
     * @description Gets the subtitle of the node
     * @returns {string} The subtitle of the linked node or a default message if no node is linked
     * @category Node Information
     */
    async asyncNodeThumbnailUrl () {
        const ln = this.linkedNode();
        if (ln && ln.asyncNodeThumbnailUrl) {
            return await ln.asyncNodeThumbnailUrl();
        }
        return null;
    }

    subtitle () {
        const ln = this.linkedNode();
        if (ln) {
            return ln.subtitle();
        }
        return this.unlinkedSubtitle();
    }

    /*
    title () {
        if (Type.isNull(super.title()) && this.linkedNode()) {
            return this.linkedNode().title()
        }

        return super.title()
    }
    */

    /**
     * @description Gets the accepted subnode types for this node
     * @returns {Array} An empty array as this node doesn't accept subnodes
     * @category Node Structure
     */
    acceptedSubnodeTypes () {
        // TODO: have browser use nodeTileLink for this protocol?
        return [];
    }

    /**
     * @description Gets the note of the linked node
     * @returns {string|null} The note of the linked node or null if no node is linked
     * @category Node Information
     */
    note () {
        if (this.linkedNode()) {
            return this.linkedNode().note();
        }

        return null;
    }

    /**
     * @description Gets the note icon name
     * @returns {string|null} The note icon name (currently always null)
     * @category Node Information
     */
    noteIconName () {
        //return this.nodeTileLink() ? "double right caret" : null
        return null;
    }

    /**
     * @description Gets the linked node
     * @returns {SvNode|null} The linked node
     * @category Link Management
     */
    nodeTileLink () {
        return this.linkedNode();
    }

    /**
     * @description Checks if the linked node can reorder subnodes
     * @returns {boolean} True if the linked node can reorder subnodes, false otherwise
     * @category Node Structure
     */
    nodeCanReorderSubnodes () {
        const ln = this.linkedNode();
        return ln ? ln.nodeCanReorderSubnodes() : false; // have this operation done in the browser?
    }

    /**
     * @description Adds a subnode at a specific index
     * @param {SvNode} aSubnode - The subnode to add
     * @param {number} anIndex - The index at which to add the subnode
     * @returns {SvLinkNode} This node instance
     * @category Node Structure
     */
    addSubnodeAt (aSubnode, anIndex) {
        return super.addSubnodeAt(aSubnode, anIndex);
    }

}.initThisClass());
