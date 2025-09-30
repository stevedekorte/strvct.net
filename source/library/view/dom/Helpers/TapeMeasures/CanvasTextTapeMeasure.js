/**
 * @module library.view.dom.Helpers.TapeMeasures
 */

/**
 * @class CanvasTextTapeMeasure
 * @extends ProtoClass
 * @classdesc Used to measure rendered text dimensions given a string and a style.
 *
 * Example uses:
 *
 *     const width = CanvasTextTapeMeasure.shared().getTextWidth(text, fontString);
 */
(class CanvasTextTapeMeasure extends ProtoClass {

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("cache", new Map());
            slot.setSlotType("Map");
        }
        */
        /**
         * @member {Element} canvas - The canvas element used for measuring text.
         * @category Rendering
         */
        {
            const slot = this.newSlot("canvas", null);
            slot.setSlotType("Element");
        }
        /**
         * @member {CanvasRenderingContext2D} context - The 2D rendering context of the canvas.
         * @category Rendering
         */
        {
            const slot = this.newSlot("context", null);
            slot.setSlotType("CanvasRenderingContext2D");
        }
    }

    /**
     * @description Initializes the CanvasTextTapeMeasure instance.
     * @returns {CanvasTextTapeMeasure} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setCanvas(document.createElement("canvas"));
        this.setContext(this.canvas().getContext("2d"));
        return this;
    }

    /**
     * @description Measures the width of the given text with the specified font.
     * @param {string} text - The text to measure.
     * @param {string} fontString - The css font descriptor that text is to be rendered with (e.g. "14px verdana").
     * @returns {number} The width of the text.
     * @category Measurement
     */
    getTextWidth (text, fontString) {
        const context = this.context();
        context.font = fontString;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    /**
     * @static
     * @description Performs a self-test of the CanvasTextTapeMeasure class.
     * @returns {CanvasTextTapeMeasure} The class itself.
     * @category Testing
     */
    static selfTest () {
        const tape = CanvasTextTapeMeasure.clone();
        const w = tape.getTextWidth("hello there!", "bold 12pt arial");
        assert(Math.round(w) === 86);
        return this;
    }

}.initThisClass());

//CanvasTextTapeMeasure.selfTest()
