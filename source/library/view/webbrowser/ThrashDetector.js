"use strict";

/*

    ThrashDetector

    The DOM can be slow if (layout dependent) read and (layout modifying) write operations are interleaved,
    as the read will require a re-layout or "reflow" of the DOM rendering engine.

    This detector helps minimize this issue by warning when interleaving is detected.

    When possible, it's best to do all read operations first, then do any write operations
    as this allows for a single reflow of the DOM at the end of the frame.

    USE:

    When doing DOM Node reads, call:

        ThrashDetector.shared().didRead("opName")

    and on DOM Node writes, call:

        ThrashDetector.shared().didWrite("opName")

    NOTES:

    See:
    What forces layout / reflow
    https://gist.github.com/paulirish/5d52fb081b3570c81e3a

    All style properties:
    this.newSlot("styleProperties", new Set(
                "color",
                "border",
                "margin",
                "font-style",
                "transform",
                "background-color",
                "align-content",
                "align-items",
                "align-self",
                "all",
                "animation",
                "animation-delay",
                "animation-direction",
                "animation-duration",
                "animation-fill-mode",
                "animation-iteration-count",
                "animation-name",
                "animation-play-state",
                "animation-timing-function",
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
                "border",
                "border-bottom",
                "border-bottom-color",
                "border-bottom-left-radius",
                "border-bottom-right-radius",
                "border-bottom-style",
                "border-bottom-width",
                "border-collapse",
                "border-color",
                "border-image",
                "border-image-outset",
                "border-image-repeat",
                "border-image-slice",
                "border-image-source",
                "border-image-width",
                "border-left",
                "border-left-color",
                "border-left-style",
                "border-left-width",
                "border-radius",
                "border-right",
                "border-right-color",
                "border-right-style",
                "border-right-width",
                "border-spacing",
                "border-style",
                "border-top",
                "border-top-color",
                "border-top-left-radius",
                "border-top-right-radius",
                "border-top-style",
                "border-top-width",
                "border-width",
                "bottom",
                "box-shadow",
                "box-sizing",
                "caption-side",
                "caret-color",
                "@charset",
                "clear",
                "clip",
                "clip-path",
                "color",
                "column-count",
                "column-fill",
                "column-gap",
                "column-rule",
                "column-rule-color",
                "column-rule-style",
                "column-rule-width",
                "column-span",
                "column-width",
                "columns",
                "content",
                "counter-increment",
                "counter-reset",
                "cursor",
                "direction",
                "display",
                "empty-cells",
                "filter",
                "flex",
                "flex-basis",
                "flex-direction",
                "flex-flow",
                "flex-grow",
                "flex-shrink",
                "flex-wrap",
                "float",
                "font",
                "@font-face",
                "font-family",
                "font-kerning",
                "font-size",
                "font-size-adjust",
                "font-stretch",
                "font-style",
                "font-variant",
                "font-weight",
                "grid",
                "grid-area",
                "grid-auto-columns",
                "grid-auto-flow",
                "grid-auto-rows",
                "grid-column",
                "grid-column-end",
                "grid-column-gap",
                "grid-column-start",
                "grid-gap",
                "grid-row",
                "grid-row-end",
                "grid-row-gap",
                "grid-row-start",
                "grid-template",
                "grid-template-areas",
                "grid-template-columns",
                "grid-template-rows",
                "height",
                "hyphens",
                "@import",
                "justify-content",
                "@keyframes",
                "left",
                "letter-spacing",
                "line-height",
                "list-style",
                "list-style-image",
                "list-style-position",
                "list-style-type",
                "margin",
                "margin-bottom",
                "margin-left",
                "margin-right",
                "margin-top",
                "max-height",
                "max-width",
                "@media",
                "min-height",
                "min-width",
                "object-fit",
                "object-position",
                "opacity",
                "order",
                "outline",
                "outline-color",
                "outline-offset",
                "outline-style",
                "outline-width",
                "overflow",
                "overflow-x",
                "overflow-y",
                "padding",
                "padding-bottom",
                "padding-left",
                "padding-right",
                "padding-top",
                "page-break-after",
                "page-break-before",
                "page-break-inside",
                "perspective",
                "perspective-origin",
                "pointer-events",
                "position",
                "quotes",
                "right",
                "scroll-behavior",
                "table-layout",
                "text-align",
                "text-align-last",
                "text-decoration",
                "text-decoration-color",
                "text-decoration-line",
                "text-decoration-style",
                "text-indent",
                "text-justify",
                "text-overflow",
                "text-shadow",
                "text-transform",
                "top",
                "transform",
                "transform-origin",
                "transform-style",
                "transition",
                "transition-delay",
                "transition-duration",
                "transition-property",
                "transition-timing-function",
                "user-select",
                "vertical-align",
                "visibility",
                "white-space",
                "width",
                "word-break",
                "word-spacing",
                "word-wrap",
                "writing-mode",
                "z-index"
        ))
        
*/

(class ThrashDetector extends ProtoClass {
        
    static initClass () {
        this.setIsSingleton(true)
		return this
    }

    initPrototypeSlots () {

        /*
        this.newSlot("writeStyleProperties", new Set([
                "border",
                "margin",
                "font-style",
                "transform",
                "align-content",
                "align-items",
                "align-self",
                "all",
                "border",
                "border-bottom",
                "border-bottom-color",
                "border-bottom-left-radius",
                "border-bottom-right-radius",
                "border-bottom-style",
                "border-bottom-width",
                "border-collapse",
                "border-color",
                "border-image",
                "border-image-outset",
                "border-image-repeat",
                "border-image-slice",
                "border-image-source",
                "border-image-width",
                "border-left",
                "border-left-color",
                "border-left-style",
                "border-left-width",
                "border-radius",
                "border-right",
                "border-right-color",
                "border-right-style",
                "border-right-width",
                "border-spacing",
                "border-style",
                "border-top",
                "border-top-color",
                "border-top-left-radius",
                "border-top-right-radius",
                "border-top-style",
                "border-top-width",
                "border-width",
                "bottom",
                "box-shadow",
                "box-sizing",
                "caption-side",
                "@charset",
                "clear",
                "clip",
                "clip-path",
                "column-count",
                "column-fill",
                "column-gap",
                "column-rule",
                "column-rule-color",
                "column-rule-style",
                "column-rule-width",
                "column-span",
                "column-width",
                "columns",
                "content",
                "counter-increment",
                "counter-reset",
                "direction",
                "display",
                "empty-cells",
                "flex",
                "flex-basis",
                "flex-direction",
                "flex-flow",
                "flex-grow",
                "flex-shrink",
                "flex-wrap",
                "float",
                "font",
                "@font-face",
                "font-family",
                "font-kerning",
                "font-size",
                "font-size-adjust",
                "font-stretch",
                "font-style",
                "font-variant",
                "font-weight",
                "grid",
                "grid-area",
                "grid-auto-columns",
                "grid-auto-flow",
                "grid-auto-rows",
                "grid-column",
                "grid-column-end",
                "grid-column-gap",
                "grid-column-start",
                "grid-gap",
                "grid-row",
                "grid-row-end",
                "grid-row-gap",
                "grid-row-start",
                "grid-template",
                "grid-template-areas",
                "grid-template-columns",
                "grid-template-rows",
                "height",
                "hyphens",
                "@import",
                "justify-content",
                "@keyframes",
                "left",
                "letter-spacing",
                "line-height",
                "list-style",
                "list-style-image",
                "list-style-position",
                "list-style-type",
                "margin",
                "margin-bottom",
                "margin-left",
                "margin-right",
                "margin-top",
                "max-height",
                "max-width",
                "@media",
                "min-height",
                "min-width",
                "object-fit",
                "object-position",
                "opacity",
                "order",
                "outline",
                "outline-color",
                "outline-offset",
                "outline-style",
                "outline-width",
                "overflow",
                "overflow-x",
                "overflow-y",
                "padding",
                "padding-bottom",
                "padding-left",
                "padding-right",
                "padding-top",
                "page-break-after",
                "page-break-before",
                "page-break-inside",
                "perspective",
                "perspective-origin",
                "pointer-events",
                "position",
                "quotes",
                "right",
                "scroll-behavior",
                "table-layout",
                "text-align",
                "text-align-last",
                "text-decoration",
                "text-decoration-color",
                "text-decoration-line",
                "text-decoration-style",
                "text-indent",
                "text-justify",
                "text-overflow",
                "text-shadow",
                "text-transform",
                "top",
                "transform",
                "transform-origin",
                "transform-style",
                "transition",
                "transition-delay",
                "transition-duration",
                "transition-property",
                "transition-timing-function",
                "user-select",
                "vertical-align",
                "visibility",
                "white-space",
                "width",
                "word-break",
                "word-spacing",
                "word-wrap",
                "writing-mode",
                "z-index"
        ]))
        */
        
        this.newSlot("readOpSet", new Set([
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
            //"getComputedStyle", 

            // on Document
            "scrollingElement", "elementFromPoint", // document

            /*
            // on Forms
            "focus", "select", // on inputElement
            "select" // on textAreaElement
            */

            // on Mouse Event
            "layerX", "layerY", "offsetX", "offsetY",

            // on Range
            //"getClientRects", "getBoundingClientRect", // rects

            // on SVG

            "computeCTM", "getBBox", "getCharNumAtPosition", "getComputedTextLength", 
            "getEndPositionOfChar", "getExtentOfChar", "getNumberOfChars", "getRotationOfChar", 
            "getStartPositionOfChar", "getSubStringLength", "selectSubString", "instanceRoot"
        ]))

        this.newSlot("writeOpSet", new Set([
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
        ]))

        this.newSlot("noReflowWriteOpSet", new Set(
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
        ))

        this.newSlot("needsReflow", false)
        this.newSlot("reflowCount", false)
        this.newSlot("triggers", null)
        this.newSlot("lastWrite", null)
    }

    /*
    init () {
        super.init() 
        return this
    }
    */

    beginFrame () {
        //console.log("--- new frame ---")
        this.setNeedsReflow(false)
        this.setReflowCount(0)
        this.setTriggers([])
        this.setLastWrite(null)
    }

    didRead (opName, optionalView) {
        if (this.readOpSet().has(opName)) {
            //console.log(this.type() + ".didRead('" + opName + "')")
            if (this.needsReflow()) {
                this.setReflowCount(this.reflowCount() + 1)
                this.setNeedsReflow(false)
                let m = opName 
                if (optionalView) {
                    m = optionalView.debugTypeId() + " get " + opName
                }
                this.triggers().push(this.lastWrite() + " -> " + m)
                this.onThrash()
            }
        } 
        return this
    }

    didWrite (opName, optionalView) {
        if (!this.noReflowWriteOpSet().has(opName)) {
        //if (true || this.writeOpSet().has(opName)) {
            //console.log(this.type() + ".didWrite('" + opName + "')")
            this.setNeedsReflow(true)
            let m = opName 
            if (optionalView) {
                m = optionalView.debugTypeId() + " set " + opName
            }
            this.setLastWrite(m)
        //}
        }
        return this
    }

    onThrash () {
        //console.log(this.type() + " reflowCount: ", this.reflowCount())
    }

    endFrame () {
        if (this.reflowCount()) {
            console.log(">>> " +  this.type() + " reflowCount: ", this.reflowCount() + " triggers: ", JSON.stringify(this.triggers(), 2, 2))
        }
    }

    
 }.initThisClass());
