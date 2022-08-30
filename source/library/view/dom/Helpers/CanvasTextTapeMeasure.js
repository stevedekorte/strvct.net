"use strict";

/*

    CanvasTextTapeMeasure

    Used to measure rendered text dimensions given a string and a style.
    
    Example uses:

            const width = CanvasTextTapeMeasure.shared().getTextWidth(text, fontString);

*/

(class CanvasTextTapeMeasure extends ProtoClass {
    
    initPrototypeSlots () {
        //this.newSlot("cache", new Map())
        this.newSlot("canvas", null)
        this.newSlot("context", null)
    }
	
    init () {
        super.init()
        this.setCanvas(document.createElement("canvas"))
        this.setContext(canvas.getContext("2d"))
        return this
    }

    getTextWidth (text, fontString) {
        //font The css font descriptor that text is to be rendered with (e.g. "14px verdana").
        const context = this.context()
        context.font = fontString;
        const metrics = context.measureText(text)
        return metrics.width
    }       

    static selfTest () {
        const tape = CanvasTextTapeMeasure.clone()
        const w = tape.getTextWidth("hello there!", "bold 12pt arial");
        assert(Math.round(w) === 86)
        //console.log(getTextWidth("hello there!", "bold 12pt arial"));  // close to 86
        return this	
    }
	
}.initThisClass());

CanvasTextTapeMeasure.selfTest()

