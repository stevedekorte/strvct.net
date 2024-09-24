"use strict";

/**
 * @module library.view.webbrowser
 */

/**
 * @class ThrashDetector
 * @extends ProtoClass
 * @classdesc The ThrashDetector helps minimize DOM thrashing by warning when interleaving of read and write operations is detected.
 * 
 * The DOM can be slow if (layout dependent) read and (layout modifying) write operations are interleaved,
 * as the read will require a re-layout or "reflow" of the DOM rendering engine.
 *
 * When possible, it's best to do all read operations first, then do any write operations
 * as this allows for a single reflow of the DOM at the end of the frame.
 *
 * USE:
 *
 * When doing DOM Node reads, call:
 *
 *     ThrashDetector.shared().didRead("opName")
 *
 * and on DOM Node writes, call:
 *
 *     ThrashDetector.shared().didWrite("opName")
 *
 * NOTES:
 *
 * See:
 * What forces layout / reflow
 * https://gist.github.com/paulirish/5d52fb081b3570c81e3a
 */
(class ThrashDetector extends ProtoClass {
        
    static initClass () {
        this.setIsSingleton(true)
    }

    initPrototypeSlots () {
        /**
         * @property {Set} readOpSet - Set of read operations that can trigger a reflow
         */
        {
            const slot = this.newSlot("readOpSet", new Set([
                // on Elements
                "offsetTop", "offsetLeft", "offsetWidth", "offsetHeight", "offsetParent", // offset
                "scrollTop", "scrollLeft", "scrollWidth", "scrollHeight", // scroll
                "scrollBy", "scrollTo", "scrollIntoView", "scrollIntoViewIfNeeded", // scroll animations
                "clientTop", "clientLeft", "clientWidth", "clientHeight", // client
                "getComputedStyle", 
                "getClientRects", "getBoundingClientRect", // rects
                "computeRole", "computedName", "innerText",

                // on Window
                "scrollX", "scrollY", "innerHeight", "innerWidth", "visualViewPort", // window

                // on Document
                "scrollingElement", "elementFromPoint", // document

                // on Mouse Event
                "layerX", "layerY", "offsetX", "offsetY",

                // on SVG
                "computeCTM", "getBBox", "getCharNumAtPosition", "getComputedTextLength", 
                "getEndPositionOfChar", "getExtentOfChar", "getNumberOfChars", "getRotationOfChar", 
                "getStartPositionOfChar", "getSubStringLength", "selectSubString", "instanceRoot"
            ]));
            slot.setSlotType("Set");
        }

        /**
         * @property {Set} writeOpSet - Set of write operations that can trigger a reflow
         */
        {
            const slot = this.newSlot("writeOpSet", new Set([
                "focus",
                "appendChild",
                "atInsertElement",
                "removeChild",
                "className",
                "display",
                "position",
                "width",
                "height",
                "min-width",
                "min-height",
                "max-width",
                "max-height"
            ]));
            slot.setSlotType("Set");
        }

        /**
         * @property {Set} noReflowWriteOpSet - Set of write operations that do not trigger a reflow
         */
        {
            const slot = this.newSlot("noReflowWriteOpSet", new Set(
                "color",
                "backface-visibility",
                "background",
                "background-attachment",
                "background-blend-mode",
                "background-clip",
                "background-color",
                "background-image",
                "background-origin",
                "background-position",
                "background-repeat",
                "background-size",
                "border-left-color",
                "border-left-style",
                "border-radius",
                "border-right",
                "border-right-color",
                "border-right-style",
                "border-style",
                "border-top-color",
                "border-top-left-radius",
                "border-top-right-radius",
                "border-top-style",
                "caret-color",               
                "color",
                "filter",
                "outline-color",
                "scroll-behavior",
                "user-select"
            ));
            slot.setSlotType("Set");
        }

        /**
         * @property {Boolean} needsReflow - Indicates if a reflow is needed
         */
        {
            const slot = this.newSlot("needsReflow", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @property {Number} reflowCount - Count of reflows
         */
        {
            const slot = this.newSlot("reflowCount", false);
            slot.setSlotType("Number");
        }

        /**
         * @property {Array} triggers - Array of triggers that caused reflows
         */
        {
            const slot = this.newSlot("triggers", null);
            slot.setSlotType("Array");
        }

        /**
         * @property {String} lastWrite - The last write operation performed
         */
        {
            const slot = this.newSlot("lastWrite", null);
            slot.setSlotType("String");
        }

        /**
         * @property {Boolean} enabled - Indicates if the ThrashDetector is enabled
         */
        {
            const slot = this.newSlot("enabled", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Begins a new frame for thrash detection
     */
    beginFrame () {
        this.setNeedsReflow(false)
        this.setReflowCount(0)
        this.setTriggers([])
        this.setLastWrite(null)
    }

    /**
     * @description Records a read operation
     * @param {string} opName - The name of the read operation
     * @param {Object} optionalView - Optional view object
     * @returns {ThrashDetector} - Returns this ThrashDetector instance
     */
    didRead (opName, optionalView) {
        if (this.readOpSet().has(opName)) {
            if (this.needsReflow()) {
                this.setReflowCount(this.reflowCount() + 1);
                this.setNeedsReflow(false);
                let m = opName ;
                if (optionalView) {
                    m = optionalView.debugTypeId() + " get " + opName;
                }
                const s = this.lastWrite() + " -> " + m;
                this.triggers().push(s);
                this.onThrash();
            }
        } 
        return this;
    }

    /**
     * @description Records a write operation
     * @param {string} opName - The name of the write operation
     * @param {Object} optionalView - Optional view object
     * @returns {ThrashDetector} - Returns this ThrashDetector instance
     */
    didWrite (opName, optionalView) {
        if (!this.noReflowWriteOpSet().has(opName)) {
            this.setNeedsReflow(true)
            let m = opName 
            if (optionalView) {
                m = optionalView.debugTypeId() + " set " + opName
            }
            this.setLastWrite(m)
        }
        return this
    }

    /**
     * @description Handles thrash detection
     * @private
     */
    onThrash () {
        //console.log(this.type() + " reflowCount: ", this.reflowCount())
    }

    /**
     * @description Ends the current frame and logs thrash information if enabled
     */
    endFrame () {
        if (this.enabled() && this.reflowCount()) {
            console.log(">>> " +  this.type() + " reflowCount: ", this.reflowCount() + " triggers: ", JSON.stringify(this.triggers(), 2, 2))
        }
    }

 }.initThisClass());