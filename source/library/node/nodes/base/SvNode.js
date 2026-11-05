"use strict";

/** * @module library.node.nodes.base
 */

/** * @class SvNode
 * @extends ProtoClass
 * @classdesc The base class of model objects that supports the protocol
 * used to sync with views (subclasses of SvNodeView).
 * State and behavior here are focused on managing subnodes.
 * The SvStorableNode subclass is used to sync the model to
 * the persistence system.
 *
 * Notifications (intended for views):
 * - didUpdateNode // lets views know they need to scheduleSyncFromNode
 * - shouldFocusSubnode // request that the UI focus on the sender
 *
 * Update messages sent to self:
 * - didUpdateSlotParentNode(oldValue, newValue)
 * - didChangeSubnodeList // hook to resort if needed and call didReorderParentSubnodes
 * - prepareForFirstAccess // sent to self on first access to subnodes
 * - prepareToAccess // sent to sent whenever a subnode is accessed
 *
 * Update messages sent to parent:
 * - didUpdateNode // let parent know a subnode has changed
 *
 * Update messages sent to subnodes:
 * - didReorderParentSubnodes // sent on subnode order change
 *
 * Protocol helpers:
 * - watchOnceForNote(aNote) // typically used to watch for appDidInit
 */

(class SvNode extends ProtoClass {

    static initClass () {
        this.newClassSlot("additionalProperties", false);
    }

    /**
     * @static
     * @returns {boolean} Whether this class is available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return false;
    }


    /**
     * @static
     * @returns {Array} An array of all primitive node classes.
     */
    static primitiveNodeClasses () {
        const classes = SvNode.allSubclasses();
        return classes.filter(aClass => aClass.availableAsNodePrimitive());
    }

    // --- for CreatorNode Prototypes ---

    /**
     * @static
     * @returns {string} The visible class name for this node.
     */
    static visibleClassName () {
        let name = this.svType();
        name = name.sansPrefix("Sv");
        name = name.sansSuffix("Field");
        name = name.sansSuffix("Node");
        return name;
    }

    /**
     * @static
     * @returns {SvNode} A new instance of this node.
     */
    static nodeCreate () {
        // we implemnet this on SvNode class and prototype so
        // it works for both instance and class creator prototypes
        return this.clone();
    }

    /**
     * @static
     * @returns {string} The name used for node creation.
     */
    static nodeCreateName () {
        return this.visibleClassName();
    }

    // --- mime types ---

    /**
     * @static
     * @param {string} mimeTypeString - The MIME type to check.
     * @returns {boolean} Whether this class can open the given MIME type.
     */
    static canOpenMimeType (/*mimeTypeString*/) {
        return false;
    }

    /**
     * @static
     * @param {*} dataChunk - The data chunk to open.
     * @returns {*} The result of opening the data chunk.
     */
    static openMimeChunk (/*dataChunk*/) {
        return null;
    }

    // ----

    /**
     * @description Initialize the prototype slots for this class.
     * IMPORTANT: This method should NEVER call super as each class is responsible for
     * initializing only its own slots. The framework handles slot inheritance automatically.
     */
    initPrototypeSlots () {

        /*
        {
            const slot = this.newSlot("nodeType", null);
            slot.setCanInspect(true);
            slot.setLabel("type");
            slot.setInspectorPath("Node");
            slot.setSlotType("String");
            slot.setCanEditInspection(false);
        }
        */

        // parent node, subnodes

        {
            const slot = this.newSlot("parentNode", null); // parent node is set if this node is a subnode of the parent
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNode");
        }

        {
            const slot = this.newSlot("ownerNode", null); // owner node is the node that owns this node but this node is not a subnode of the owner
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNode");
            slot.setShouldStoreSlot(true); // shouldn't this be set when it's added to an owner's ivar?
        }

        {
            const slot = this.newSlot("nodeCanReorderSubnodes", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} nodeCanNavInto
         * @description Whether tapping the node's tile in a stack view should
         * push the next master-detail column. Default true. Override to false
         * on terminal nodes (fields, leaf options, message bubbles) that have
         * no meaningful child view to display — prevents an empty column from
         * sliding in on mobile or a useless drill-in on desktop.
         *
         * Inspection mode bypasses this gate: when the user explicitly inspects
         * a tile (alt-tap), the inspector column is still shown.
         * @category Navigation
         */
        {
            const slot = this.newSlot("nodeCanNavInto", true);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("subnodes", null);
            slot.setInitProto(SvSubnodesArray);
            slot.setDoesHookSetter(true);
            slot.setSlotType("SvSubnodesArray");
            //slot.setIsRequired(true);
        }

        {
            // this allows us to effectively override the subnode's Slot's shouldStore property
            // if null, it uses the subnode's Slot object's value
            const slot = this.newSlot("shouldStoreSubnodes", null);
            slot.setDuplicateOp("duplicate"); //.setShouldStore(true)
            slot.setSlotType("Boolean");
            slot.setAllowsNullValue(true);
        }

        {
            // Record Store (Plans/Record Store §6): a collection whose elements are
            // roots of their own pools — a folder of documents. Its subnodes are
            // stored as far refs { "**": poolId }; each element's records live in
            // the element's pool with the element's puuid as the pool id.
            const slot = this.newSlot("subnodesArePools", false);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
        }

        {
            // Record Store (Plans/Record Store §6): a collection whose elements are
            // records of the containing pool loaded by range, not with the pool — a
            // session's chat. The node's record holds no subnodes ref; each element's
            // row carries parentId = this node and an order key; subnodes() is what is
            // loaded, subnodeCount() what the store holds.
            const slot = this.newSlot("subnodesAreWindowed", false);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("subnodeClasses", []); //.setInitProto([]) // ui will present creator node if more than one option
            slot.setAllowsNullValue(false);
            slot.setSlotType("Array");
        }

        // notification notes

        {
            const slot = this.newSlot("didUpdateNodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotification");
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("shouldFocusSubnodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotification");
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("shouldFocusAndExpandSubnodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotification");
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(false);
        }

        // view related, but computed on node

        {
            const slot = this.newSlot("nodeVisibleClassName", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setDuplicateOp("copyValue");
        }

        {
            const slot = this.newSlot("canDelete", false);
            slot.setSlotType("Boolean");
            slot.setDuplicateOp("copyValue");
            // The getter is hand-written (see canDelete() below): it consults
            // the parent's canDeleteSubnodes policy before this slot's value.
            // The setter stays auto-generated.
            slot.setOwnsGetter(false);
        }

        {
            /**
             * Container policy over the deletability of this node's subnodes,
             * consulted by each subnode's canDelete(): false vetoes deletion,
             * true grants it, null (the default) means no opinion — the
             * subnode's own canDelete slot decides. Lets a container state
             * its policy once (e.g. a game-session party declares its member
             * characters undeletable) instead of every member class knowing
             * about every container it can live in. Single-level by design —
             * it does not cascade to deeper descendants.
             */
            const slot = this.newSlot("canDeleteSubnodes", null);
            slot.setSlotType("Boolean");
            slot.setAllowsNullValue(true);
            slot.setDuplicateOp("copyValue");
        }

        {
            const slot = this.newSlot("nodeCanAddSubnode", false);
            slot.setSlotType("Boolean");
            slot.setDuplicateOp("copyValue");
        }

        /**
         * @member {Boolean|null} subtreeIsUserEditable - Cascading tri-state
         * editability policy (see docs/Plans/Editability Cascade). null = no
         * opinion (the parent chain decides); true/false = decide for this
         * node's own fields AND its whole subtree (deeper nodes may
         * re-override). Consult via effectiveUserEditability(), never read
         * directly — the value is one link in a chain. Not stored: context
         * (a session copy, a catalog for a non-editor) is re-established by
         * whoever builds the tree.
         * @category Editability
         */
        {
            const slot = this.newSlot("subtreeIsUserEditable", null);
            slot.setSlotType("Boolean");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("isVisible", true);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
            slot.setDoesHookSetter(true); // see didUpdateSlotIsVisible
        }


        {
            const slot = this.newSlot("headerNode", null);
            slot.setSyncsToView(true);
            slot.setSlotType("SvNode");
        }

        {
            /**
             * @member {SvNode} footerNode - The footer node placed at the bottom of the subnodes view.
             * @category UI
             */
            const slot = this.newSlot("footerNode", null);
            slot.setSyncsToView(true);
            slot.setSlotType("SvNode");
        }


        {
            const slot = this.newSlot("didPrepareForFirstAccess", false);
            slot.setSlotType("Boolean");
        }
    }

    /**

     * @description Initialize the prototype for this class.
     * IMPORTANT: This method should NEVER call super as each class is responsible for
     * initializing only its own prototype. The framework handles prototype inheritance automatically.
     */
    initPrototype () {

    }

    /**

     * @description Initialize this instance.
     * @returns {SvNode} This instance.
     */
    init () {
        super.init();
        this.setDidUpdateNodeNote(this.newNoteNamed("onUpdatedNode"));
        this.setShouldFocusSubnodeNote(this.newNoteNamed("shouldFocusSubnode"));
        this.setShouldFocusAndExpandSubnodeNote(this.newNoteNamed("shouldFocusAndExpandSubnode"));
        this.watchSubnodes();

        this.setSubnodeClasses(this.thisPrototype().subnodeClasses().shallowCopy());
        return this;
    }

    ownerOrParentNode () {
        if (this.ownerNode()) {
            return this.ownerNode();
        }
        return this.parentNode();
    }

    /**
     * @description Get the ownership chain for this instance, following ownerNode and parentNode links .
     * @param {Array} chain - The chain to populate.
     * @returns {Array} The ownership chain.
     */
    ownershipChain (chain = []) {
        const ownerOrParent = this.ownerOrParentNode();
        if (ownerOrParent) {
            chain.push(ownerOrParent);
            ownerOrParent.ownershipChain(chain);
        }
        return chain;
    }

    ownershipChainPathString () {
        const chain = this.ownershipChain();
        chain.reverse();
        return chain.map(node => node.title()).join("/");
    }

    subnodeIndex () {
        if (this.parentNode()) {
            return this.parentNode().indexOfSubnode(this);
        }
        return -1;
    }

    /**

     * @description Set the subnodes for this instance.
     * @param {Array} subnodes - The new subnodes.
     * @returns {SvNode} This instance.
     */
    setSubnodes (subnodes) {
        if (this.slotIsPendingMaterialization("subnodes")) {
            this.subnodes(); // materialize the stored array so copyFrom merges into it
        }
        if (this._subnodes === null) {
            if (typeof SvTransactionContext !== "undefined") {
                SvTransactionContext.snapshotObjectIfNeeded(this);
            }
            this._subnodes = subnodes;
        } else {
            this._subnodes.copyFrom(subnodes);
        }
        return this;
    }

    /**
     * @description See registerForAppDidInit().
     */
    appDidInit () {
        // for subclasses to override
    }

    /**

     * @description Register this instance to receive the appDidInit notification.
     */
    registerForAppDidInit () {
        // need this in case app has already done init,
        // or if appDidInit notification itself inited objects
        // who register for appDidInit
        // TODO: generalize this for all notifications somehow
        // maybe register for note with object directly
        assert(! (this instanceof SvApp), "registerForAppDidInit should not be called on SvApp");

        if (SvApp.hasShared() && SvApp.shared().hasDoneAppInit()) {
            this.appDidInit(); // may be async
        } else {
            this.watchOnceForNote("appDidInit");
        }
    }

    /**

     * @description Determine whether to store subnodes when persisting this instance.
     * @returns {boolean} Whether to store subnodes.
     */
    shouldStoreSlotSubnodes () {
        // called by subnodes slot when persisting instance
        return this.shouldStoreSubnodes();
    }

    /**

     * @description Get the node type.
     * @returns {string} The node type.
     */
    nodeType () {
        return this.svType();
    }

    /*
    prepareToRetire () {
        super.prepareToRetire() // will remove notification observations
        this._subnodes.removeMutationObserver(this)
    }
    */

    /**

     * @description Create a new instance of this node.
     * @returns {SvNode} A new instance of this node.
     */
    nodeCreate () {
        // we implemnet this on SvNode class and prototype so
        // it works for both instance and class creator prototypes
        return this.duplicate();
    }

    /**

     * @description Get the name used for node creation.
     * @returns {string} The name used for node creation.
     */
    nodeCreateName () {
        return this.title();
    }

    /**

     * @description Create a duplicate of this instance.
     * @returns {SvNode} A duplicate of this instance.
     */
    duplicate (refs = new Set()) {
        assert(!refs.has(this), "duplicate: recursive reference detected");
        refs.add(this);
        const dup = super.duplicate();
        if (!this.shouldStore() || this.shouldStoreSubnodes()) {
            dup.copySubnodes(this.subnodes().map(sn => {
                const item = sn.duplicate(refs);
                return item;
            }));
        }
        return dup;
    }

    /**

     * @description Get the persistent unique identifier (puuid) for this instance.
     * @returns {string} The puuid.
     */
    pid () { // TODO: unify with puuid?
        return this.puuid();
    }

    // -----------------------

    /**

     * @description Get the visible class name for this node.
     * @returns {string} The visible class name.
     */
    nodeVisibleClassName () {
        if (this._nodeVisibleClassName) {
            return this._nodeVisibleClassName;
        }

        return this.svType().sansPrefix("Sv");
    }

    // --- subnodes ----------------------------------------

    /**

     * @description Set the parent node for this instance.
     * @param {SvNode} aNode - The new parent node.
     * @returns {SvNode} This instance.
     */
    /**
     * @description Walks a path of subnode titles, awaiting at steps that load
     * on demand: a document placeholder hydrating (asyncEnsureLoaded), later a
     * far pool opening or a window loading (Plans/Record Store §6). Everything
     * already loaded is walked synchronously.
     * @param {Array<String>} segments - subnode titles from this node down
     * @returns {Promise<SvNode|null>}
     * @category Record Store
     */
    async asyncNodeAtPath (segments) {
        let node = this;
        for (const segment of segments) {
            const next = await node.asyncSubnodeWithTitle(segment);
            if (!next) {
                return null;
            }
            node = next;
        }
        return node;
    }

    async asyncSubnodeWithTitle (title) {
        if (this.prepareToAccess) {
            this.prepareToAccess();
        }
        const child = this.firstSubnodeWithTitle(title);
        if (child && typeof child.asyncEnsureLoaded === "function") {
            await child.asyncEnsureLoaded();
        }
        return child || null;
    }

    setParentNode (aNode) {
        assert(aNode !== this); // sanity check

        if (aNode !== this._parentNode) {
            if (this._parentNode && aNode) {
                console.warn(this.svDebugId() + " setParentNode(" + aNode.svDebugId() + ")  already has parent " + this._parentNode.svDebugId());
                console.warn("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            }

            const oldNode = this._parentNode;
            if (typeof SvTransactionContext !== "undefined") {
                SvTransactionContext.snapshotObjectIfNeeded(this); // parentNode is assigned directly, not through the setter
            }
            this._parentNode = aNode;
            this.didUpdateSlotParentNode(oldNode, aNode);

            // Orphan detection. A node going parented -> null is EITHER a
            // transient detach during a reparent (re-added the same event loop,
            // e.g. drag-drop's removeFromParentNode + setSubnodes, or a
            // replaceSubnodeWith) OR a genuine orphan (left dangling while a
            // bound view / in-flight async loop still references it — the
            // stale-orphan bug class). Defer a check to the end of the event
            // loop; if it's still parentless then, the reparent didn't happen
            // and it's an orphan. The root is born null and never transitions
            // here, so it never schedules.
            if (aNode === null && oldNode !== null) {
                this.scheduleMethod("checkForOrphan");
            }
        }
        return this;
    }

    // --------

    /**

     * @description Check if this instance is equal to another instance.
     * @param {SvNode} aNode - The instance to compare.
     * @returns {boolean} Whether this instance is equal to the other instance.
     */
    isEqual (aNode) {
        //return this.puuid() === aNode.puuid();
        return this === aNode;
    }

    // --- log ------------------------

    /**
     * @description Get the prefix for logging messages.
     * @returns {string} The prefix for logging messages.
     */
    logPrefix () {
        return "[" +  this.nodePathString() + "]";
    }

    /**
     * @description Whether the user may delete this node. The parent
     * container's canDeleteSubnodes policy is consulted first — false vetoes,
     * true grants — and when the container has no opinion (null, the default)
     * this node's own canDelete slot value answers. Hand-written getter (the
     * canDelete slot sets ownsGetter false) so deletability policy can live
     * with the container that owns the list.
     * @returns {Boolean}
     * @category Deletion
     */
    canDelete () {
        const parent = this.parentNode();
        if (parent && typeof parent.canDeleteSubnodes === "function") {
            const policy = parent.canDeleteSubnodes();
            if (policy !== null && policy !== undefined) {
                return policy;
            }
        }
        return this._canDelete;
    }

    /**

     * @description Get the debug type ID of this instance.
     * @returns {string} The debug type ID.
     */
    svDebugId () {
        // Debug descriptions get built mid-sync, when a node's slots can be
        // transiently inconsistent (e.g. a cloud projection merge applies
        // slots one at a time) — a title() that throws there would detonate
        // the sync/debug machinery, so fall back to the type id instead.
        try {
            return this.svTypeId() + " '" + this.title() + "'";
        } catch (e) {
            return this.svTypeId() + " (title error: " + e.message + ")";
        }
    }

    /**

     * @description Get the root JSON schema for this instance.
     * @param {boolean} definitionsOnly - Whether to include only the definitions.
     * @returns {object} The root JSON schema.
     */
    static asRootJsonSchema (definitionsOnly = false) {
        // NOTE: this uses a format of all definitions at the top level

        const refSet = new Set();
        /*
        // useful for debugging classes put in the refSet
        refSet._add = refSet.add;
        refSet.add = function (aClass) {
            if (!aClass.jsonSchemaDescription || aClass.jsonSchemaDescription() === null) {
            }
            if (!this.has(aClass)) {
                this._add(aClass);
                console.log(this.logPrefix(), "refSet.add(" + aClass.svType() + ") size ", this.size);
            }
        }
        */

        const json = {
            "$id": this.svType(),
            "$schema": "http://json-schema.org/draft-07/schema#"
        };

        if (definitionsOnly) {
            this.asJsonSchema(refSet); // we only do this to set the refSet to include all classes with this object references
            assert(this.asJsonSchema); // sanity check - we'll need this
            refSet.add(this); // now we add ourselve and we're ready to just share all the definitions
        } else {
            Object.assign(json, this.asJsonSchema(refSet)); // so schema is at top of dict
            refSet.delete(this); // don't include ourself in the definitions, as we're the root schema
        }

        if (refSet.size) {
            json.definitions = this.jsonSchemaDefinitionsForRefSet(refSet);
            //console.log(this.logPrefix(), "Object.keys(json.definitions).length = ", Object.keys(json.definitions).length);
        }

        return json;
    }

    /**

     * @description Get the JSON schema for this instance.
     * @param {Set} refSet - The reference set.
     * @returns {object} The JSON schema.
     */
    static asJsonSchema (refSet) {
        assert(refSet);
        const schema = {
            type: "object",
            description: this.jsonSchemaDescription(),
            properties: this.jsonSchemaProperties(refSet),
            required: this.jsonSchemaRequired(),
            additionalProperties: this.additionalProperties()
        };

        if (this.jsonSchemaIsReadOnly()) {
            schema.readOnly = true;
        }

        const title = this.jsonSchemaTitle();
        if (title != this.svType()) {
            schema.title = title;
        }

        assert(schema.description, "missing json schema description for " + this.svType());
        return schema;
    }

    // ---- shutdown ----

    /**

     * @description Shutdown the node.
     * @param {Set} visited - The visited set.
     * @returns {SvNode} This instance.
     */
    nodeShutdown (visited = new Set()) {
        // need to check for loops
        if (visited.has(this)) {
            return;
        }
        visited.add(this);

        this.performIfResponding("shutdown", visited);
        this.ownedSlotValues().forEach(sv => {
            console.log(this.logPrefix(), " sending: " + sv.svType() + ".nodeShutdown()");
            sv.performIfResponding("nodeShutdown", visited);
        });
        this.subnodes().forEach(sn => {
            console.log(this.logPrefix(), " sending: " + sn.svType() + ".nodeShutdown()");
            sn.performIfResponding("nodeShutdown", visited);
        });
    }

    /**

       * @description Get the slots whose values are owned by this instance.
       * @returns {Array} The slots whose values are owned by this instance.
       */
    slotsWhoseValuesAreOwned () {
        return this.thisPrototype().slotsMap().valuesArray().filter(slot => slot.ownsValue());
    }

    /**

       * @description Get the owned slot values.
       * @returns {Array} The owned slot values.
       */

    ownedSlotValues () {
        return this.slotsWhoseValuesAreOwned().map(slot => slot.onInstanceGetValue(this));
    }

    /*
      recursivelySendToOwnedNodes (methodName) {
        // for things like shutdown methods, we want to send them to all owned nodes
        // both to subnodes and slot values owned by each node

        // note: we probably want to send these from the bottom up
        this.subnodes().forEach(sn => {
          this.sendMessageToOwnedSlotValues(methodName);
          sn.performIfResponding(methodName);
        });
        this.performIfResponding(methodName);
      }
      */

    /**
     * @description Optional protocol: the node that roots this node's companion
     * panel — a persistent panel shown alongside (or, in vertical orientations,
     * beneath) this node's navigation content while it is selected. Read by
     * SvDetailView (same idiom as headerNode()/footerNode() in SvNavView).
     * A method rather than a stored slot because implementors typically compute
     * the value (e.g. walk to an owner and return one of its nodes).
     * @returns {SvNode|null} The companion root node, or null for no companion.
     * @category UI
     */
    nodeCompanionNode () {
        return null;
    }

    hasHeaderOrFooter () {
        return this.footerNode() !== null || this.headerNode() !== null;
    }

    canNavTo () {
        if (!this.nodeCanNavInto()) {
            return false;
        }
        return this.hasSubnodes() || this.hasHeaderOrFooter() || this.nodeCanAddSubnode()
            || Boolean(this.nodeViewClassName && this.nodeViewClassName())
            || Boolean(this.nodeCompanionNode());
    }

}.initThisClass());
