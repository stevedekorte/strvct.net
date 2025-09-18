"use strict";

/**
 * @module library.node.node_views
 * @class NodeView
 * @extends StyledDomView
 * @classdesc
 * NodeView represents a view for a node in the application.
 * It handles the synchronization between the node model and its visual representation.
 */
(class NodeView extends StyledDomView {
    
    /**
     * @description Initializes the prototype slots for the NodeView.
     */
    initPrototypeSlots () {
        /**
         * @member {SvNode} node
         * @description The node associated with this view.
         */
        {
            const slot = this.newSlot("node", null); 
            slot.setSlotType("SvNode")
        }

        /**
         * @member {Class} defaultSubviewProto
         * @description The default prototype for subviews.
         */
        {
            const slot = this.newSlot("defaultSubviewProto", null);
            slot.setSlotType("DomView class");
        }

        /**
         * @member {Class} overrideSubviewProto
         * @description The override prototype for subviews.
         */
        {
            const slot = this.newSlot("overrideSubviewProto", null);
            slot.setSlotType("DomView class");
        }

        /**
         * @member {SvObservation} nodeObservation
         * @description The observation object for the node.
         */
        {
            const slot = this.newSlot("nodeObservation", null);
            slot.setSlotType("SvObservation");
        }

        /**
         * @member {boolean} isInspecting
         * @description Indicates if the view is in inspection mode.
         */
        {
            const slot = this.newSlot("isInspecting", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the NodeView.
     * @returns {NodeView} The current instance.
     */
    init () {
        super.init()
        this.setNodeObservation(SvNotificationCenter.shared().newObservation().setObserver(this))
        this.updateSubnodeToSubviewMap()
        return this
    }
    
    /**
     * @description Sets the node for this view.
     * @param {SvNode} aNode - The node to set.
     * @returns {NodeView} The current instance.
     */
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

    /**
     * @description Gets the theme class name for this view.
     * @returns {string} The theme class name.
     */
    themeClassName () {
        if (this.node()) {
            const name = this.node().themeClassName();
            if (name) {
                return name;
            }
        }
        return super.themeClassName();
    }

    /**
     * @description Updates the element ID label.
     * @returns {NodeView} The current instance.
     */
    updateElementIdLabel () {
        this.element().id = this.svDebugId()
        return this
    }
    
    /**
     * @description Handles changes to the node.
     * @returns {NodeView} The current instance.
     */
    didChangeNode () {
        if (this.node()) {
            this.scheduleSyncFromNode()
        }
        return this
    }
 
    /**
     * @description Starts watching the node for changes.
     * @returns {NodeView} The current instance.
     */
    startWatchingNode () {
        if (this.node()) {
            this.nodeObservation().setSender(this.node()).startWatching();
        }
        return this;
    }
       
    /**
     * @description Stops watching the node for changes.
     * @returns {NodeView} The current instance.
     */
    stopWatchingNode () {
        if (this.node()) {
            this.nodeObservation().stopWatching();
        }
        return this
    }
    
    /**
     * @description Prepares the view for removal.
     * @returns {NodeView} The current instance.
     */
    willRemove () {
        super.willRemove();
        this.stopWatchingNode();
        return this;
    }
    
    /**
     * @description Gets the prototype for subviews.
     * @returns {Class} The subview prototype.
     */
    subviewProto () {
        debugger;
        if (this.node()) {
            const vc = this.node().nodeTileClass();
            if (vc) { 
                return vc;
            }
        }
        return super.subviewProto();
    }

    /**
     * @description Gets the subview for a given node.
     * @param {SvNode} aNode - The node to get the subview for.
     * @returns {NodeView} The subview for the node.
     */
    subviewForNode (aNode) {
        assert(this._subnodeToSubview);
        return this._subnodeToSubview[aNode];
    }

    /**
     * @description Updates the map of subnodes to subviews.
     * @returns {NodeView} The current instance.
     */
    updateSubnodeToSubviewMap () {
        const dict = {};
        this.subviews().forEach(sv => {
            if (sv.node) { 
                dict.atSlotPut(sv.node(), sv);
            } 
        })
        this._subnodeToSubview = dict;
        return this;
    }

    /**
     * @description Gets the subview prototype for a subnode.
     * @param {SvNode} aSubnode - The subnode to get the prototype for.
     * @returns {Class} The subview prototype.
     */
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

    /**
     * @description Creates a new subview for a subnode.
     * @param {SvNode} aSubnode - The subnode to create a subview for.
     * @returns {NodeView} The new subview.
     */
    newSubviewForSubnode (aSubnode) {
        if (!aSubnode) {
            throw new Error("null aSubnode");
        }

        const proto = this.subviewProtoForSubnode(aSubnode);

        if (!proto) {
            throw new Error("no subviewProto for subnode " + aSubnode.svTypeId());
        }

        const instance = proto.clone();

        instance.setNode(aSubnode);
        return instance;
    }

    /**
     * @description Updates the subviews.
     * @returns {NodeView} The current instance.
     */
    updateSubviews () {
        return this;
    }

    /**
     * @description Gets the flattened subnodes.
     * @param {number} [depth=0] - The depth to flatten to.
     * @returns {Array<SvNode>} The flattened subnodes.
     */
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
    
    /**
     * @description Gets the visible subnodes.
     * @returns {Array<SvNode>} The visible subnodes.
     */
    visibleSubnodes () {
        const node = this.node();
        return node.subnodes().filter(subnode => subnode.isVisible());
    }

    /**
     * @description Syncs CSS from the node.
     * @returns {NodeView} The current instance.
     */
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

    /**
     * @description Applies CSS variables from a dictionary.
     * @param {Object} dict - The dictionary of CSS variables.
     */
    applyCssVariableDict (dict) {
        const el = this.element();
        Object.keys(dict).forEach(k => {
            const v = dict[k];
            el.style.setProperty(k, v);
        })
    }

    /**
     * @description Syncs the view from the node.
     * @returns {boolean} True if subnodes changed, false otherwise.
     */
    syncFromNode () {
        let subnodesDidChange = false;
        const node = this.node();

        if (!node) { 
            if (this.subviews().length > 0) {
                this.removeAllSubviews();
                return true;
            }
            return false;
        }

        this.syncCssFromNode();
        
        node.prepareToSyncToView();
        this.updateSubnodeToSubviewMap();
       
        const newSubviews = [];
        
        if(this.visibleSubnodes().hasDuplicates()) {
            throw new Error("visibleSubnodes has duplicates");
        }
        
        this.visibleSubnodes().forEach(subnode => {
            let subview = undefined;

            subview = this.subviewForNode(subnode)

            if (!subview) {
                subview = this.newSubviewForSubnode(subnode)
            }

            if (Type.isNull(subview)) {
                throw new Error("null subview")
            }
            
            newSubviews.push(subview)
        });

        if (!newSubviews.isEqual(this.subviews())) {
            subnodesDidChange = true
            this.removeAllSubviews();
            this.addSubviews(newSubviews);
            this.updateSubnodeToSubviewMap();
        }

        this.subviews().forEach(subview => subview.syncFromNodeNow());

        return subnodesDidChange;
    }

    /**
     * @description Flips the border color of the view.
     */
    flipBorderColor () {
        const coinFlip = (Math.floor(Math.random() * 10) % 2 === 0);
        const color = coinFlip ? "red" : "blue";
        this.element().style.border = "1px dashed " + color;
    }

    /**
     * @description Handles updates to slots.
     * @param {Object} aSlot - The slot that was updated.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     */
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue);

        if (aSlot.syncsToNode()) { 
            this.scheduleSyncToNode();
        }
    }
    
    /**
     * @description Syncs the view to the node.
     * @returns {NodeView} The current instance.
     */
    syncToNode () {
        const node = this.node();
        if (node) {
            //node.didUpdateNodeIfInitialized();
        }
        return this;
    }

    /**
     * @description Handles node updates.
     * @param {Object} aNote - The notification object.
     */
    onUpdatedNode (aNote) {
        assert(aNote);
        this.scheduleSyncFromNode();
    }
    
    /**
     * @description Schedules a sync to the node.
     * @param {number} [priority=0] - The priority of the sync.
     * @returns {NodeView} The current instance.
     */
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
    
    /**
     * @description Checks if a sync to node is scheduled.
     * @returns {boolean} True if a sync to node is scheduled, false otherwise.
     */
    hasScheduleSyncToNode () {
        return SyncScheduler.shared().isSyncingOrScheduledTargetAndMethod(this, "syncToNode");
    }

    /**
     * @description Checks if a sync from node is scheduled.
     * @returns {boolean} True if a sync from node is scheduled, false otherwise.
     */
    hasScheduleSyncFromNode () {
        return SyncScheduler.shared().isSyncingOrScheduledTargetAndMethod(this, "syncFromNode");
    }

    /**
     * @description Schedules a sync from the node.
     * @returns {NodeView} The current instance.
     */
    scheduleSyncFromNode () {
        assert(!this.hasScheduleSyncToNode());
        SyncScheduler.shared().scheduleTargetAndMethod(this, "syncFromNode", 2);
        return this;
    }

    /**
     * @description Unschedules a sync from the node.
     */
    unscheduleSyncFromNode () {
        SyncScheduler.shared().unscheduleTargetAndMethod(this, "syncFromNode");
    }

    /**
     * @description Syncs from the node immediately.
     */
    syncFromNodeNow () {
        this.unscheduleSyncFromNode();
        this.syncFromNode();
    }

    /**
     * @description Gets the log name for this view.
     * @returns {string} The log name.
     */
    logName () {
        return this.svType();
    }
    
    /**
     * @description Logs a message.
     * @param {string} msg - The message to log.
     * @returns {NodeView} The current instance.
     */
    log (msg) {
        const s = "[" + this.logName() + "] " + msg;
        console.log(s);
        return this;
    }
    
    /**
     * @description Handles visibility changes.
     * @returns {NodeView} The current instance.
     */
    onVisibility () {
	    super.onVisibility();
	    const node = this.node();
	    if (node && node.nodeBecameVisible) {
	        node.nodeBecameVisible();
	    }

	    return this;
    }
    
    /**
     * @description Sets the value of the view.
     * @param {*} newValue - The new value to set.
     * @returns {NodeView} The current instance.
     */
    setValue (newValue) {
        this.setInnerHtml(newValue);
        return this;
    }
    
    /**
     * @description Gets the value of the view.
     * @returns {*} The value of the view.
     */
    value () {
        return this.innerHtml();
    }

    /**
     * @description Resyncs all views.
     * @returns {NodeView} The current instance.
     */
    resyncAllViews () {
        if (!this.hasScheduleSyncToNode()) {
            this.scheduleSyncFromNode();
        }
        this.subviews().forEach(sv => sv.resyncAllViews());
        return this;
    }

    /**
     * @description Gets the title of the node.
     * @returns {string|null} The title of the node, or null if there is no node.
     */
    nodeTitle () {
        const node = this.node();
        if (node) {
            return node.title();
        }
        return null;
    }
    
    /**
     * @description Gets the description of the node.
     * @returns {string|null} The description of the node, or null if there is no node.
     */
    nodeDescription () {
        const node = this.node();
        if (node) {
            return node.svDebugId();
        }
        return null;
    }

    /**
     * @description Gets the ID of the node.
     * @returns {string} The ID of the node, or "null" if there is no node.
     */
    nodeId () {
        const node = this.node();
        const nodeId = node ? node.svDebugId() : "null";
        return nodeId;
    }

    /**
     * @description Gets the debug type ID for this view.
     * @returns {string} The debug type ID.
     */
    svDebugId () {
        let s = "view:'" + this.svTypeId() + "'";
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

    nodeIsVisible () {
        const node = this.node();
        if (node) {
            return node.isVisible();
        }
        return false;
    }

}.initThisClass());
