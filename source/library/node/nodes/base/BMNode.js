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

    initPrototype () {
 
        {
            const slot = this.newSlot("nodeType", null)
            slot.setCanInspect(true)
            slot.setLabel("type")
            slot.setSlotType("String")
            //slot.setInspectorPath("Subtitle")
            slot.setCanEditInspection(false)
        }

        // parent node, subnodes

        this.newSlot("parentNode", null)
        this.newSlot("nodeCanReorderSubnodes", false)
        this.newSlot("subnodes", null).setInitProto(SubnodesArray).setDoesHookSetter(true)
        this.newSlot("shouldStoreSubnodes", true).setDuplicateOp("duplicate") //.setShouldStore(true)
        this.newSlot("subnodeClasses", []) //.setInitProto([]) // ui will present creator node if more than one option

        // notification notes

        this.newSlot("didUpdateNodeNote", null) // private
        this.newSlot("shouldFocusSubnodeNote", null) // private
        this.newSlot("shouldFocusAndExpandSubnodeNote", null) // private

        // view related, but computed on node

        this.newSlot("nodeVisibleClassName", null).setDuplicateOp("copyValue")

        this.newSlot("canDelete", false).setDuplicateOp("copyValue")
    }


    init () {
        super.init()
        this.setDidUpdateNodeNote(this.newNoteNamed("didUpdateNode"))
        this.setShouldFocusSubnodeNote(this.newNoteNamed("shouldFocusSubnode"))
        this.setShouldFocusAndExpandSubnodeNote(this.newNoteNamed("shouldFocusAndExpandSubnode"))
        this.watchSubnodes()
        return this
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
                console.warn(this.type() + " setParentNode(" + aNode.type() + ")  already has parent " + this._parentNode.type())
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
        return this.justAddSubnodeAt(aSubnode, this.subnodeCount())
    }
	
    justAddSubnodeAt (aSubnode, anIndex) {
        this.subnodes().atInsert(anIndex, aSubnode)
        aSubnode.setParentNode(this)
        return aSubnode        
    }

    addSubnodeAt (aSubnode, anIndex) {
        assert(anIndex >= 0)
        this.justAddSubnodeAt(aSubnode, anIndex)
        //this.didChangeSubnodeList() // happens automatically from hooked array
        return aSubnode
    }

    replaceSubnodeWith (aSubnode, newSubnode) {
        const index = this.indexOfSubnode(aSubnode)
        assert(index !== -1)
        this.removeSubnode(aSubnode)
        this.addSubnodeAt(newSubnode, index)
        return newSubnode
    }

    moveSubnodesToIndex (movedSubnodes, anIndex) {
        this.subnodes().moveItemsToIndex(movedSubnodes, anIndex)
        return this
    }

    addSubnode (aSubnode) {
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
        const match = this.acceptedSubnodeTypes().detect(type => ancestors.contains(type))
        return !Type.isNullOrUndefined(match)
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
        this.didUpdateNode()
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
    

    didUpdateNode () {
        if (!this.hasDoneInit()) {
            return
        }

        const note = this.didUpdateNodeNote()

        if (note) {
            //console.log("Node '" + this.title() + "' POST didUpdateNode")
            note.post()
        }

        
        // TODO: make this more efficient, as we don't always need it
        
        if (this.parentNode()) {
            assert(this.parentNode() !== this)
            this.parentNode().didUpdateNode()
        }
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
    
    prepareForFirstAccess () {
        // subclasses can override 
    }

    prepareToAccess () {
        // this should be called whenever subnodes need to be accessed
        if (!this._didPrepareForFirstAccess) {
            this._didPrepareForFirstAccess = true
            this.prepareForFirstAccess()
        }
    }
    
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
        assert(aSubnode)
        this.shouldFocusAndExpandSubnodeNote().setInfo(aSubnode).post()
        return this
    }

    // ---------------------------------------------------------------
    
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
            this.didUpdateNode()
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
        return p && p.hasAction("delete")
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
        return this.hasAction("add")
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
	
    firstSubnodeOfType (aProto) {
        return this.subnodes().detect(subnode => subnode.type() === aProto.type())
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
            this.didChangeSubnodeList()
        }
    }

    watchSubnodes () {
        this._subnodes.addMutationObserver(this)
        return this
    }

    didUpdateSlotSubnodes (oldValue, newValue) {
        if (oldValue) {
            oldValue.removeMutationObserver(this)
        }

        this.watchSubnodes()
        if (this._subnodes.contains(null)) { // what would cause this?
            //debugger;
            console.warn("found null in subnodes: ")
            this._subnodes.filterInPlace(sn => !(sn === null) )
        }
        this._subnodes.forEach(sn => sn.setParentNode(this))
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


}.initThisClass());




