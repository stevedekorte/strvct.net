/**
 * @module library.node.node_views.browser.stack.Tile
 * @class BMTextNodeTile
 * @extends Tile
 * @classdesc BMTextNodeTile represents a tile for displaying and editing text nodes.
 */
"use strict";

(class BMTextNodeTile extends Tile {
    
    /**
     * Initializes the prototype slots for the BMTextNodeTile.
     * @method
     */
    initPrototypeSlots () {
        {
            /**
             * @property {TextField} textView - The text view for displaying and editing text.
             */
            const slot = this.newSlot("textView", null);
            slot.setSlotType("TextField");
        }
    }

    /**
     * Initializes the BMTextNodeTile.
     * @method
     * @returns {BMTextNodeTile} The initialized instance.
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
     * @method
     * @returns {number} The desired width.
     */
    desiredWidth () {
        return this.calcWidth()
    }

    // --- edit ---

    /**
     * Handles input events.
     * @method
     */
    didInput () {
        this.scheduleSyncToNode();
    }

    // --- sync ---

    /**
     * Synchronizes the tile's content to the node.
     * @method
     * @returns {BMTextNodeTile} The current instance.
     */
    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setValue(this.textView().innerText())
        return this
    }
    
    /**
     * Synchronizes the tile's content from the node.
     * @method
     * @returns {BMTextNodeTile} The current instance.
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
     * @method
     * @returns {BMTextNodeTile} The current instance.
     */
    applyStyles () {
        console.log(this.type() + " themeClassName ", this.node().themeClassName())
        super.applyStyles()
        return this
    }

}.initThisClass());