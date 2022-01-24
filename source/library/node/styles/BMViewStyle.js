"use strict";

/*

    BMViewStyle

    Representation of a single style state (a example of a state is "selected").

    See BMViewStyles for docs.
 
*/

(class BMViewStyle extends ProtoClass {
  
    static styleNames () {
        return  [
            "color", 
            "backgroundColor", 
            "opacity", 

            "borderLeft", 
            "borderRight", 
            "borderTop", 
            "borderBottom",

            "borderWidth", 
            "borderColor", 
            "borderRadius",

            "fontFamily",
            "fontWeight",
            "fontSize",
            "lineHeight",
            "letterSpacing",
        ]
    }

    initPrototype () {
        this.newSlot("name", "")

        // use same names as css style, nulls aren't applied
        const styleNames = this.thisClass().styleNames()
        this.newSlot("styleNames", styleNames)
        styleNames.forEach(k => this.newSlot(k, null))
    }

    init () {
        super.init()
        return this
    }

    isEmpty () {
        return this.styleNames().detect(s => s != null) === null
    }

    description () {
        const parts = []
		
        this.styleNames().forEach( (name) => { 
            const v = this[name].apply(this)
            if (!Type.isNull(v)) {
                parts.push(name + ":" + v)
            }
        })	
		
        return "{" + parts.join(", ") + "}"	
    }
	
    copyFrom (aViewStyle, copyDict) {
        aViewStyle.applyToView(this) // we're not a view but this works since we use the same methods/protocol
        return this
    }
	
    applyToView (aView) {		
        this.styleNames().forEach( (name) => { 
            const getterMethod = this[name]
            if (!getterMethod) {
                const errorMsg = "missing getter method: " + this.type() + "." + name + "()"
                console.warn(errorMsg)
                throw new Error(errorMsg)
            }
            const v = getterMethod.apply(this)
            if (v != null) {
                aView[aView.setterNameForSlot(name)].apply(aView, [v])
            }
        })
		
        return this
    }
    
}.initThisClass())
