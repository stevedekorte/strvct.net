"use strict";

/*

    BMNode
 
    The base class of model objects that supports the protocol 
    used to sync with views (subclasses of NodeView).

    State and behavior here are focused on managing subnodes.

    The BMStorableNode subclass is used to sync the model to
    the persistence system.


        Notifications (intended for views):

            - didUpdateNode // lets views know they need to scheduleSyncFromNode
            - shouldFocusSubnode // request that the UI focus on the sender

        Update messages sent to self:
            - didUpdateSlotParentNode(oldValue, newValue)
            
            - didChangeSubnodeList // hook to resort if needed and call didReorderParentSubnodes
            - prepareForFirstAccess // sent to self on first access to subnodes
            - prepareToAccess // sent to sent whenever a subnode is accessed

        Update messages sent to parent:
            - didUpdateNode // let parent know a subnode has changed

        Update messages sent to subnodes:
            - didReorderParentSubnodes // sent on subnode order change

        Protocol helpers:
            - watchOnceForNote(aNote) // typically used to watch for appDidInit

*/

(class BMNode extends ProtoClass {
    
    static availableAsNodePrimitive () {
        return true;
    }

    static primitiveNodeClasses () {
        const classes = BMNode.allSubclasses();
        return classes.filter(aClass => aClass.availableAsNodePrimitive());
    }

    // --- for CreatorNode Prototypes ---

    static visibleClassName () {
        let name = this.type();
        name = name.sansPrefix("BM");
        name = name.sansSuffix("Field");
        name = name.sansSuffix("Node");
        return name;
    }

    static availableAsNodePrimitive () {
        return false;
    }

    static nodeCreate () {
        // we implemnet this on BMNode class and prototype so 
        // it works for both instance and class creator prototypes
        return this.clone();
    }

    static nodeCreateName () {
        return this.visibleClassName();
    }

    // --- mime types ---

    static canOpenMimeType (mimeTypeString) {
        return false;
    }

    static openMimeChunk (dataChunk) {
        return null;
    }

    // ----

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
            const slot = this.newSlot("parentNode", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("BMNode");
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
            slot.setSlotType("BMNotification");
        }

        {
            const slot = this.newSlot("shouldFocusSubnodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("BMNotification");
        }

        {
            const slot = this.newSlot("shouldFocusAndExpandSubnodeNote", null); // private
            slot.setAllowsNullValue(true);
            slot.setSlotType("BMNotification");
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
    }

    initPrototype () {

    }

    init () {
        super.init();
        this.setDidUpdateNodeNote(this.newNoteNamed("onUpdatedNode"));
        this.setShouldFocusSubnodeNote(this.newNoteNamed("shouldFocusSubnode"));
        this.setShouldFocusAndExpandSubnodeNote(this.newNoteNamed("shouldFocusAndExpandSubnode"));
        this.watchSubnodes();

        this.setSubnodeClasses(this.thisPrototype().subnodeClasses().shallowCopy());
        return this
    }

    setSubnodes (subnodes) {
        if (this._subnodes === null) {
            this._subnodes = subnodes;
        } else {
            this._subnodes.copyFrom(subnodes);
        }
        return this;
    }

    registerForAppDidInit () {
        // need this in case app has already done init,
        // or if appDidInit notification itself inited objects
        // who register for appDidInit
        // TODO: generalize this for all notifications somehow
        // maybe register for note with object directly
        
        if (App.hasShared() && App.shared().hasDoneAppInit()) {
            this.appDidInit(); // may be async
        } else {
            this.watchOnceForNote("appDidInit");
        }
    }

    shouldStoreSlotSubnodes () {
        // called by subnodes slot when persisting instance
        return this.shouldStoreSubnodes();
    }

    nodeType () {
        return this.type();
    }

    /*
    prepareToRetire () {
        super.prepareToRetire() // will remove notification observations
        this._subnodes.removeMutationObserver(this)
    }
    */

    nodeCreate () {
        // we implemnet this on BMNode class and prototype so 
        // it works for both instance and class creator prototypes
        return this.duplicate();
    }
    
    nodeCreateName () {
        return this.title();
    }

    duplicate () {
        const dup = super.duplicate();
        if (!this.shouldStore() || this.shouldStoreSubnodes()) {
            dup.copySubnodes(this.subnodes().map(sn => sn.duplicate()));
        }
        return dup;
    }

    pid () { // TODO: unify with puuid?
        return this.puuid();
    }

    // -----------------------
    
    nodeVisibleClassName () {
        if (this._nodeVisibleClassName) {
            return this._nodeVisibleClassName;
        }
		
        return this.type().sansPrefix("BM");
    }

    // --- subnodes ----------------------------------------
    
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

    didUpdateSlotParentNode (oldValue, newValue) {
        // for subclasses to override
    }

    rootNode () {
        const pn = this.parentNode();
        if (pn) {
            return pn.rootNode();
        }
        return this;
    }

    // subnodes

    subnodeCount () {
        return this._subnodes.length;
    }

    hasSubnodes () {
        return this.subnodeCount() > 0;
    }

    justAddSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode));
        return this.justAddSubnodeAt(aSubnode, this.subnodeCount());
    }
	
    justAddSubnodeAt (aSubnode, anIndex) {
        assert(aSubnode);
        assert(!this.hasSubnode(aSubnode));
        this.subnodes().atInsert(anIndex, aSubnode);
        aSubnode.setParentNode(this);
        return aSubnode;
    }
    
    assertValidSubnodeType (aSubnode) {
        assert(aSubnode.thisClass().isKindOf(BMNode), "Attempt to add subnode of type '" + aSubnode.type() + "' which does not inherit from BMNode (as subnodes are required to do)");
    }

    addSubnodeAt (aSubnode, anIndex) {
        assert(!this.hasSubnode(aSubnode));
        this.assertValidSubnodeType(aSubnode);

        assert(anIndex >= 0);
        this.justAddSubnodeAt(aSubnode, anIndex);
        //this.didChangeSubnodeList(); // happens automatically from hooked array
        return aSubnode;
    }

    subnodeBefore (aSubnode) {
        const index = this.indexOfSubnode(aSubnode);
        assert(index !== -1);
        if (index > 0) {
            return this.subnodes().at(index - 1);
        }
        return null;
    }

    replaceSubnodeWith (aSubnode, newSubnode) {
        assert(!this.hasSubnode(newSubnode));

        const index = this.indexOfSubnode(aSubnode);
        assert(index !== -1);
        this.removeSubnode(aSubnode);
        this.addSubnodeAt(newSubnode, index);
        return newSubnode;
    }

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

    moveSubnodesToIndex (movedSubnodes, anIndex) {
        this.subnodes().moveItemsToIndex(movedSubnodes, anIndex)
        return this
    }

    addSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode));
        return this.addSubnodeAt(aSubnode, this.subnodeCount());
    }

    addLinkSubnode (aNode) {
        /*
        if (aNode.parentNode()) {
            console.warn("adding a link subnode to a node with no parent (yet)")
        }
        */
        const link = BMLinkNode.clone().setLinkedNode(aNode);
        this.addSubnode(link);
        return link;
    }

    addSubnodes (subnodes) {
        subnodes.forEach(subnode => this.addSubnode(subnode));
        return this;
    }

    addSubnodesIfAbsent (subnodes) {
        subnodes.forEach(subnode => this.addSubnodeIfAbsent(subnode));
        return this;
    }
    
    addSubnodeIfAbsent (aSubnode) {
        if (!this.hasSubnode(aSubnode)) {
            this.addSubnode(aSubnode);
            return true;
        }
        return false;
    }

    subnodeProto () {
        return this.subnodeClasses().first();
    }

    setSubnodeProto (aProto) {
        this.subnodeClasses().removeAll();
        this.subnodeClasses().appendIfAbsent(aProto);
        return this;
    }

    acceptedSubnodeTypes () {
        const types = [];
        this.subnodeClasses().forEach(c => types.push(c.type()));
        return types;
    }

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

    forEachSubnodeRecursively (fn) {
        this.subnodes().forEach(sn => {
            fn(sn);
            sn.forEachSubnodeRecursively(fn);
        })
    }

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

    addSubnodeIfAbsent (aNode) {
        if (!this.hasSubnode(aNode)) {
            this.addSubnode(aNode);
        }
        return this;
    }

    removeSubnodeIfPresent (aNode) {
        if (this.hasSubnode(aNode)) {
            this.removeSubnode(aNode);
        }
        return this;
    }

    // --------
	
    isEqual (aNode) {
	    return this === aNode;
    }

    hash () {
        // don't assume hash() always returns the puuid as
        // subclasses can override to measure equality in their own way
        return this.puuid();
    }

    createSubnodesIndex () {
        this.subnodes().setIndexClosure( v => v.hash());
        return this
    }
	
    hasSubnode (aSubnode) {
        const subnodes = this.subnodes();
        if (subnodes.length > 100) {
            this.createSubnodesIndex();
            return subnodes.indexHasItem(aSubnode);
        }
        //return subnodes.detect(subnode => subnode === aSubnode);
        return subnodes.detect(subnode => subnode.isEqual(aSubnode));
    }
    
    justRemoveSubnode (aSubnode) { // private method 
        this.subnodes().remove(aSubnode);
        
        if (aSubnode.parentNode() === this) {
            aSubnode.setParentNode(null);
        }
        
        return aSubnode;
    }
    
    removeSubnode (aSubnode) {
        this.justRemoveSubnode(aSubnode);
        //this.didChangeSubnodeList(); // handled by hooked array
        return aSubnode;
    }

    removeSubnodes (subnodeList) {
        subnodeList.forEach(sn => this.removeSubnode(sn));
        return this;
    }
    
    removeAllSubnodes () {
	    if (this.subnodeCount()) {
    		this.subnodes().slice().forEach((subnode) => {
    			this.justRemoveSubnode(subnode);
    		})
    		
            //this.didChangeSubnodeList() handled by hooked array but this could be more efficient
        }
        return this;
    }

    didReorderParentSubnodes () {
    }

    onDidReorderSubnodes () {
        this.subnodes().forEach(subnode => subnode.didReorderParentSubnodes());
    }

    didChangeSubnodeList () {
        //this.subnodes().forEach(subnode => assert(subnode.parentNode() === this)); // TODO: remove after debugging
        this.scheduleMethod("onDidReorderSubnodes");
        //this.subnodes().forEach(subnode => subnode.didReorderParentSubnodes());
        if (this.hasDoneInit()) {
            this.didUpdateNode();
        }
        return this;
    }

    copySubnodes (newSubnodes) {
        this.subnodes().copyFrom(newSubnodes);
        return this;
    }

    nodeReorderSudnodesTo (newSubnodes) {
        this.copySubnodes(newSubnodes);
        return this;
    }

    orderFirst () {
        this.parentNode().orderSubnodeFirst(this);
        return this;
    }

    orderLast () {
        this.parentNode().orderSubnodeLast(this);
        return this;
    }

    orderSubnodeFirst (aSubnode) {
        assert(aSubnode);
        assert(this.hasSubnode(aSubnode));
        const subnodes = this.subnodes().shallowCopy();
        subnodes.remove(aSubnode);
        subnodes.atInsert(0, aSubnode);
        this.nodeReorderSudnodesTo(subnodes);
        return this;
    }

    orderSubnodeLast (aSubnode) {
        assert(this.hasSubnode(aSubnode));
        const subnodes = this.subnodes().shallowCopy();
        subnodes.remove(aSubnode);
        subnodes.push(aSubnode);
        this.nodeReorderSudnodesTo(subnodes);
        return this;
    }
    
    // --- update / sync system ----------------------------
    
    didUpdateNodeIfInitialized () {
        if (this.hasDoneInit()) {
            this.didUpdateNode();
        }
    }

    didUpdateNode () {
        if (!this.hasDoneInit()) {
            return false;
        }

        const note = this.didUpdateNodeNote();

        if (note) {
            if (this.type() === "HwLocations") {
                if (!BMNotificationCenter.shared().hasNotification(note)) {
                    console.log(this.typeId() + " '" + this.title() + "' POST didUpdateNode - subnodesCount: " + this.subnodesCount());
                    debugger;
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

    hasDuplicateSubnodes () {
        return this.subnodes().hasDuplicates();
    }

    indexOfSubnode (aSubnode) {
        return this.subnodes().indexOf(aSubnode);
    }

    subnodeIndexInParent () {
        const p = this.parentNode();
        if (p) {
            return p.indexOfSubnode(this);
        }
        return 0;
    }

    nodeDepth () {
        const p = this.parentNode();
        if (p) {
            return p.nodeDepth() + 1;
        }
        return 0;
    }

    // ---------------------------------------

    prepareToAccess () {
        // this should be called whenever subnodes need to be accessed? See willGetSlotSubnodes
        if (!this._didPrepareForFirstAccess) {
            this._didPrepareForFirstAccess = true;
            this.prepareForFirstAccess();
        }
    }

    prepareForFirstAccess () {
        // subclasses can override 
    }

    /*
    willGetSlotSubnodes () {
        this.prepareToAccess(); // infinite loop?
    }
    */
    
    // --- parent chain notifications ---
    
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

    parentChainNodes (chain = []) {
        chain.unshift(this);
        const p = this.parentNode();
        if (p) {
            p.parentChainNodes(chain);
        }
        return chain;
    }

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

    firstParentChainNodeThatRespondsTo (methodName) {
        return this.firstParentChainNodeDetect(node => node.respondsTo(methodName));
    }

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
    
    log (msg) {
        //const s = this.nodePathString() + " --  " + msg
        if (this.isDebugging()) {
        	console.log("[" +  this.nodePathString() + "] " + msg);
        }
    }

    // --- post notifications ----------------------------------------

    postShouldFocusSubnode (aSubnode) {
        assert(aSubnode);
        this.shouldFocusSubnodeNote().setInfo(aSubnode).post();
        return this;
    }

    postShouldFocusAndExpandSubnode (aSubnode) {
        //debugger
        assert(aSubnode);
        this.shouldFocusAndExpandSubnodeNote().setInfo(aSubnode).post();
        return this;
    }

    // -- adding subnodes by instantiating subnode class ----
    
    justAddAt (anIndex) {
        const classes = this.subnodeClasses().shallowCopy();

        let newSubnode = null;
        if (classes.length === 0) {
            newSubnode = null;
        } else if (classes.length === 1) {
            newSubnode = classes.first().clone();
        } else {
            newSubnode = BMCreatorNode.clone();
            newSubnode.addSubnodesForObjects(classes);
        }

        if (newSubnode) {
            this.addSubnodeAt(newSubnode, anIndex);
        }
        return newSubnode;
    }

    justAdd (anIndex) {  
        return this.justAddAt(this.subnodeCount());
    }

    addAt (anIndex) {
        const newSubnode = this.justAddAt(anIndex);
        if (newSubnode) {
            this.didUpdateNodeIfInitialized();
            this.postShouldFocusAndExpandSubnode(newSubnode);
        }
        return newSubnode;
    }

    add (noArg) {  
        assert(noArg === undefined);
        return this.addAt(this.subnodeCount());
    }

    removeFromParentNode () {
        const pn = this.parentNode();
        if (pn) {
            pn.removeSubnode(this);
        } else {
            throw new Error("missing parentNode");
        }
        return this;
    }
	
    delete () {
        this.removeFromParentNode();
        return this;
    }

    // --- utility -----------------------------
    
    parentNodeOfType (className) {
        if (this.type() === className) {
            return this;
        }
        
        if (this.parentNode()) {
            return this.parentNode().parentNodeOfType(className);
        }
        
        return null;
    }

    parentNodes () {
        const node = this.parentNode();
        const results = [];
		
        while (node) {
            results.push(node);
            node = this.parentNode();
        }
        return results;
    }
	
    parentNodeTypes () {
        return this.parentNodes().map(node => node.type());
    }
    
    // --- subnode lookup -----------------------------
    
    subnodesSans (aSubnode) {
	    return this.subnodes().select(subnode => subnode !== aSubnode);
    }
	
    firstSubnodeOfType (obj) {
        // obj could be clas, prototype, or instance
        return this.subnodes().detect(subnode => subnode.type() === obj.type());
    }

    setupSubnodeOfType (aClass) {
        let subnode = this.firstSubnodeOfType(aClass);
        if (!subnode) {
            subnode = aClass.clone();
            this.addSubnode(subnode);
        }
        return subnode;
    }
        
    sendRespondingSubnodes (aMethodName, argumentList) {
        this.subnodes().forEach((subnode) => { 
            if (subnode[aMethodName]) {
                subnode[aMethodName].apply(subnode, argumentList);
            }
        })
        return this;
    }
    
    // --- subnodes -----------------------------
    
    subnodesCount () {
        return this.subnodes().length;
    }

    onDidMutateObject (anObject) {
        if (anObject === this._subnodes) {
            //assert(!this.subnodes().hasDuplicates())
            this.didChangeSubnodeList();
        }
    }

    watchSubnodes () {
        this._subnodes.addMutationObserver(this);
        return this
    }

    hasNullSubnodes () {
        return this.subnodes().indexOf(null) !== -1;
    }

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
                console.warn(this.debugTypeId() + " hasNullSubnodes - removing nulls and continuing:", this.subnodes())
                this.subnodes().removeOccurancesOf(null)
                //debugger
            }
            */

            if(this.hasDuplicateSubnodes()) {
                console.warn(this.debugTypeId() + " hasDuplicateSubnodes - removing duplicates and continuing")
                debugger
                newValue.removeDuplicates()
            }
        }

        assert(newValue.owner() === null)
        newValue.setOwner(this)

        this.watchSubnodes()
        if (this._subnodes.contains(null)) { // what would cause this?
            //debugger;
            console.warn("found null in subnodes array - removing")
            this._subnodes.filterInPlace(sn => !(sn === null) )
        }
        
        this._subnodes.forEach(sn => sn.setParentNode(this)) // TODO: isn't this done elsewhere?
        this.didChangeSubnodeList() // not handled automatically
        return this
    }
    
    assertSubnodesHaveParentNodes () {
        const missing = this.subnodes().detect(subnode => !subnode.parentNode())
        if (missing) {
            throw new Error("missing parent node on subnode " + missing.type())
        }
        return this
    }

    // --- subnode sorting ---
	
    setSubnodeSortFunc (f) {
        this.subnodes().setSortFunc(f)
	    return this
    }
	
    doesSortSubnodes () {
	    return this.subnodes().doesSort()
    }
    
    // --- subnode indexing ---
	
    lazyIndexedSubnodes () {
        if (!this.subnodes().indexClosure()) {
            this.subnodes().setIndexClosure( sn => sn.hash() )
        }
	    return this.subnodes()
    }
	
    subnodeWithHash (h) {
        return this.lazyIndexedSubnodes().itemForIndexKey(h)
    }
	
    removeSubnodeWithHash (h) {
	    const subnode = this.subnodeWithHash(h)
	    if (subnode) {
	        this.removeSubnode(subnode)
	    }
	    return this
    }
	
    hasSubnodeWithHash (h) {
	    return this.lazyIndexedSubnodes().hasIndexKey(h)
    }
	
    // visibility
	
    nodeBecameVisible () {
	    return this
    }

    // -- view selection request events ---

    onRequestSelectionOfDecendantNode () {
        return false // allow propogation up the parentNode line
    }

    onRequestSelectionOfNode () {
        this.tellParentNodes("onRequestSelectionOfDecendantNode", this)
        return this
    }

    onTapOfNode () {
        this.tellParentNodes("onTapOfDecendantNode", this)
        return this
    }

    debugTypeId () {
        return this.typeId() + " '" + this.title() + "'"
    }

    // ----

    /*
    validValuesForSlotName (slotName) {
        // if there's a method for this particular slot use it, 
        // otherwise fail back on the validValues declared in the Slot

        const getterName = "validValuesForSlot" + slotName.capitalized()
        const m = this[getterName]
        if (m) {
            const validValues = m.call(this)
            if (validValues !== undefined) {
                return validValues
            }
        } 
        
        const slot = this.thisPrototype().slotNamed(slotName)
        assert(slot)
        return slot.validValues()
    }
    */

    /*
    moveSubnodeToNode (aSubnode, aNode) {
        this.removeSubnode(aSubnode)
        aNode.addSubnode(aSubnode)
        return this
    }

    moveSubnodesToNode (aNode) {
        this.subnodes().shallowCopy().forEach(sn => {
            this.moveSubnodeToNode(sn, aNode)
        })
    }
    */

    collapseUnbranchingNodes () {
        this.subnodes().forEach(sn => sn.collapseUnbranchingNodes());
        this.subnodes().shallowCopy().forEach(sn => {
            const noSiblings = this.subnodes().length == 1 && sn.subnodes().length > 0;
            const oneChild = sn.subnodes().length == 1;

            const sns = sn.subnodes().shallowCopy()
            sns.forEach(node => node.removeFromParentNode())

            if (noSiblings || oneChild) {
                this.replaceSubnodeWithSubnodes(sn, sns)
            }
        })
        return this
    }

    leafSubnodes (results = []) {
         this.subnodes().forEach(sn => sn.leafSubnodesIncludingSelf(results));
         return results
    }

    leafSubnodesIncludingSelf (results = []) {
        if (!this.hasSubnodes()) {
            results.push(this)
        } else {
            this.subnodes().forEach(sn => sn.leafSubnodesIncludingSelf(results));
        }
        return results
    }

    // --- options helper ---- TODO: move elsewhere

    addOptionNodeForDict (item) {
        const hasSubnodes = item.options && item.options.length
        const nodeClass = hasSubnodes ? BMFolderNode : BMOptionNode;
        const newNode = nodeClass.clone().setTitle(item.label)
        
        if (!hasSubnodes) {
            newNode.setValue(item.value ? item.value : item.label)
            newNode.justSetIsPicked(item.isPicked === true)
            newNode.setNodeCanEditTitle(false)
        }

        if (item.subtitle) {
            newNode.setSubtitle(item.subtitle)
        }

        this.addSubnode(newNode)

        if (hasSubnodes) {
            newNode.addOptionNodesForArray(item.options)
        }

        return newNode
    }

    addOptionNodesForArray (itemDicts) {
        if (itemDicts) {
            itemDicts.forEach(subitemDict => {
                this.addOptionNodeForDict(subitemDict)
            })
        }
        return this   
    }

    // --- jsonArchive ---

    setJsonArchive (json) {
        // NOTE: use slot.setShouldJsonArchive(true) to set a slot to be json archived
        
        //console.log(this.typeId() + ".setJsonArchive(" + JSON.stableStringify(json, 2, 2) + ")");

        const keys = Object.keys(json).select(key => key !== "type");
        const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true);
        //assert(keys.length === jsonArchiveSlots.length); // or should we assume a diff if missing?
        
        jsonArchiveSlots.forEach(slot => {
            const k = slot.getterName();
            const v = json[k];
            if (json.hasOwnProperty(k)) {
                slot.onInstanceSetValue(this, v);
            } else {
                console.warn("no dict key '" + k + "' for archive slot " + k);
            }
        })

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


    jsonArchive () {
        const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true) 
        const dict = {
            type: this.type()
        }

        jsonArchiveSlots.forEach(slot => {
            const k = slot.getterName()
            const v = slot.onInstanceGetValue(this)
            dict[k] = v;
        })

        //console.log(this.typeId() + ".jsonArchive() = " + JSON.stableStringify(dict, 2, 2));

        return dict
    }
    
    static fromJsonArchive (json) {
        const className = json.type;
        assert(className); // sanity check
        
        const aClass = getGlobalThis()[className];
        assert(aClass.isKindOf(this)); // sanity check

        const instance = aClass.clone().setJsonArchive(json)
        return instance
    }

    // --- JSON schema properties ---

    static jsonSchemaString () {
        const schema = this.asRootJsonSchema();
        const s = JSON.stableStringify(schema, 2, 2);
        return s;
    }

    static jsonSchemaTitle () {
        return this.type();
    }

    static jsonSchemaSlots () {
        const jsonArchiveSlots = this.prototype.slotsWithAnnotation("isInJsonSchema", true);
        return jsonArchiveSlots;
    }

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

    static asRootJsonSchemaString (definitionsOnly = false) {
        const json = this.asRootJsonSchema(definitionsOnly);
        const s = JSON.stableStringify(json, 4, 4);
        return s;
    }

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
            console.log("Object.keys(json.definitions).length = ", Object.keys(json.definitions).length);
        }

        return json;
    }

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

    static asJsonSchema (refSet) {
        assert(refSet);
        const schema = {
            type: "object",
            description: this.jsonSchemaDescription(),
            properties: this.jsonSchemaProperties(refSet),
            required: this.jsonSchemaRequired()
        };

        const title = this.jsonSchemaTitle();
        if (title != this.type()) {
            schema.title = title;
        }

        assert(schema.description, "missing json schema description for " + this.type());
        return schema;
    }

    static jsonSchemaRef (refSet) {
        assert(refSet);
        return this.jsonSchemaRefForTypeName(this.type(), refSet);
    }

    static jsonSchemaRefForTypeName (typeName, refSet) {
        assert(Type.isSet(refSet));
        assert(this.asJsonSchema); // sanity check - we'll need this 
        assert(this.jsonSchemaDescription(), "missing jsonSchemaDescription for " + this.type());
        refSet.add(this); // all classes in this set will be added to the "definitions" section of the root schema
        return "#/definitions/" + typeName;
    }

    static instanceFromJson (json) {
        const properties = json.properties;
        assert(properties, "missing properties in json");

        const className = properties.className;
        assert(className, "missing className in json");

        const aClass = getGlobalThis()[className];
        assert(aClass, "missing class for className '" + className + "'");
        const instance = aClass.fromJsonSchema(json);

        return instance;
    }

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
                        const subnode = BMNode.instanceFromJson(subnodeJson);
                        const hasValidSubnodeClass = this.subnodeClasses().length === 0 || this.subnodeClasses().includes(subnode.thisClass());
                        if (hasValidSubnodeClass) {
                            this.addSubnode(subnode);
                        } else {
                            console.warn("fromJsonSchema subnode class '" + subnode.type() + "' not in subnodeClasses " + JSON.stableStringify(this.subnodeClasses().map(c => c.type())));
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

      slotsWhoseValuesAreOwned () {
        return this.thisPrototype().slots().filter(slot => slot.ownsValue());
      }

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




