"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile.subviews
 * @class TileNoteView
 * @extends SvTextView
 * @classdesc TileNoteView is a specialized SvTextView for displaying notes in a Tile.
 */
(class TileNoteView extends SvTextView {

    initPrototypeSlots () {
    }

    initPrototype () {
    }

    /**
     * @description Initializes the TileNoteView with specific styling.
     * @returns {TileNoteView} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setFontSize("80%");
        this.setFontWeight("normal");
        this.setWhiteSpace("nowrap");
        this.setTextAlign("right");
        this.setTextOverflow("ellipsis");
        return this;
    } 
    
    /**
     * @description Sets the background color of the TileNoteView to transparent.
     * @param {string} s - The color string (ignored in this implementation).
     * @returns {TileNoteView} The current instance.
     * @category Styling
     */
    setBackgroundColor (/*s*/) { // HACK to avoid theme colors 
        super.setBackgroundColor("tranparent");
        return this;
    }

    setRealBackgroundColor (s) {
        super.setBackgroundColor(s);
        return this;
    }

    /**
     * @description Sets the transition for the TileNoteView.
     * @param {string} s - The transition string.
     * @returns {*} The result of the super class's setTransition method.
     * @category Animation
     */
    setTransition (s) {
        
        return super.setTransition(s);
    }

    onClick (/*event*/) {
        
        return this;
    }

}.initThisClass());