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
        return true
    }

    static primitiveNodeClasses () {
        const classes = BMNode.allSubclasses()
        return classes.filter(aClass => aClass.availableAsNodePrimitive())
    }

    // --- for CreatorNode Prototypes ---

    static visibleClassName () {
        let name = this.type()
        name = name.sansPrefix("BM")
        name = name.sansSuffix("Field")
        name = name.sansSuffix("Node")
        return name
    }

    static availableAsNodePrimitive () {
        return false
    }

    static nodeCreate () {
        // we implemnet this on BMNode class and prototype so 
        // it works for both instance and class creator prototypes
        return this.clone()
    }

    static nodeCreateName () {
        return this.visibleClassName()
    }

    // --- mime types ---

    static canOpenMimeType (mimeTypeString) {
        return false
    }

    static openMimeChunk (dataChunk) {
        return null
    }

    // ----

    initPrototypeSlots () {
 
        {
            const slot = this.newSlot("nodeType", null)
            slot.setCanInspect(true)
            slot.setLabel("type")
            slot.setInspectorPath("Node")
            slot.setSlotType("String")
            slot.setCanEditInspection(false)
        }

        // parent node, subnodes

        {
            const slot = this.newSlot("parentNode", null)
        }

        {
            const slot = this.newSlot("nodeCanReorderSubnodes", false)
        }

        {
            const slot = this.newSlot("subnodes", null)
            slot.setInitProto(SubnodesArray)
            slot.setDoesHookSetter(true)
        }

        {
            // this allows us to effectively override the subnode's Slot's shouldStore property
            // if null, it uses the subnode's Slot object's value
            const slot = this.newSlot("shouldStoreSubnodes", null) 
            slot.setDuplicateOp("duplicate") //.setShouldStore(true)
        }

        {
            const slot = this.newSlot("subnodeClasses", []) //.setInitProto([]) // ui will present creator node if more than one option
        }

        // notification notes

        {
            const slot = this.newSlot("didUpdateNodeNote", null) // private
        }

        {
            const slot = this.newSlot("shouldFocusSubnodeNote", null) // private
        }

        {
            const slot = this.newSlot("shouldFocusAndExpandSubnodeNote", null) // private

        }

        // view related, but computed on node

        {
            const slot = this.newSlot("nodeVisibleClassName", null);
            slot.setDuplicateOp("copyValue");
        }

        {
            const slot = this.newSlot("canDelete", false);
            slot.setDuplicateOp("copyValue");
        }

        {
            const slot = this.newSlot("isVisible", true);
            slot.setSyncsToView(true);
        }

    }

    init () {
        super.init()
        this.setDidUpdateNodeNote(this.newNoteNamed("onUpdatedNode"))
        this.setShouldFocusSubnodeNote(this.newNoteNamed("shouldFocusSubnode"))
        this.setShouldFocusAndExpandSubnodeNote(this.newNoteNamed("shouldFocusAndExpandSubnode"))
        this.watchSubnodes()
        return this
    }

    registerForAppDidInit () {
        // need this in case app has already done init,
        // or if appDidInit notification itself inited objects
        // who register for appDidInit
        // TODO: generalize this for all notifications somehow
        // maybe register for note with object directly
        
        if (App.shared().hasDoneAppInit()) {
            this.appDidInit()
        } else {
            this.watchOnceForNote("appDidInit")
        }
    }

    shouldStoreSlotSubnodes () {
        // called by subnodes slot when persisting instance
        //debugger
        return this.shouldStoreSubnodes()
    }

    nodeType () {
        return this.type()
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
        return this.duplicate()
    }
    
    nodeCreateName () {
        return this.title()
    }

    duplicate () {
        const dup = super.duplicate()
        if (!this.shouldStore() || this.shouldStoreSubnodes()) {
            dup.copySubnodes(this.subnodes().map(sn => sn.duplicate()))
        }
        return dup
    }

    pid () { // TODO: unify with puuid?
        return this.puuid()
    }

    // -----------------------
    
    nodeVisibleClassName () {
        if (this._nodeVisibleClassName) {
            return this._nodeVisibleClassName
        }
		
        return this.type().sansPrefix("BM")
    }

    // --- subnodes ----------------------------------------
    
    setParentNode (aNode) {
        assert(aNode !== this) // sanity check

        if (aNode !== this._parentNode) { 
            if (this._parentNode && aNode) {
                console.warn(this.debugTypeId() + " setParentNode(" + aNode.debugTypeId() + ")  already has parent " + this._parentNode.debugTypeId());
                console.warn("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            }
            
            const oldNode = this._parentNode
            this._parentNode = aNode
            this.didUpdateSlotParentNode(oldNode, aNode)
        }
        return this
    }

    didUpdateSlotParentNode (oldValue, newValue) {
        // for subclasses to override
    }

    rootNode () {
        const pn = this.parentNode()
        if (pn) {
            return pn.rootNode()
        }
        return this
    }

    // subnodes

    subnodeCount () {
        return this._subnodes.length
    }

    hasSubnodes () {
        return this.subnodeCount() > 0
    }

    justAddSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode))
        return this.justAddSubnodeAt(aSubnode, this.subnodeCount())
    }
	
    justAddSubnodeAt (aSubnode, anIndex) {
        assert(aSubnode)
        assert(!this.hasSubnode(aSubnode))
        this.subnodes().atInsert(anIndex, aSubnode)
        aSubnode.setParentNode(this)
        return aSubnode        
    }

    addSubnodeAt (aSubnode, anIndex) {
        assert(!this.hasSubnode(aSubnode))

        assert(anIndex >= 0)
        this.justAddSubnodeAt(aSubnode, anIndex)
        //this.didChangeSubnodeList() // happens automatically from hooked array
        return aSubnode
    }

    subnodeBefore (aSubnode) {
        const index = this.indexOfSubnode(aSubnode)
        assert(index !== -1)
        if (index > 0) {
            return this.subnodes().at(index - 1)
        }
        return null
    }

    replaceSubnodeWith (aSubnode, newSubnode) {
        assert(!this.hasSubnode(newSubnode))

        const index = this.indexOfSubnode(aSubnode)
        assert(index !== -1)
        this.removeSubnode(aSubnode)
        this.addSubnodeAt(newSubnode, index)
        return newSubnode
    }

    replaceSubnodeWithSubnodes (aSubnode, newSubnodes) {
        let index = this.indexOfSubnode(aSubnode)
        assert(index !== -1)
        this.removeSubnode(aSubnode)

        newSubnodes.forEach(sn => {
            this.addSubnodeAt(sn, index)
            index ++
        })
        return this
    }

    moveSubnodesToIndex (movedSubnodes, anIndex) {
        this.subnodes().moveItemsToIndex(movedSubnodes, anIndex)
        return this
    }

    addSubnode (aSubnode) {
        assert(!this.hasSubnode(aSubnode))
        return this.addSubnodeAt(aSubnode, this.subnodeCount())
    }

    addLinkSubnode (aNode) {
        /*
        if (aNode.parentNode()) {
            console.warn("adding a link subnode to a node with no parent (yet)")
        }
        */
        const link = BMLinkNode.clone().setLinkedNode(aNode)
        this.addSubnode(link)
        return link
    }

    addSubnodes (subnodes) {
        subnodes.forEach(subnode => this.addSubnode(subnode))
        return this
    }

    addSubnodesIfAbsent (subnodes) {
        subnodes.forEach(subnode => this.addSubnodeIfAbsent(subnode))
        return this
    }
    
    addSubnodeIfAbsent (aSubnode) {
        if (!this.hasSubnode(aSubnode)) {
            this.addSubnode(aSubnode)
            return true
        }
        return false
    }

    subnodeProto () {
        return this.subnodeClasses().first()
    }

    setSubnodeProto (aProto) {
        this.subnodeClasses().removeAll()
        this.subnodeClasses().appendIfAbsent(aProto)
        return this
    }

    acceptedSubnodeTypes () {
        const types = []
        this.subnodeClasses().forEach(c => types.push(c.type()))
        return types
    }

    acceptsAddingSubnode (aSubnode) {
        if (aSubnode === this) {
            return false
        }

        /*
        if (this.hasSubnode(aSubnode)) {
            return false
        }
        */
        //const type = aSunode.type()
        const ancestors = aSubnode.thisClass().ancestorClassesTypesIncludingSelf()
        return this.acceptedSubnodeTypes().canDetect(type => ancestors.contains(type))
    }

    forEachSubnodeRecursively (fn) {
        this.subnodes().forEach(sn => {
            fn(sn)
            sn.forEachSubnodeRecursively(fn)
        })
    }

    selectSubnodesRecursively (fn) {
        const results = []
        this.forEachSubnodeRecursively(subnode => {
            if (fn(subnode)) {
                results.push(subnode)
            }
        })
        return results
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
	    return this === aNode
    }

    hash () {
        // don't assume hash() always returns the puuid as
        // subclasses can override to measure equality in their own way
        return this.puuid()
    }

    createSubnodesIndex () {
        this.subnodes().setIndexClosure( v => v.hash() )
        return this
    }
	
    hasSubnode (aSubnode) {
        const subnodes = this.subnodes()
        if (subnodes.length > 100) {
            this.createSubnodesIndex()
            return subnodes.indexHasItem(aSubnode) 
        }
        //return subnodes.detect(subnode => subnode === aSubnode)
        return subnodes.detect(subnode => subnode.isEqual(aSubnode))
    }
    
    justRemoveSubnode (aSubnode) { // private method 
        this.subnodes().remove(aSubnode)
        
        if (aSubnode.parentNode() === this) {
            aSubnode.setParentNode(null)
        }
        
        return aSubnode
    }
    
    removeSubnode (aSubnode) {
        this.justRemoveSubnode(aSubnode)
        //this.didChangeSubnodeList() handled by hooked array
        return aSubnode
    }

    removeSubnodes (subnodeList) {
        subnodeList.forEach(sn => this.removeSubnode(sn))
        return this
    }
    
    removeAllSubnodes () {
	    if (this.subnodeCount()) {
    		this.subnodes().slice().forEach((subnode) => {
    			this.justRemoveSubnode(subnode)
    		})
    		
            //this.didChangeSubnodeList() handled by hooked array but this could be more efficient
        }
        return this
    }

    didReorderParentSubnodes () {
    }

    onDidReorderSubnodes () {
        this.subnodes().forEach(subnode => subnode.didReorderParentSubnodes())
    }

    didChangeSubnodeList () {
        //this.subnodes().forEach(subnode => assert(subnode.parentNode() === this)) // TODO: remove after debugging
        this.scheduleMethod("onDidReorderSubnodes")
        //this.subnodes().forEach(subnode => subnode.didReorderParentSubnodes())
        if (this.hasDoneInit()) {
            this.didUpdateNode()
        }
        return this
    }

    copySubnodes (newSubnodes) {
        this.subnodes().copyFrom(newSubnodes)
        return this
    }

    nodeReorderSudnodesTo (newSubnodes) {
        this.copySubnodes(newSubnodes)
        return this
    }

    orderFirst () {
        this.parentNode().orderSubnodeFirst(this)
        return this
    }

    orderLast () {
        this.parentNode().orderSubnodeLast(this)
        return this  
    }

    orderSubnodeFirst (aSubnode) {
        assert(aSubnode)
        assert(this.hasSubnode(aSubnode))
        const subnodes = this.subnodes().shallowCopy()
        subnodes.remove(aSubnode)
        subnodes.atInsert(0, aSubnode)
        this.nodeReorderSudnodesTo(subnodes)
        return this
    }

    orderSubnodeLast (aSubnode) {
        assert(this.hasSubnode(aSubnode))
        const subnodes = this.subnodes().shallowCopy()
        subnodes.remove(aSubnode)
        subnodes.push(aSubnode)
        this.nodeReorderSudnodesTo(subnodes)
        return this
    }
    
    // --- update / sync system ----------------------------
    
    didUpdateNodeIfInitialized () {
        if (this.hasDoneInit()) {
            this.didUpdateNode()
        }
    }

    didUpdateNode () {
        if (!this.hasDoneInit()) {
            return false
        }

        const note = this.didUpdateNodeNote()

        if (note) {
            //console.log("Node '" + this.title() + "' POST didUpdateNode")
            note.post()
        }

        
        // TODO: make this more efficient, as we don't always need it
        
        if (this.parentNode()) {
            assert(this.parentNode() !== this)
            this.parentNode().didUpdateNodeIfInitialized()
        }

        return true
    }

    hasDuplicateSubnodes () {
        return this.subnodes().hasDuplicates()
    }

    indexOfSubnode (aSubnode) {
        return this.subnodes().indexOf(aSubnode);
    }

    subnodeIndexInParent () {
        const p = this.parentNode()
        if (p) {
            return p.indexOfSubnode(this)
        }
        return 0
    }

    nodeDepth () {
        const p = this.parentNode()
        if (p) {
            return p.nodeDepth() + 1
        }
        return 0
    }

    // ---------------------------------------

    prepareToAccess () {
        // this should be called whenever subnodes need to be accessed? See willGetSlotSubnodes
        if (!this._didPrepareForFirstAccess) {
            this._didPrepareForFirstAccess = true
            this.prepareForFirstAccess()
        }
    }

    prepareForFirstAccess () {
        // subclasses can override 
    }

    /*
    willGetSlotSubnodes () {
        debugger
        this.prepareToAccess() // infinite loop?
    }
    */
    
    // --- parent chain notifications ---
    
    tellParentNodes (msg, aNode) {
        const f = this[msg]
        if (f && f.apply(this, [aNode])) {
            return
        }

        const p = this.parentNode()
        if (p) {
            p.tellParentNodes(msg, aNode)
        }
    }

    parentChainNodes (chain = []) {
        chain.unshift(this)
        const p = this.parentNode()
        if (p) {
            p.parentChainNodes(chain)
        }
        return chain
    }

    parentChainNodeTo (node, chain = []) {
        if (this !== node) {
            chain.unshift(this)
            const p = this.parentNode()
            if (p) {
                p.parentChainNodeTo(node, chain)
            }
        }
        return chain
    }

    firstParentChainNodeOfClass (aClass) {
        //return this.firstParentChainNodeDetect(node => node.thisClass().isSubclassOf(aClass));

        if (this.thisClass().isSubclassOf(aClass)) {
            return this
        }

        if (this.parentNode()) {
            return this.parentNode().firstParentChainNodeOfClass(aClass)
        }

        return null
    }

    firstParentChainNodeThatRespondsTo (methodName) {
        return this.firstParentChainNodeDetect(node => node.respondsTo(methodName));
    }

    firstParentChainNodeDetect (func) {
        // return this.parentChainNodes().detect(func);
        if (func(this)) {
            return this
        }

        if (this.parentNode()) {
            return this.parentNode().firstParentChainNodeDetect(func);
        }

        return null
    }
    
    // --- log ------------------------
    
    log (msg) {
        //const s = this.nodePathString() + " --  " + msg
        if (this.isDebugging()) {
        	console.log("[" +  this.nodePathString() + "] " + msg)
        }
    }

    // --- post notifications ----------------------------------------

    postShouldFocusSubnode (aSubnode) {
        assert(aSubnode)
        this.shouldFocusSubnodeNote().setInfo(aSubnode).post()
        return this
    }

    postShouldFocusAndExpandSubnode (aSubnode) {
        //debugger
        assert(aSubnode)
        this.shouldFocusAndExpandSubnodeNote().setInfo(aSubnode).post()
        return this
    }

    // -- adding subnodes by instantiating subnode class ----
    
    justAddAt (anIndex) {
        const classes = this.subnodeClasses().shallowCopy()

        let newSubnode = null
        if (classes.length === 0) {
            newSubnode = null
        } else if (classes.length === 1) {
            newSubnode = classes.first().clone()
        } else {
            newSubnode = BMCreatorNode.clone()
            newSubnode.addSubnodesForObjects(classes)
        }

        if (newSubnode) {
            this.addSubnodeAt(newSubnode, anIndex)
        }
        return newSubnode
    }

    justAdd (anIndex) {  
        return this.justAddAt(this.subnodeCount())
    }

    addAt (anIndex) {
        const newSubnode = this.justAddAt(anIndex)
        if (newSubnode) {
            this.didUpdateNodeIfInitialized()
            this.postShouldFocusAndExpandSubnode(newSubnode)
        }
        return newSubnode
    }

    add () {  
        return this.addAt(this.subnodeCount())
    }

    removeFromParentNode () {
        const pn = this.parentNode()
        if (pn) {
            pn.removeSubnode(this)
        } else {
            throw new Error("missing parentNode")
        }
        return this
    }
	
    delete () {
        this.removeFromParentNode()
        return this
    }

    /*
    nodeParentHasDeleteAction () {
        const p = this.parentNode()
        return p && p.hasNodeAction("delete")
    }
    */

    /*
    canDelete () {
        if (this._canDelete) {
            return true
        }

        return this.nodeParentHasDeleteAction()
    }
    */

    canSelfAddSubnode () {
        return this.hasNodeAction("add")
    }

    // --- utility -----------------------------
    
    parentNodeOfType (className) {
        if (this.type() === className) {
            return this
        }
        
        if (this.parentNode()) {
            return this.parentNode().parentNodeOfType(className)
        }
        
        return null
    }

    parentNodes () {
        const node = this.parentNode()
        const results = []
		
        while (node) {
            results.push(node)
            node = this.parentNode()
        }
        return results
    }
	
    parentNodeTypes () {
        return this.parentNodes().map(node => node.type())
    }
    
    // --- subnode lookup -----------------------------
    
    subnodesSans (aSubnode) {
	    return this.subnodes().select(subnode => subnode !== aSubnode)
    }
	
    firstSubnodeOfType (obj) {
        // obj could be clas, prototype, or instance
        return this.subnodes().detect(subnode => subnode.type() === obj.type())
    }

    setupSubnodeOfType (aClass) {
        let subnode = this.firstSubnodeOfType(aClass)
        if (!subnode) {
            subnode = aClass.clone();
            this.addSubnode(subnode);
        }
        return subnode
    }
        
    sendRespondingSubnodes (aMethodName, argumentList) {
        this.subnodes().forEach((subnode) => { 
            if (subnode[aMethodName]) {
                subnode[aMethodName].apply(subnode, argumentList)
            }
        })
        return this
    }
    
    // --- subnodes -----------------------------
    
    subnodesCount () {
        return this.subnodes().length
    }

    onDidMutateObject (anObject) {
        if (anObject === this._subnodes) {
            //assert(!this.subnodes().hasDuplicates())
            this.didChangeSubnodeList()
        }
    }

    watchSubnodes () {
        this._subnodes.addMutationObserver(this)
        return this
    }

    hasNullSubnodes () {
        return this.subnodes().indexOf(null) !== -1
    }

    didUpdateSlotSubnodes (oldValue, newValue) {
        if (oldValue) {
            oldValue.removeMutationObserver(this)
        }

        if (Type.isNullOrUndefined(newValue)) {
            console.warn("attempt to set subnodes array to null or undefined - possible corruption of object pool storage <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            //debugger;
            newValue = [];
        }

        if (newValue.type() !== "SubnodesArray") {
            //debugger;
            this._subnodes = SubnodesArray.from(newValue)
            newValue.removeDuplicates()
            newValue = this._subnodes
            assert(newValue.type() === "SubnodesArray")
        } else {
            
            if (this.hasNullSubnodes()) {
                console.warn(this.debugTypeId() + " hasNullSubnodes - removing nulls and continuing:", this.subnodes())
                this.subnodes().removeOccurancesOf(null)
                //debugger
            }

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
        // NOTE: use slot.setAnnotation("shouldJsonArchive", true) to set a slot to be json archived
        
        //console.log(this.typeId() + ".setJsonArchive(" + JSON.stringify(json, 2, 2) + ")");

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

        //console.log(this.typeId() + ".jsonArchive() = " + JSON.stringify(dict, 2, 2));

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


}.initThisClass());




