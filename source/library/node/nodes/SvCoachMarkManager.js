/**
 * @module library.view.dom.DomView.subclasses.coachmarks
 */

"use strict";

/**
 * @class SvCoachMarkManager
 * @extends SvSummaryNode
 * @classdesc Manages coach marks throughout the application. Views can register with the manager
 * to provide contextual help. The manager coordinates display timing and prevents overlapping marks.
 * 
 * @example
 * // Basic usage - register a coach mark from any DomView subclass
 * this.setupCoachMark({
 *     label: "Click here to save your work",
 *     priority: 10
 * });
 * 
 * @example
 * // Advanced usage with custom id and condition
 * this.setupCoachMark({
 *     id: "character-stats-help",
 *     label: "Roll dice to generate your character's abilities",
 *     priority: 100, // Higher priority shows first
 *     condition: () => this.character().hasEmptyStats()
 * });
 * 
 * @example
 * // Direct registration with the manager
 * const manager = SvApp.shared().model().coachMarkManager();
 * manager.registerView({
 *     view: myDiceButton,
 *     id: "dice-roller",
 *     label: "Click to roll 3d6 for strength",
 *     priority: 50,
 *     condition: () => !this.hasRolledStrength()
 * });
 * 
 * @example
 * // Reset all coach marks (e.g., from a help menu)
 * const manager = SvApp.shared().model().coachMarkManager();
 * manager.resetShownCoachMarks();
 * 
 * @example
 * // Temporarily disable coach marks
 * manager.setIsEnabled(false);
 * 
 * @example
 * // Check if a specific coach mark has been shown
 * if (manager.shownCoachMarkIds().has("dice-roller")) {
 *     // User has already seen this tip
 * }
 */
(class SvCoachMarkManager extends SvSummaryNode {
    
    /**
     * @description Initializes the prototype slots for the SvCoachMarkManager
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {Map} registeredViews - Map of view id to coach mark configuration
             * @category Registration
             */
            const slot = this.newSlot("registeredViews", null);
            slot.setSlotType("Map");
        }
        
        {
            /**
             * @member {Set} shownCoachMarkIds - Set of coach mark ids that have been shown
             * @category State
             */
            const slot = this.newSlot("shownCoachMarkIds", null);
            slot.setSlotType("Set");
            slot.setShouldStoreSlot(true);
        }
        
        {
            /**
             * @member {SvCoachMarkView} activeCoachMark - Currently displayed coach mark
             * @category Display
             */
            const slot = this.newSlot("activeCoachMark", null);
            slot.setSlotType("SvCoachMarkView");
        }
        
        {
            /**
             * @member {Boolean} isEnabled - Whether coach marks are enabled
             * @category State
             */
            const slot = this.newSlot("isEnabled", true);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }
        
        {
            /**
             * @member {Array} coachMarkQueue - Queue of pending coach marks to show
             * @category Display
             */
            const slot = this.newSlot("coachMarkQueue", null);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Initializes the prototype settings
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Coach Marks");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Initializes the instance
     * @returns {SvCoachMarkManager} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setRegisteredViews(new Map());
        this.setShownCoachMarkIds(new Set());
        this.setCoachMarkQueue([]);
        return this;
    }

    /**
     * @description Registers a view with the coach mark manager
     * @param {Object} config - Configuration object with properties:
     *   - view: The target DomView instance
     *   - id: Unique identifier for this coach mark
     *   - label: Text to display in the coach mark
     *   - priority: Display priority (higher shows first)
     *   - condition: Optional function that returns true when mark should be shown
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Registration
     */
    registerView (config) {
        assert(config.view, "Coach mark config must include view");
        assert(config.id, "Coach mark config must include id");
        assert(config.label, "Coach mark config must include label");
        
        const defaults = {
            priority: 0,
            condition: () => true
        };
        
        const finalConfig = Object.assign({}, defaults, config);
        this.registeredViews().set(config.id, finalConfig);
        
        // Check if this coach mark should be shown
        this.checkCoachMark(config.id);
        
        return this;
    }

    /**
     * @description Unregisters a view from the coach mark manager
     * @param {String} id - The coach mark id to unregister
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Registration
     */
    unregisterView (id) {
        this.registeredViews().delete(id);
        
        // Remove from queue if present
        const queue = this.coachMarkQueue();
        const index = queue.findIndex(item => item.id === id);
        if (index !== -1) {
            queue.splice(index, 1);
        }
        
        return this;
    }

    /**
     * @description Checks if a coach mark should be shown
     * @param {String} id - The coach mark id to check
     * @returns {Boolean} True if the coach mark should be shown
     * @category Display
     */
    shouldShowCoachMark (id) {
        if (!this.isEnabled()) {
            return false;
        }
        
        if (this.shownCoachMarkIds().has(id)) {
            return false;
        }
        
        const config = this.registeredViews().get(id);
        if (!config) {
            return false;
        }
        
        if (!config.view.isInViewport()) {
            return false;
        }
        
        if (!config.condition()) {
            return false;
        }
        
        return true;
    }

    /**
     * @description Checks if a coach mark should be shown and queues it if so
     * @param {String} id - The coach mark id to check
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Display
     */
    checkCoachMark (id) {
        if (this.shouldShowCoachMark(id)) {
            this.queueCoachMark(id);
        }
        return this;
    }

    /**
     * @description Queues a coach mark for display
     * @param {String} id - The coach mark id to queue
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Display
     */
    queueCoachMark (id) {
        const config = this.registeredViews().get(id);
        if (!config) {
            return this;
        }
        
        // Don't queue if already queued
        if (this.coachMarkQueue().find(item => item.id === id)) {
            return this;
        }
        
        this.coachMarkQueue().push(config);
        
        // Sort by priority (highest first)
        this.coachMarkQueue().sort((a, b) => b.priority - a.priority);
        
        // Try to show next coach mark
        this.showNextCoachMark();
        
        return this;
    }

    /**
     * @description Shows the next coach mark in the queue
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Display
     */
    showNextCoachMark () {
        if (this.activeCoachMark()) {
            // Already showing a coach mark
            return this;
        }
        
        const queue = this.coachMarkQueue();
        if (queue.length === 0) {
            return this;
        }
        
        const config = queue.shift();
        
        // Double-check it should still be shown
        if (!this.shouldShowCoachMark(config.id)) {
            // Try next one
            this.showNextCoachMark();
            return this;
        }
        
        // Create and show the coach mark
        const coachMark = SvCoachMarkView.clone();
        coachMark.setLabel(config.label);
        coachMark.setTargetView(config.view);
        
        // Set up close handler
        const originalOnTapComplete = coachMark.onTapComplete.bind(coachMark);
        coachMark.onTapComplete = (gesture) => {
            originalOnTapComplete(gesture);
            this.onCoachMarkClosed(config.id);
            return false;
        };
        
        this.setActiveCoachMark(coachMark);
        coachMark.open();
        
        // Mark as shown
        this.shownCoachMarkIds().add(config.id);
        
        return this;
    }

    /**
     * @description Handles coach mark closure
     * @param {String} id - The id of the closed coach mark
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Display
     */
    onCoachMarkClosed (/*id*/) {
        this.setActiveCoachMark(null);
        
        // Show next coach mark after a short delay
        setTimeout(() => {
            this.showNextCoachMark();
        }, 500);
        
        return this;
    }

    /**
     * @description Resets all shown coach marks
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category State
     */
    resetShownCoachMarks () {
        this.shownCoachMarkIds().clear();
        
        // Re-check all registered views
        this.registeredViews().forEach((config, id) => {
            this.checkCoachMark(id);
        });
        
        return this;
    }

    /**
     * @description Checks all registered coach marks for display
     * @returns {SvCoachMarkManager} The instance for chaining
     * @category Display
     */
    checkAllCoachMarks () {
        this.registeredViews().forEach((config, id) => {
            this.checkCoachMark(id);
        });
        return this;
    }
    
}.initThisClass());