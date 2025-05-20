"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile
 * @class BMTextNodeTile
 * @extends Tile
 * @classdesc BMTextNodeTile represents a tile for displaying and editing text nodes.
 */

(class BMTextNodeTile extends Tile {
    
    /**
     * Initializes the prototype slots for the BMTextNodeTile.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {TextField} textView - The text view for displaying and editing text.
             * @category UI Components
             */
            const slot = this.newSlot("textView", null);
            slot.setSlotType("TextField");
        }
    }

    /**
     * Initializes the BMTextNodeTile.
     * @returns {BMTextNodeTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()

        const cv = this.contentView()
        cv.setMinHeight("1em")

        const tv = TextField.clone()
        this.setTextView(tv)
        this.contentView().addSubview(tv)

        tv.setDisplay("flex")
        //tv.setFlex("10")
        tv.setAlignItems("flex-start") // alignment in direction of flex
        tv.setJustifyContent("center") // alignment perpendicutal to flex
        tv.setFlexDirection("column")
        tv.setWidth("100%")
        tv.setMinHeight("1em")
        tv.setIsEditable(true)

        tv.setUsesDoubleTapToEdit(true)
        tv.setOverflow("visible")

        this.updateSubviews()
        this.setIsSelectable(true)
        return this
    }
    
    // ---

    /**
     * Calculates the desired width of the tile.
     * @returns {number} The desired width.
     * @category Layout
     */
    desiredWidth () {
        return this.calcWidth()
    }

    // --- edit ---

    /**
     * Handles input events.
     * @category Event Handling
     */
    didInput () {
        this.scheduleSyncToNode();
    }

    // --- sync ---

    /**
     * Synchronizes the tile's content to the node.
     * @returns {BMTextNodeTile} The current instance.
     * @category Data Synchronization
     */
    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setValue(this.textView().innerText())
        return this
    }
    
    /**
     * Synchronizes the tile's content from the node.
     * @returns {BMTextNodeTile} The current instance.
     * @category Data Synchronization
     */
    syncFromNode () {
        const node = this.node()
        if (!node) {
            return 
        }
        
        this.textView().setString(node.value())

        this.applyStyles()
        return this
    }

    /**
     * Applies styles to the tile.
     * @returns {BMTextNodeTile} The current instance.
     * @category Styling
     */
    applyStyles () {
        console.log(this.type() + " themeClassName ", this.node().themeClassName())
        super.applyStyles()
        return this
    }

}.initThisClass());