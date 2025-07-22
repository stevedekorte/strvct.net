"use strict";

/**
 * @module library.node.nodes.base
 * @class SvNode
 * @extends ProtoClass
 * @classdesc The base class of model objects that supports the protocol 
 * used to sync with views (subclasses of NodeView).
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
        let name = this.type();
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
        }

        {
            const slot = this.newSlot("nodeCanReorderSubnodes", false);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("subnodes", null);
            slot.setInitProto(SubnodesArray);
            slot.setDoesHookSetter(true);
            slot.setSlotType("SubnodesArray");
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
            const slot = this.newSlot("subnodeClasses", []); //.setInitProto([]) // ui will present creator node if more than one option
            slot.setAllowsNullValue(false);
            slot.setSlotType("Array");
        }

        // notification notes

        {
            const slot = this.newSlot("didUpdateNodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotification");
        }

        {
            const slot = this.newSlot("shouldFocusSubnodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotification");
        }

        {
            const slot = this.newSlot("shouldFocusAndExpandSubnodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotification");
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
        }

        {
            const slot = this.newSlot("nodeCanAddSubnode", false);
            slot.setSlotType("Boolean");
            slot.setDuplicateOp("copyValue");
        }

        {
            const slot = this.newSlot("isVisible", true);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        {
            /**
             * @member {SvNode} footerNode - The footer node placed at the bottom of the subnodes view.
             * @category UI
             */
            const slot = this.newSlot("footerNode", null);
            slot.setSlotType("SvNode");
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
        return this
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
        return chain.map(node => node.title()).join("/");
    }

    /**

     * @description Set the subnodes for this instance.
     * @param {Array} subnodes - The new subnodes.
     * @returns {SvNode} This instance.
     */
    setSubnodes (subnodes) {
        if (this._subnodes === null) {
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
        return this.type();
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
    duplicate () {
        const dup = super.duplicate();
        if (!this.shouldStore() || this.shouldStoreSubnodes()) {
            dup.copySubnodes(this.subnodes().map(sn => sn.duplicate()));
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
		
        return this.type().sansPrefix("Sv");
    }

    // --- subnodes ----------------------------------------
    
    /**

     * @description Set the parent node for this instance.
     * @param {SvNode} aNode - The new parent node.
     * @returns {SvNode} This instance.
     */
    setParentNode (aNode) {
        assert(aNode !== this); // sanity check

        if (aNode !== this._parentNode) { 
            if (this._parentNode && aNode) {
                console.warn(this.debugTypeId() + " setParentNode(" + aNode.debugTypeId() + ")  already has parent " + this._parentNode.debugTypeId());
                console.warn("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            }
            
            const oldNode = this._parentNode;
            this._parentNode = aNode;
            this.didUpdateSlotParentNode(oldNode, aNode);
        }
        return this;
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
        return this._subnodes.length;
    }

    firstVisibleSubnode () {
        return this.subnodes().detect(sn => sn.isVisible());
    }

    /**

     * @description Check if this instance has any subnodes.
     * @returns {boolean} Whether this instance has subnodes.
     */
    hasSubnodes () {
        return this.subnodeCount() > 0;
    }

    /**

     * @description Add a subnode to this instance without any checks.
     * @param {SvNode} aSubnode - The subnode to add.
     * @returns {SvNode} The added subnode.
     */
    justAddSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode));
        return this.justAddSubnodeAt(aSubnode, this.subnodeCount());
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
        this.subnodes().atInsert(anIndex, aSubnode);
        aSubnode.setParentNode(this);
        return aSubnode;
    }
    
    /**

     * @description Assert that a given subnode is a valid type.
     * @param {SvNode} aSubnode - The subnode to check.
     */
    assertValidSubnodeType (aSubnode) {
        assert(aSubnode.thisClass().isKindOf(SvNode), "Attempt to add subnode of type '" + aSubnode.type() + "' which does not inherit from SvNode (as subnodes are required to do)");
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
        })
        return this;
    }

    /**

     * @description Move multiple subnodes to a specific index.
     * @param {Array} movedSubnodes - The subnodes to move.
     * @param {number} anIndex - The index to which to move the subnodes.
     * @returns {SvNode} This instance.
     */
    moveSubnodesToIndex (movedSubnodes, anIndex) {
        this.subnodes().moveItemsToIndex(movedSubnodes, anIndex)
        return this
    }

    /**

     * @description Add a subnode to this instance.
     * @param {SvNode} aSubnode - The subnode to add.
     * @returns {SvNode} The added subnode.
     */
    addSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode));
        return this.addSubnodeAt(aSubnode, this.subnodeCount());
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

     * @description Get the accepted subnode types.
     * @returns {Array} An array of accepted subnode types.
     */
    acceptedSubnodeTypes () {
        const types = [];
        this.subnodeClasses().forEach(c => types.push(c.type()));
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
        //const type = aSunode.type();
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
        })
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
        })
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
        this.subnodes().setIndexClosure( v => v.hash());
        return this
    }

    cleanSubnodes () {
        const subnodes = this.subnodes();
        for (let index = subnodes.length - 1; index > -1; index--) {
            const sn = subnodes.at(index);
            if (Type.isNullOrUndefined(sn)) {
                debugger;
                const beforeCount = subnodes.length;
                subnodes.removeAt(index); // raw removal
                const afterCount = subnodes.length;
                if (beforeCount === afterCount) {
                    debugger;
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
                debugger;
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
        if (this.subnodeCount()) {
            this.subnodes().slice().forEach((subnode) => {
                this.justRemoveSubnode(subnode);
            })
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
        }
        return this;
    }

    /**

     * @description Copy subnodes from another instance.
     * @param {Array} newSubnodes - The new subnodes.
     * @returns {SvNode} This instance.
     */
    copySubnodes (newSubnodes) {
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
        assert(aSubnode);
        assert(this.hasSubnode(aSubnode));
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
        assert(this.hasSubnode(aSubnode));
        const subnodes = this.subnodes().shallowCopy();
        subnodes.remove(aSubnode);
        subnodes.push(aSubnode);
        this.nodeReorderSudnodesTo(subnodes);
        return this;
    }
    
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

     * @description Trigger the didUpdateNode notification.
     * @returns {boolean} Whether the notification was posted.
     */
    didUpdateNode () {
        if (!this.hasDoneInit()) {
            return false;
        }

        const note = this.didUpdateNodeNote();

        if (note) {
            if (this.type() === "UoLocations") {
                if (!SvNotificationCenter.shared().hasNotification(note)) {
                    console.log(this.typeId() + " '" + this.title() + "' POST didUpdateNode - subnodesCount: " + this.subnodesCount());
                    //debugger;
                }
            }
            note.post();
        }
        
        // TODO: make this more efficient, as we don't always need it
        
        if (this.parentNode()) {
            assert(this.parentNode() !== this);
            this.parentNode().didUpdateNodeIfInitialized();
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
        if (!this._didPrepareForFirstAccess) {
            this._didPrepareForFirstAccess = true;
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
    
    // --- parent chain notifications ---
    
    /**

     * @description Send a message to this instance's parent nodes.
     * @param {string} msg - The message to send.
     * @param {*} aNode - The node associated with the message.
     */
    tellParentNodes (msg, aNode) {
        const f = this[msg];
        if (f && f.apply(this, [aNode])) {
            return;
        }

        const p = this.parentNode();
        if (p) {
            p.tellParentNodes(msg, aNode);
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
    
    // --- log ------------------------
    
    /**

     * @description Log a message if this instance is in debug mode.
     * @param {string} msg - The message to log.
     */
    log (msg) {
        //const s = this.nodePathString() + " --  " + msg
        if (this.isDebugging()) {
            console.log("[" +  this.nodePathString() + "] " + msg);
        }
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
        //debugger
        assert(aSubnode);
        this.shouldFocusAndExpandSubnodeNote().setInfo(aSubnode).post();
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
            newSubnode = classes.first().clone();
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
        return this.justAddAt(this.subnodeCount());
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
        return this.addAt(this.subnodeCount());
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
        this.removeFromParentNode();
        return this;
    }

    // --- utility -----------------------------
    
    /**

     * @description Get the first parent node of a given class.
     * @param {string} className - The class name to search for.
     * @returns {SvNode|null} The first parent node of the given class, or null if not found.
     */
    parentNodeOfType (className) {
        if (this.type() === className) {
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
        return this.parentNodes().map(node => node.type());
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
        return this.subnodes().detect(subnode => subnode.type() === obj.type());
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
        })
        return this;
    }
    
    // --- subnodes -----------------------------
    /**

     * @description Get the number of subnodes of this instance.
     * @returns {number} The number of subnodes.
     */
    subnodesCount () {
        return this.subnodes().length;
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
        return this
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
        if (oldValue) {
            oldValue.removeMutationObserver(this);
        }

        if (Type.isNullOrUndefined(newValue)) {
            console.warn("attempt to set subnodes array to null or undefined - possible corruption of object pool storage <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            //debugger;
            newValue = [];
        }

        if (newValue.type() !== "SubnodesArray") {
            //debugger;
            this._subnodes = SubnodesArray.from(newValue);
            newValue.removeDuplicates();
            newValue = this._subnodes;
            assert(newValue.type() === "SubnodesArray");
        } else {
            /*
            if (this.hasNullSubnodes()) {
                console.warn(this.debugTypeId() + " hasNullSubnodes - removing nulls and continuing:", this.subnodes());
                this.subnodes().removeOccurancesOf(null);
                //debugger;
            }
            */

            if(this.hasDuplicateSubnodes()) {
                console.warn(this.debugTypeId() + " hasDuplicateSubnodes - removing duplicates and continuing");
                debugger;
                newValue.removeDuplicates();
            }
        }

        assert(newValue.owner() === null);
        newValue.setOwner(this);

        this.watchSubnodes();
        if (this._subnodes.contains(null)) { // what would cause this?
            //debugger;
            console.warn("found null in subnodes array - removing");
            this._subnodes.filterInPlace(sn => !(sn === null) );
        }
        
        this._subnodes.forEach(sn => sn.setParentNode(this)); // TODO: isn't this done elsewhere?
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
            throw new Error("missing parent node on subnode " + missing.type());
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
            this.subnodes().setIndexClosure( sn => sn.hash() );
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
        this.tellParentNodes("onRequestSelectionOfDecendantNode", this);
        return this;
    }

    /** 

     * @description Handle the tap on this node.
     * @returns {SvNode} This instance.
     */
    onTapOfNode () {
        this.tellParentNodes("onTapOfDecendantNode", this);
        return this;
    }

    /**

     * @description Get the debug type ID of this instance.
     * @returns {string} The debug type ID.
     */
    debugTypeId () {
        return this.typeId() + " '" + this.title() + "'";
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
        })
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
            })
        }
        return this;
    }

    // --- jsonArchive ---

    /**

     * @description Set the JSON archive for this instance.
     * @param {object} json - The JSON object to set.
     * @returns {SvNode} This instance.
     */
    setJsonArchive (json) {
        // NOTE: use slot.setShouldJsonArchive(true) to set a slot to be json archived
        
        //console.log(this.typeId() + ".setJsonArchive(" + JSON.stableStringifyWithStdOptions(json, null, 2) + ")");

        //const keys = Object.keys(json).select(key => key !== "type");
        const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true);
        //assert(keys.length === jsonArchiveSlots.length); // or should we assume a diff if missing?
        
        jsonArchiveSlots.forEach(slot => {
            const k = slot.getterName();
            const v = json[k];
            if (Object.hasOwn(json, k)) {
                slot.onInstanceSetValue(this, v);
            } else {
                console.warn("no dict key '" + k + "' for archive slot " + k);
            }
        });

        /*
        keys.forEach(key => {
            if (key !== "type") {
            const slot = this.thisPrototype().slotNamed(key);
            assert(slot);
            const value = json[key];
            slot.onInstanceSetValue(this, value);
            }
        })
        */

        return this
    }


    /**

     * @description Get the JSON archive for this instance.
     * @returns {object} The JSON archive.
     */
    jsonArchive () {
        const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true);
        const dict = {
            type: this.type()
        };

        jsonArchiveSlots.forEach(slot => {
            const k = slot.getterName();
            const v = slot.onInstanceGetValue(this);
            dict[k] = v;
        });

        //console.log(this.typeId() + ".jsonArchive() = " + JSON.stableStringifyWithStdOptions(dict, null, 2));

        return dict;
    }
    
    /**

     * @description Create an instance from a JSON archive.
     * @param {object} json - The JSON object to create the instance from.
     * @returns {SvNode} The new instance.
     */
    static fromJsonArchive (json) {
        const className = json.type;
        assert(className); // sanity check
        
        const aClass = SvGlobals.globals()[className];
        assert(aClass.isKindOf(this)); // sanity check

        const instance = aClass.clone().setJsonArchive(json);
        return instance;
    }

    // --- JSON schema properties ---

    /**

     * @description Get the JSON schema string for this instance.
     * @returns {string} The JSON schema string.
     */
    static jsonSchemaString () {
        const schema = this.asRootJsonSchema();
        const s = JSON.stableStringifyWithStdOptions(schema, null, 2);
        return s;
    }

    /*
     * @description Get the tagged JSON schema string for this instance inside a <json-schema> tag.
     * @returns {string} The tagged JSON schema string.
     */
    static taggedJsonSchemaString () {
        return "<json-schema>\n" + this.jsonSchemaString() + "\n</json-schema>";
    }

    /**

     * @description Get the JSON schema title for this instance.
     * @returns {string} The JSON schema title.
     */
    static jsonSchemaTitle () {
        return this.type();
    }

    /**

     * @description Get the JSON schema slots for this instance.
     * @returns {Array} The JSON schema slots.
     */
    static jsonSchemaSlots () {
        const jsonArchiveSlots = this.prototype.slotsWithAnnotation("isInJsonSchema", true);
        return jsonArchiveSlots;
    }

    /**

     * @description Get the JSON schema properties for this instance.
     * @param {Set} refSet - The reference set.
     * @returns {object} The JSON schema properties.
     */
    static jsonSchemaProperties (refSet) {
        assert(refSet);
        assert(this.asJsonSchema); // sanity check - we'll need this 
        refSet.add(this);

        const slots = this.jsonSchemaSlots();

        if (slots.length === 0) {
            return undefined;
        }

        const properties = {};

        slots.forEach(slot => {
            properties[slot.getterName()] = slot.asJsonSchema(refSet);
        });

        return properties;
    }
    
    /**

     * @description Get the JSON schema required for this instance.
     * @returns {Array} The JSON schema required.
     */
    static jsonSchemaRequired () {
        const slots = this.jsonSchemaSlots();

        if (slots.length === 0) {
            return undefined;
        }

        const required = [];
        
        slots.forEach(slot => {
            //if (!slot.allowsNullValue()) {
            if (slot.isRequired()) {
                required.push(slot.getterName());
            }
        })

        return required;
    }

    // --- json schema ---

    /**

     * @description Get the root JSON schema string for this instance.
     * @param {boolean} definitionsOnly - Whether to include only the definitions.
     * @returns {string} The root JSON schema string.
     */
    static asRootJsonSchemaString (definitionsOnly = false) {
        const json = this.asRootJsonSchema(definitionsOnly);
        const s = JSON.stableStringifyWithStdOptions(json, null, 4);
        return s;
    }

    asRootJsonSchemaString () {
        return this.thisClass().asRootJsonSchemaString();
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
                debugger;
            }
            if (!this.has(aClass)) {
                this._add(aClass);
                console.log("refSet.add(" + aClass.type() + ") size ", this.size);
            }
        }
        */

        const json = {
            "$id": this.type(),
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
            //console.log("Object.keys(json.definitions).length = ", Object.keys(json.definitions).length);
        }

        return json;
    }

    /**

     * @description Get the JSON schema definitions for a reference set.
     * @param {Set} refSet - The reference set.
     * @returns {object} The JSON schema definitions.
     */
    static jsonSchemaDefinitionsForRefSet (refSet) {
        assert(refSet);
        const definitions = {};

        // iterate to grab all the definitions - simple but a bit inefficient. Not used in tight loops, so no problem.
        let done = false;
        const classNameToSchemaMap = new Map(); 
        while (!done) {
            done = true;
            Array.from(refSet).forEach(aClass => {
                const className = aClass.type();
                if (!classNameToSchemaMap.has(className)) {
                    classNameToSchemaMap.set(className, aClass.asJsonSchema(refSet));
                    done = false;
                }
            });
        }

        // let's define them in alphabetical order to (possibly) make looking at the JSON easier (AI needs to look at this)
        const orderedClassNames = classNameToSchemaMap.keysArray().sort();
        orderedClassNames.forEach((className) => {
            const jsonSchema = classNameToSchemaMap.get(className);
            definitions[className] = jsonSchema;
        });

        /*
        // as we write out the definitions, we'll get encounter more refs, 
        // so we need to queue them to be added too

        const definedClasses = new Set();
        let undefinedClasses = new Set(refSet);

        while (undefinedClasses.size) {
            const newRefSet = new Set();
            undefinedClasses.forEach(aClass => {
                const schemaDef = aClass.asJsonSchema(newRefSet);
                assert(!Type.isNullOrUndefined(schemaDef), "missing schemaDef for " + aClass.type());
                definitions[aClass.type()] = schemaDef;
                definedClasses.add(aClass);
            });
            undefinedClasses = newRefSet.difference(definedClasses); // returns set with items in newRefSet but not in definedClasses
        }
        const definedClassNames = Array.from(definedClasses).map(c => c.type());
        console.log("definedClasses: [" + definedClassNames.join(", ") + "]");
        console.log("definitions: [" + Object.keys(definitions).join(", ") + "]");
        */
        return definitions;
    }

    static jsonSchemaIsReadOnly () {
        return false;
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
        if (title != this.type()) {
            schema.title = title;
        }

        assert(schema.description, "missing json schema description for " + this.type());
        return schema;
    }

    /**

     * @description Get the JSON schema reference for this instance.
     * @param {Set} refSet - The reference set.
     * @returns {string} The JSON schema reference.
     */
    static jsonSchemaRef (refSet) {
        assert(refSet);
        return this.jsonSchemaRefForTypeName(this.type(), refSet);
    }

    /**

     * @description Get the JSON schema reference for a type name.
     * @param {string} typeName - The type name.
     * @param {Set} refSet - The reference set.
     * @returns {string} The JSON schema reference.
     */
    static jsonSchemaRefForTypeName (typeName, refSet) {
        if (!refSet.has(this)) {
            this.asJsonSchema(refSet); // so we add references within the referenced type
        }
        assert(Type.isSet(refSet));
        assert(this.asJsonSchema); // sanity check - we'll need this 
        assert(this.jsonSchemaDescription(), "missing jsonSchemaDescription for " + this.type());
        refSet.add(this); // all classes in this set will be added to the "definitions" section of the root schema
        return "#/definitions/" + typeName;
    }

    /**

     * @description Create an instance from a JSON object.
     * @param {object} json - The JSON object.
     * @returns {SvNode} The new instance.
     */
    static instanceFromJson (json) {
        const properties = json.properties;
        assert(properties, "missing properties in json");

        const className = properties.className;
        assert(className, "missing className in json");

        const aClass = SvGlobals.globals()[className];
        assert(aClass, "missing class for className '" + className + "'");
        const instance = aClass.fromJsonSchema(json);

        return instance;
    }

    /**

     * @description Set the instance from a JSON object.
     * @param {object} json - The JSON object.
     * @returns {SvNode} This instance.
     */
    fromJsonSchema (json) {
        const slots = this.slotsWithAnnotation("isInJsonSchema", true);

        const requiredSlots = slots.filter(slot => slot.isRequired());
        const requiredSlotNamesSet = new Set(requiredSlots.map(slot => slot.getterName()));

        Object.keys(json).forEach(key => {
            const slot = slots.getSlot(key);
            if (slot) {
                assert(slot.isInJsonSchema(), "attempt to set slot not in json schema");

                if (slot.name() === "subnodes") { // special case subnodes for now?
                    //console.log("fromJsonSchema setting subnodes");
                    const subnodes = json[key];
                    this.removeAllSubnodes();
                    subnodes.forEach(subnodeJson => {
                        const subnode = SvNode.instanceFromJson(subnodeJson);
                        const hasValidSubnodeClass = this.subnodeClasses().length === 0 || this.subnodeClasses().includes(subnode.thisClass());
                        if (hasValidSubnodeClass) {
                            this.addSubnode(subnode);
                        } else {
                            console.warn("fromJsonSchema subnode class '" + subnode.type() + "' not in subnodeClasses " + JSON.stableStringifyWithStdOptions(this.subnodeClasses().map(c => c.type())));
                            debugger;
                        }
                    });
                } else {
                    const value = json[key];
                    slot.onInstanceSetValueWithJsonSchemaTypeCheck(this, value);
                }
            } else {
                console.warn("fromJsonSchema missing slot for key '" + key + "'");
                debugger;
            }
            requiredSlotNamesSet.delete(key);
        });

        if (requiredSlotNamesSet.size > 0) {
            // verify all required slots were set
            console.warn("fromJsonSchema missing required slots: " + Array.from(requiredSlotNamesSet).join(", "));
            debugger;
        }

        return this;
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
            return
        }
        visited.add(this);

        this.performIfResponding("shutdown", visited); 
        this.ownedSlotValues().forEach(sv => sv.performIfResponding("nodeShutdown", visited));
        this.subnodes().forEach(sn => {
          sn.performIfResponding("nodeShutdown", visited);
        });
      }

      /**

       * @description Get the slots whose values are owned by this instance.
       * @returns {Array} The slots whose values are owned by this instance.
       */
      slotsWhoseValuesAreOwned () {
        return this.thisPrototype().slots().filter(slot => slot.ownsValue());
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

}.initThisClass());




