/**
 * @module library.node.node_views
 */

"use strict";

/**
 * @class SvCoachableView
 * @extends NodeView
 * @classdesc Adds coach mark support to NodeView. Views can register themselves with the
 * coach mark manager to provide contextual help to users.
 * 
 * NOTES: At first, we'll stick to just supporting one coach mark at the view level.
 * 
 * e.g. A TileView whose node has canDelete() = true, might register a coach mark.
 * 
 * syncFromNode() {
 *   ...
 *   this.registerForCoachMark();
 * }
 * 
 * registerForCoachMark () {
 *   if (this.canDelete()) {
 *     const cm = this.coachMarkManager();
 *     const id = "TileView-canDelete";
 *     if (!cm.hasRegisteredCoachMark(id)) {
 *       cm.registerCoachMarkDict({
 *         id: id, 
 *         label: "You can delete this by left dragging it."
 *       });
 *     }
 *   }
 * }
 * 
 */

(class SvCoachableView extends NodeView {
    
    /**
     * @description Initializes the prototype slots for the SvCoachableView
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {String} coachMarkId - Unique identifier for this view's coach mark
             * @category Coach Mark
             */
            const slot = this.newSlot("coachMarkId", null);
            slot.setSlotType("String");
        }
        
        {
            /**
             * @member {String} coachMarkLabel - Text to display in the coach mark
             * @category Coach Mark
             */
            const slot = this.newSlot("coachMarkLabel", null);
            slot.setSlotType("String");
        }
        
        {
            /**
             * @member {Number} coachMarkPriority - Display priority (higher shows first)
             * @category Coach Mark
             */
            const slot = this.newSlot("coachMarkPriority", 0);
            slot.setSlotType("Number");
        }
        
        {
            /**
             * @member {Function} coachMarkCondition - Function that returns true when mark should be shown
             * @category Coach Mark
             */
            const slot = this.newSlot("coachMarkCondition", null);
            slot.setSlotType("Function");
        }
        
        {
            /**
             * @member {Boolean} isRegisteredForCoachMark - Whether this view is registered with the manager
             * @category Coach Mark
             */
            const slot = this.newSlot("isRegisteredForCoachMark", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Gets the coach mark manager from the model
     * @returns {SvCoachMarkManager|null} The coach mark manager instance
     * @category Coach Mark
     */
    coachMarkManager () {
        const app = SvApp.shared();
        if (app && app.model && app.model()) {
            return app.model().coachMarkManager();
        }
        return null;
    }

    /**
     * @description Sets up a coach mark for this view
     * @param {Object} config - Configuration object with properties:
     *   - id: Unique identifier (defaults to view's type id)
     *   - label: Text to display
     *   - priority: Display priority (optional)
     *   - condition: Function that returns true when mark should be shown (optional)
     * @returns {SvCoachableView} The instance for chaining
     * @category Coach Mark
     */
    setupCoachMark (config) {
        assert(config.label, "Coach mark config must include label");
        
        // Use provided id or generate one based on view type
        const id = config.id || this.typeId();
        
        this.setCoachMarkId(id);
        this.setCoachMarkLabel(config.label);
        
        if (config.priority !== undefined) {
            this.setCoachMarkPriority(config.priority);
        }
        
        if (config.condition) {
            this.setCoachMarkCondition(config.condition);
        }
        
        // Register with manager if available
        this.registerForCoachMark();
        
        return this;
    }

    /**
     * @description Registers this view with the coach mark manager
     * @returns {SvCoachableView} The instance for chaining
     * @category Coach Mark
     */
    registerForCoachMark () {
        if (this.isRegisteredForCoachMark()) {
            return this;
        }
        
        const manager = this.coachMarkManager();
        if (!manager) {
            // Manager not available yet, try again later
            this.addTimeout(() => this.registerForCoachMark(), 100);
            return this;
        }
        
        if (!this.coachMarkId() || !this.coachMarkLabel()) {
            // Not configured for coach marks
            return this;
        }
        
        const config = {
            view: this,
            id: this.coachMarkId(),
            label: this.coachMarkLabel(),
            priority: this.coachMarkPriority()
        };
        
        if (this.coachMarkCondition()) {
            config.condition = this.coachMarkCondition();
        }
        
        manager.registerView(config);
        this.setIsRegisteredForCoachMark(true);
        
        return this;
    }

    /**
     * @description Unregisters this view from the coach mark manager
     * @returns {SvCoachableView} The instance for chaining
     * @category Coach Mark
     */
    unregisterForCoachMark () {
        if (!this.isRegisteredForCoachMark()) {
            return this;
        }
        
        const manager = this.coachMarkManager();
        if (manager && this.coachMarkId()) {
            manager.unregisterView(this.coachMarkId());
        }
        
        this.setIsRegisteredForCoachMark(false);
        
        return this;
    }

    /**
     * @description Called when the view becomes visible - checks if coach mark should be shown
     * @returns {SvCoachableView} The instance for chaining
     * @category Visibility
     */
    onVisibility () {
        super.onVisibility();
        
        // When view becomes visible, check if its coach mark should be shown
        if (this.isRegisteredForCoachMark()) {
            const manager = this.coachMarkManager();
            if (manager && this.coachMarkId()) {
                manager.checkCoachMark(this.coachMarkId());
            }
        }
        
        return this;
    }

    /**
     * @description Cleanup when view is removed
     * @returns {SvCoachableView} The instance for chaining
     * @category Lifecycle
     */
    willRemove () {
        this.unregisterForCoachMark();
        return super.willRemove();
    }
    
}.initThisClass());