"use strict";

/*

    NodeView

*/

(class NodeView extends StyledDomView {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("node", null); 
            //slot.setDuplicateOp("duplicate");
            slot.setSlotType("BMNode")
        }
        {
            const slot = this.newSlot("defaultSubviewProto", null);
            slot.setSlotType("Class");
        }
        {
            const slot = this.newSlot("overrideSubviewProto", null);
            slot.setSlotType("Class");
        }
        {
            const slot = this.newSlot("nodeObservation", null);
            slot.setSlotType("BMObservation");
        }
        {
            const slot = this.newSlot("isInspecting", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init()
        //this.setNodeObservation(BMNotificationCenter.shared().newObservation().setName("didUpdateNodeNote").setObserver(this))
        this.setNodeObservation(BMNotificationCenter.shared().newObservation().setObserver(this)) // observe all posts from node
        this.updateSubnodeToSubviewMap()
        return this
    } //.setDocs("init", "initializes the object", "returns this"),
    
    setNode (aNode) {
        if (this._node !== aNode) {
            this.stopWatchingNode();
            this._node = aNode;
            this.startWatchingNode();

            this.updateElementIdLabel();
            this.didChangeNode();
        }
		
        return this;
    }

    themeClassName () {
        if (this.node()) {
            const name = this.node().themeClassName();
            if (name) {
                return name;
            }
        }
        return super.themeClassName();
    }

    updateElementIdLabel () {
        this.element().id = this.debugTypeId()
        return this
    }
    
    didChangeNode () {
        if (this.node()) {
            //this.syncFromNode()
            this.scheduleSyncFromNode()
        }
        return this
    }
 
    startWatchingNode () {
        if (this.node()) {
            /*
            if (this.node().type() === "HwLocations") {
                console.log(this.typeId() + " startWatchingNode " + this.node().typeId());
                //console.log(this.typeId() + " startWatchingNode " + this.node().typeId() + " observation count = " + BMNotificationCenter.shared().observations().length);
            }
            */
            this.nodeObservation().setSender(this.node()).startWatching();
            //this.node().onStartObserving();
        }
        return this;
    }
       
    stopWatchingNode () {
        if (this.node()) {
            //console.log("stopWatchingNode " + this.node() + " observation count = " + BMNotificationCenter.shared().observations().length);
            this.nodeObservation().stopWatching();
            //this.nodeObservation().setSender(null);
            //this.node().onStopObserving();
        }
        return this
    }
    
    willRemove () {
        super.willRemove();
        this.stopWatchingNode();
        return this;
    }
    
    subviewProto () {
        debugger;
        //console.log("looking for subviewProto")
        if (this.node()) {
            const vc = this.node().nodeTileClass();
            if (vc) { 
                return vc;
            }
        }
        return super.subviewProto();
    }

    // --- syncing ---

    subviewForNode (aNode) {
        assert(this._subnodeToSubview);
        return this._subnodeToSubview[aNode];
    }

    updateSubnodeToSubviewMap () {
        // TODO: make this more efficient with add/remove hooks
        const dict = {};
        this.subviews().forEach(sv => {
            if (sv.node) { 
                dict.atSlotPut(sv.node(), sv);
            } 
        })
        this._subnodeToSubview = dict;
        return this;
    }

    subviewProtoForSubnode (aSubnode) {
        let proto = this.overrideSubviewProto();
		
        if (!proto) {
		    proto = aSubnode.nodeViewClass();
        }

        if (!proto) {
            proto = this.defaultSubviewProto();
        }
				
        return proto;
    }

    newSubviewForSubnode (aSubnode) {
        if (!aSubnode) {
            throw new Error("null aSubnode");
        }

        //console.log(this.debugTypeId() + ".newSubviewForSubnode(" + aSubnode.debugTypeId() + ")")
        const proto = this.subviewProtoForSubnode(aSubnode); // this is fast

        if (!proto) {
            debugger;
            //aSubnode.nodeViewClass() // used to step into to debug
            throw new Error("no subviewProto for subnode " + aSubnode.typeId());
        }

        const instance = proto.clone();

        instance.setNode(aSubnode); // this is fast
        return instance;
    }

    updateSubviews () {
        // for subclasses to override
        return this;
    }

    flattenedSubnodes (depth) {
        if (Type.isUndefined(depth)) {
            depth = 0;
        }
        const subnodes = this.node().subnodes();
        const flattened = [];
        subnodes.forEach(subnode => {
            flattened.push(subnode);
            if (depth > 0) {
                subnode.subnodes().forEach(sub => flattened.push(sub));
            }
        })

        return flattened;
    }
    
    visibleSubnodes () {
        const node = this.node();
        return node.subnodes();
    }

    syncCssFromNode () {
        const node = this.node();

        if (node && node.cssVariableDict) {
            const dict = node.cssVariableDict();
            if (dict) {
                this.applyCssVariableDict(dict);
            }
        }
        return this;
    }

    applyCssVariableDict (dict) {
        const el = this.element();
        Object.keys(dict).forEach(k => {
            const v = dict[k];
            //el.style.setProperty('--example-variable', v);
            el.style.setProperty(k, v);
        })
    }

    syncFromNode () {
        let subnodesDidChange = false;
        // override this method if the view manages it's own subviews
        const node = this.node();

        if (!node) { 
            if (this.subviews().length > 0) {
                this.removeAllSubviews();
                return true;
            }
            return false;
        }

        //this.setIsDisplayHidden(!node.isVisible())
        this.syncCssFromNode();

        //console.log("> " + this.debugTypeId() + " syncFromNode");
        
        node.prepareToSyncToView();
        this.updateSubnodeToSubviewMap(); // not ideal - move this to update on subview add/remove
       
        const newSubviews = [];
        
        // only replace subviews if sync requires it,
        // and reuse subviews for subnodes which are still present 

        if(this.visibleSubnodes().hasDuplicates()) {
            throw new Error("visibleSubnodes has duplicates");
        }
        
        //debugger;

        this.visibleSubnodes().forEach(subnode => {
            let subview = undefined;

            subview = this.subviewForNode(subnode) // get the current view for the node, if there is one

            if (!subview) {
                subview = this.newSubviewForSubnode(subnode)
            }

            if (Type.isNull(subview)) {
                throw new Error("null subview")
            }
            
            //assert(!newSubviews.contains(subview))
            newSubviews.push(subview)

            /*
            // this sets the display attribute which my be set elsewhere...

            subview.setIsDisplayHidden(!subnode.isVisible())

            if (!subnode.isVisible()) {
                debugger;
                console.log("subnode " + subnode.title() + " isDisplayHidden: " + subview.isDisplayHidden())
            }
            */

        });

        /*
        if (!node.isVisible()) {
            debugger;
        }

        this.setIsDisplayHidden(!node.isVisible());
        */

        /*
        const oldSubviews = this.subviews().shallowCopy()
        const removedSubviews = newSubviews.difference(oldSubviews)
        removedSubviews.forEach(sv => {
            sv.prepareToRetire();
        })
        */

        //debugger;
        
        if (!newSubviews.isEqual(this.subviews())) {
            subnodesDidChange = true
            //this.removeAllSubviews() ;
            this.removeAllSubviews();
            this.addSubviews(newSubviews);
            this.updateSubnodeToSubviewMap();
            // since node's don't hold a view reference, 
            // subviews no longer referenced in subviews list will be collected
        }

        this.subviews().forEach(subview => subview.syncFromNodeNow());

        return subnodesDidChange;
    }

    flipBorderColor () {
        const coinFlip = (Math.floor(Math.random() * 10) % 2 === 0);
        const color = coinFlip ? "red" : "blue";
        this.element().style.border = "1px dashed " + color;
    }

    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue);

        if (aSlot.syncsToNode()) { 
            this.scheduleSyncToNode();
        }
    }
    
    syncToNode () {
        const node = this.node();
        if (node) {
            //node.didUpdateNodeIfInitialized(); // is this needed? Shouldn't the slot hooks cover this?
        }
        return this;
    }

    onUpdatedNode (aNote) {
        assert(aNote);
        //this.debugLog(" didUpdateNode " + this.node().type());
        this.scheduleSyncFromNode();
    }
    
    scheduleSyncToNode (priority = 0) {
        if (this.hasScheduleSyncFromNode()) {
            this.hasScheduleSyncFromNode();
            console.log("SKIPPING scheduleSyncToNode because hasScheduleSyncFromNode");
            this.unscheduleSyncFromNode();
            return this;
        }
        
        SyncScheduler.shared().scheduleTargetAndMethod(this, "syncToNode", priority);
        return this;
    }
    
    hasScheduleSyncToNode () {
        return SyncScheduler.shared().isSyncingOrScheduledTargetAndMethod(this, "syncToNode");
    }

    hasScheduleSyncFromNode () {
        return SyncScheduler.shared().isSyncingOrScheduledTargetAndMethod(this, "syncFromNode");
    }

    scheduleSyncFromNode () {
        assert(!this.hasScheduleSyncToNode());
        SyncScheduler.shared().scheduleTargetAndMethod(this, "syncFromNode", 2); // let posts happen first
        return this;
    }

    unscheduleSyncFromNode () {
        SyncScheduler.shared().unscheduleTargetAndMethod(this, "syncFromNode");
    }

    syncFromNodeNow () { // unschedule syncFromNode if scheduled, and call syncFromNode now
        this.unscheduleSyncFromNode();
        this.syncFromNode();
    }

    // logging 
    
    logName () {
        return this.type();
    }
    
    log (msg) {
        const s = "[" + this.logName() + "] " + msg;
        console.log(s);
        return this;
    }
    
    // visibility
    
    onVisibility () {
	    super.onVisibility();
	    //this.debugLog(".onVisibility()");
	    const node = this.node();
	    if (node && node.nodeBecameVisible) {
	        node.nodeBecameVisible();
	    }

	    return this;
    }
    
    // value
    
    setValue (newValue) {
        this.setInnerHtml(newValue);
        return this;
    }
    
    value () {
        return this.innerHtml();
    }

    // ---

    resyncAllViews () {
        if (!this.hasScheduleSyncToNode()) {
            this.scheduleSyncFromNode();
        }
        this.subviews().forEach(sv => sv.resyncAllViews());
        //super.resyncAllViews(); // skip this as it calls updateSubviews, but we'll do that in syncFromNode
        return this;
    }

    // --- debugging ---

    nodeTitle () {
        const node = this.node();
        if (node) {
            return node.title();
        }
        return null;
    }
    
    // --- helpers ---

    nodeDescription () {
        const node = this.node();
        if (node) {
            return node.debugTypeId();
        }
        return null;
    }

    nodeId () {
        const node = this.node();
        const nodeId = node ? node.debugTypeId() : "null";
        return nodeId;
    }

    debugTypeId () {
        //return this.nodeDescription();
        //return super.debugTypeId() + this.debugTypeIdSpacer() + this.nodeDescription() + " theme:" + this.themeClassName();

        let s = "view:'" + this.typeId() + "'";
        s += " node:'" + this.nodeId() + "'";
        s += " themeClass:'" +this.themeClassName() + "'";
        if (this.node()) {
            s += " nodeTileClassName:'" + this.node().nodeTileClassName() + "'";
        }

        if (this.isVertical) {
            s += " isVertical:" + this.isVertical();
        }
        return s;
    }

}.initThisClass());
