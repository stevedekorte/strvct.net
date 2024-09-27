/**
 * @module library.node.fields.subclasses.date
 */

"use strict";

/**
 * @class BMYearNode
 * @extends BaseNode
 * @classdesc Represents a year node in a date-related structure.
 */
(class BMYearNode extends BaseNode {
    
    /**
     * @description Initializes the prototype slots for the BMYearNode.
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} allowsMultiplePicks - Indicates if multiple picks are allowed.
         */
        {
            const slot = this.newSlot("allowsMultiplePicks", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Number} value - The numeric value representing the year.
         */
        {
            const slot = this.newSlot("value", 0);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     */
    initPrototype () {
        this.setCanDelete(true);
        this.setNodeCanEditTitle(true);
        this.setSubnodeProto(BMOptionNode);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
     * @description Returns the title of the node, which is the year value.
     * @returns {Number} The year value.
     */
    title () {
        return this.value();
    }

    /**
     * @description Checks if the node has subnodes.
     * @returns {Boolean} Always returns true.
     */
    hasSubnodes () {
        return true;
    }
    
    /**
     * @description Prepares the node for access, potentially refreshing subnodes.
     */
    prepareToAccess () {
        if (this.subnodeCount() === 0) {
            //this.refreshSubnodes();
        }
    }
    
    /**
     * @description Returns the node to be used as a link in tile views.
     * @returns {BMYearNode} The current node instance.
     */
    nodeTileLink () {
        return this;
    }

    /**
     * @description Prepares the node to sync to view, creating month subnodes if necessary.
     */
    prepareToSyncToView () {
        if (!this.subnodeCount()) {
            for (let i = 1; i < 12 + 1; i++) {
                const month = this.addSubnode(BMMonthNode.clone().setValue(i));
                month.setCanDelete(false);
            }
        }
    }
    
}.initThisClass());