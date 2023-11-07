"use strict";

/*
    CssDomView

    CSS related state and behavior.

*/

(class CssDomView extends ElementDomView {
    
    initPrototypeSlots () {
        // css hidden values
        this.newSlot("hiddenDisplayValue", undefined)
        /*
        this.newSlot("hiddenMinHeight", undefined)
        this.newSlot("hiddenMaxHeight", undefined)
        */
        this.newSlot("hiddenTransitionValue", undefined)
        //this.newSlot("pushedAttributes", undefined)
        this.newSlot("pushedSlotValues", undefined)
        this.newSlot("cachedSize", null)
    }

    
    init () {
        super.init()
        //this.setDisplay("block")
        return this
    }

    // --- push/pop slot values ---
    // useful for pushing a css attribute using it's normal getter/setter methods

    pushedSlotValues () {
        if (Type.isUndefined(this._pushedSlotValues)) {
            this._pushedSlotValues = new Map()
        }
        return this._pushedSlotValues
    }

    pushedSlotValuesAt (slotName) {
        const p = this.pushedSlotValues()
        if (!p.has(slotName)) {
            p.set(slotName, [])
        }
        return p.get(slotName)
    }

    pushSlotValue (slotName, newValue) {
        const stack = this.pushedSlotValuesAt(slotName)
        const oldValue = this[slotName].apply(this)
        stack.push(oldValue)
        const setterName = "set" + slotName.capitalized()
        this[setterName].call(this, newValue)
        return this
    }

    popSlotValue (slotName) {
        const a = this.pushedSlotValuesAt(slotName)
        if (a.length === 0) {
            throw new Error("attempt to pop empty slot value stack")
        }
        const oldValue = a.pop()
        const setterName = "set" + slotName.capitalized()
        this[setterName].call(this, oldValue)
        return this
    }

    /*
    // --- push and pop attribute stacks ---

    pushedAttributes () {
        if (Type.isUndefined(this._pushedAttributes)) {
            this._pushedAttributes = new Map()
        }
        return this._pushedAttributes
    }

    pushedAttributesAt (name) {
        const p = this.pushedAttributes()
        if (!p.has(name)) {
            p.set(name, [])
        }
        return p.get(name)
    }

    pushAttribute (name, newValue) {
        const stack = this.pushedAttributesAt(name)
        const oldValue = this.getCssProperty(name)
        stack.push(oldValue)
        this.setCssProperty(name, newValue) // NOTE: bypasses css change callbacks
        return this
    }

    popAttribute (name) {
        const a = this.pushedAttributesAt(name)
        if (a.length === 0) {
            throw new Error("attempt to pop empty css attribute stack")
        }
        const oldValue = a.pop()
        this.setCssProperty(name, oldValue) // NOTE: bypasses css change callbacks
        return this
    }
    */

    // ------------------------------
    
    /*    
    applyCSS (ruleName) {
        if (ruleName == null) { 
            ruleName = this.elementClassName()
        }
        CSS.ruleAt(ruleName).applyToElement(this.element())
        return this
    }
    */

    stylesheetWithClassName (className) {
        for (let i = 0; i < document.styleSheets.length; i++) {
            const stylesheet = document.styleSheets[i]

            if ("cssRules" in stylesheet) {
                try {
                    const rules = stylesheet.cssRules
                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j]
                        const ruleClassName = rule.selectorText.split(" ")[0]
                        console.log("rule.selectorText: ", rule.selectorText)
                        if (ruleClassName === className) {
                            return stylesheet
                        }
                    }
                } catch (e) {
                    //console.log("couldn't add CSS rule: " + rule + "")
                }
            }
        }
        return null
    }

    setCssDict (aDict) {
        Reflect.ownKeys(aDict).forEach((k) => {
            const v = aDict[k]
            this.setCssProperty(k, v)
        })
        return this
    }

    // --- attributes ---

    setAttribute (k, v) {
        //ThrashDetector.shared().didWrite(k, this)
        this.element().setAttribute(k, v)
        return this
    }

    getAttribute (k) {
        this.didDomRead(k, this)
        const v = this.element().getAttribute(k)
        if (v === null) {
            let result = this.element()[k]
            assert(result !== null)
            //console.log("getAttribute('" + k + "') = ", v)
            //console.log("element['" + k + "'] = ", result)
            //console.log("-----------------------> getAttribute '" + k + "' ", result) 
            //throw new Error("move this to another method")
            return result
        }
        return v
    }

    removeAttribute (k) {
        if (this.element().hasAttribute(k)) {
            //ThrashDetector.shared().didWrite(k, this)
            this.element().removeAttribute(k)
        }
        return this
    }

    // --- css properties ---

    setSpecialCssProperty (k, newValue) {
        //ThrashDetector.shared().didWrite(k, this)

        assert(k[0] === "-" && !k.beginsWith("--")) // sanity check

        this.cssStyle()[k] = newValue
        return this
    }

    getSpecialCssProperty (k) {
        this.didDomRead(k)

        assert(k[0] === "-" && !k.beginsWith("--")) // sanity check

        return this.cssStyle()[k]
    }

    removeCssProperty (k) {
        //ThrashDetector.shared().didWrite(k, this)
        this.element().style.removeProperty(k)
        return this
    }

    setCssProperty (key, newValue, didChangeCallbackFunc) {

        // sanity checks
        assert(Type.isString(key))

        if (key[0] === "-" && key[1] !== "-") { // no dash, and double dash are ok
            throw new Error("use setSpecialCssProperty for single dash options")
            //this.setSpecialCssProperty(key, newValue)
            //return this
        }

        const style = this.cssStyle()
        const doesSanityCheck = false
        //const oldValue = style.getPropertyValue(key)

        //if (String(oldValue) !== String(newValue)) {
        if (true) {
                if (newValue == null) {
                this.removeCssProperty(key)
            } else {
                //style[key] = newValue
                style.setProperty(key, newValue)
                //ThrashDetector.shared().didWrite(key, this)

                /*
                if (doesSanityCheck) {
                    // sanity check the result
                    // but ignore these keys as they have equivalent functional values 
                    // that can have different string values
                    const ignoredKeys = { 
                        "background-position": true,  
                        "transition": true, 
                        "color": true , 
                        "background-color": true,
                        "box-shadow": true,
                        "border-bottom": true,
                        "transform-origin": true,
                        "outline": true,
                        "border": true,
                        "border-color": true
                    }

                    if (!(key in ignoredKeys)) {
                        //const resultValue = style[key]
                        const resultValue = style.getPropertyValue(key)
                        if (resultValue != newValue) {
                            let msg = "DomView: style['" + key + "'] not set to expected value\n";
                            msg += "     set: <" + typeof(newValue) + "> '" + newValue + "'\n";
                            msg += "     got: <" + typeof(resultValue) + "> '" + resultValue + "'\n";
                            console.warn(msg)
                            //throw new Error(msg) 
                        }
                    }
                }
                */
            }

            if (didChangeCallbackFunc) {
                didChangeCallbackFunc()
            }
        }

        return this
    }

    getCssProperty (key, errorCheck) {
        /*
        if (errorCheck) {
            throw new Error("getCssProperty called with 2 arguments")
        }
        */

        /*
        if (key[0] === "-") {
            throw new Error("use getSpecialCssProperty instead")
            return this.getSpecialCssProperty(key)
        }
        */

        this.didDomRead(key)

        //return this.cssStyle()[key]
        return this.cssStyle().getPropertyValue(key)
    }

    // css px attributes

    setPxCssProperty (name, value, didChangeCallbackFunc) {
        this.setCssProperty(name, this.pxNumberToString(value), didChangeCallbackFunc)
        return this
    }

    getPxCssProperty (name, errorCheck) {
        const s = this.getCssProperty(name, errorCheck)
        if (s.length) {
            return this.pxStringToNumber(s)
        }
        return 0
    }

    // computed style

    getComputedCssProperty (name, errorCheck) {
        //debugger; // getComputedStyle forces a layout - make sure it's needed 
        return window.getComputedStyle(this.element()).getPropertyValue(name)
    }

    getComputedPxCssProperty (name, errorCheck) {
     //   debugger; // getComputedCssProperty forces a reflow? - make sure it's needed 
        const s = this.getComputedCssProperty(name, errorCheck)
        if (s.length) {
            return this.pxStringToNumber(s)
        }
        return 0
    }

    // --- css properties ---

    setPosition (s) {
        this.setCssProperty("position", s)
        return this
    }

    position () {
        return this.getCssProperty("position")
    }

    // pointer events

    pointerEventsValidValues () {
        return [null, 
            "auto", 
            "none", 
            "visiblePainted", 
            "visibleFill", 
            "visibleStroke", 
            "visible", 
            "painted", 
            "fill", 
            "stroke", 
            "all", 
            "inherit", 
            "initial", 
            "unset"]
    }

    setPointerEvents (s) {
        assert(this.pointerEventsValidValues().contains(s))
        return this.setCssProperty("pointer-events", s)
    }

    pointerEvents () {
        return this.getCssProperty("pointer-events")
    }

    // transform

    textTransformValidValues () {
        return [null, "none", "capitalize", "uppercase", "lowercase", "initial", "inherit"]
    }

    setTextTransform (v) {
        assert(this.textTransformValidValues().contains(v))
        this.setCssProperty("text-transform", v)
        return this
    }

    textTransform () {
        return this.getCssProperty("text-transform")
    }

    // word wrap

    wordWrapValidValues () {
        return [null, "normal", "break-word", "initial", "inherit"]
    }

    setWordWrap (v) {
        assert(this.wordWrapValidValues().contains(v))
        this.setCssProperty("word-wrap", v)
        return this
    }

    wordWrap () {
        return this.getCssProperty("word-wrap")
    }

    // zoom

    setZoom (s) {
        this.setCssProperty("zoom", s)
        return this
    }

    zoom () {
        return this.getCssProperty("zoom")
    }

    zoomRatio () {
        return Number(this.zoom().before("%")) / 100
    }

    setZoomRatio (r) {
        //console.log("setZoomRatio: ", r)
        this.setZoomPercentage(r * 100)
        return this
    }

    setZoomPercentage (aNumber) {
        assert(Type.isNumber(aNumber))
        this.setCssProperty("zoom", aNumber + "%")
        return this
    }

    // font family

    setFontFamily (s) {
        assert(Type.isString(s) || Type.isNull(s))
        this.setCssProperty("font-family", s)
        return this
    }

    fontFamily () {
        return this.getCssProperty("font-family")
    }

    // font weight

    fontWeightValidatorFunction (v) {
       return (v) => { Type.isNumber(v) || [null, "normal", "bold", "bolder", "lighter", "initial", "inherit"].contains(v) }
    }

    setFontWeight (v) {
        //assert(this.fontWeightValidatorFunction()(v))
        this.setCssProperty("font-weight", v)
        return this
    }

    fontWeight () {
        return this.getCssProperty("font-weight")
    }

    // font size

    setFontSizeAndLineHeight (s) {
        this.setFontSize(s)
        this.setLineHeight(s)
        return this
    }

    setFontSize (s) {
        if (s === "6px") {
            //debugger;
        }
        this.setCssProperty("font-size", s)
        return this
    }

    fontSize () {
        return this.getCssProperty("font-size")
    }

    computedFontSize () {
        return this.getComputedCssProperty("font-size")
    }

    // px font size

    setPxFontSize (s) {
        this.setPxCssProperty("font-size", s)
        return this
    }

    pxFontSize () {
        return this.getPxCssProperty("font-size")
    }

    computedPxFontSize () {
        return this.getComputedPxCssProperty("font-size")
    }

    // text-shadow

    setTextShadow (s) {
        this.setCssProperty("text-shadow", s)
        return this
    }

    textShadow () {
        return this.getCssProperty("text-shadow")
    }

    // ---

    // letter spacing

    setLetterSpacing (s) {
        this.setCssProperty("letter-spacing", s)
        return this
    }

    letterSpacing () {
        return this.getCssProperty("letter-spacing")
    }

    computedLetterSpacing () {
        return this.getComputedCssProperty("letter-spacing")
    }

    // margin

    setMarginString (s) {
        this.setCssProperty("margin", s)
        return this
    }

    // margin

    setMargin (s) {
        this.setCssProperty("margin", s)
        this.setMarginTop(null)
        this.setMarginBottom(null)
        this.setMarginLeft(null)
        this.setMarginRight(null)
        return this
    }

    margin () {
        return this.getCssProperty("margin")
    }

    // margin px

    setMarginPx (s) {
        this.setPxCssProperty("margin", s)
        this.setMarginTop(null)
        this.setMarginBottom(null)
        this.setMarginLeft(null)
        this.setMarginRight(null)
        return this
    }

    marginPx () {
        return this.getPxCssProperty("margin")
    }

    // margin top

    setMarginTop (m) {
        if (Type.isNumber(m)) {
            this.setPxCssProperty("margin-top", m)
        } else {
            this.setCssProperty("margin-top", m)
        }
        return this
    }

    // margin bottom

    setMarginBottom (m) {
        if (Type.isNumber(m)) {
            this.setPxCssProperty("margin-bottom", m)
        } else {
            this.setCssProperty("margin-bottom", m)
        }
        return this
    }

    // margin left

    setMarginLeft (m) {
        if (Type.isNumber(m)) {
            this.setPxCssProperty("margin-left", m)
        } else {
            this.setCssProperty("margin-left", m)
        }
        return this
    }

    // margin right

    setMarginRight (m) {
        this.setCssProperty("margin-right", m)
        return this
    }

    marginRight () {
        return this.getCssProperty("margin-right")
    }

    // margin right px

    setMarginRightPx (m) {
        this.setPxCssProperty("margin-right", m)
        return this
    }

    marginRightPx () {
        return this.getPxCssProperty("margin-right")
    }

    // padding

    setPadding (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setPaddingTop(null)
        this.setPaddingBottom(null)
        this.setPaddingLeft(null)
        this.setPaddingRight(null)
        this.setCssProperty("padding", v)
        return this
    }
    
    padding () {
        return this.getCssProperty("padding")
    }

    // top

    setPaddingTop (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssProperty("padding-top", v)
        return this
    }

    paddingTop () {
        return this.getCssProperty("padding-top")
    }
    // bottom

    setPaddingBottom (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssProperty("padding-bottom", v)
        return this
    }

    paddingBottom () {
        return this.getCssProperty("padding-bottom")
    }

    // left

    setPaddingLeft (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssProperty("padding-left", v)
        return this
    }

    paddingLeft () {
        return this.getCssProperty("padding-left")
    }

    // right
    
    setPaddingRight (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssProperty("padding-right", v)
        return this
    }

    paddingRight () {
        return this.getCssProperty("padding-right")
    }

    // padding px

    setPaddingPx (aNumber) {
        this.setPxCssProperty("padding", aNumber)
        return this
    }

    paddingPx () {
        return this.getPxCssProperty("padding")
    }

    // padding right px

    setPaddingRightPx (aNumber) {
        this.setPxCssProperty("padding-right", aNumber)
        return this
    }

    paddingRightPx () {
        return this.getPxCssProperty("padding-right")
    }

    // padding left px

    setPaddingLeftPx (aNumber) {
        this.setPxCssProperty("padding-left", aNumber)
        return this
    }

    paddingLeftPx () {
        return this.getPxCssProperty("padding-left")
    }

    // padding top px

    setPaddingTopPx (aNumber) {
        this.setPxCssProperty("padding-top", aNumber)
        return this
    }

    paddingTopPx () {
        return this.getPxCssProperty("padding-top")
    }

    // padding bottom px

    setPaddingBottomPx (aNumber) {
        this.setPxCssProperty("padding-bottom", aNumber)
        return this
    }

    paddingBottomPx () {
        return this.getPxCssProperty("padding-bottom")
    }

    // background color

    setBackgroundColor (v) {
        this.setCssProperty("background-color", v)
        return this
    }

    backgroundColor () {
        return this.getCssProperty("background-color")
    }

    computedBackgroundColor () {
        return this.getComputedCssProperty("background-color")
    }

    // background image

    setBackgroundImage (v) {
        this.setCssProperty("background-image", v)
        return this
    }

    backgroundImage () {
        return this.getCssProperty("background-image")
    }

    setBackgroundImageUrlPath (path) {
        this.setBackgroundImage("url(\"" + path + "\")")
        return this
    }

    // background size

    setBackgroundSizeWH (x, y) {
        this.setCssProperty("background-size", x + "px " + y + "px")
        return this
    }

    setBackgroundSize (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssProperty("background-size", v)
        return this
    }

    makeBackgroundCover () {
        this.setBackgroundSize("cover")
        return this
    }

    makeBackgroundContain () {
        this.setBackgroundSize("contain")
        return this
    }

    // background repeat

    makeBackgroundNoRepeat () {
        this.setBackgroundRepeat("no-repeat")
        return this
    }

    setBackgroundRepeat (s) {
        assert(Type.isString(s))
        this.setCssProperty("background-repeat", s)
        return this
    }

    backgroundRepeat () {
        return this.getCssProperty("background-repeat")
    }

    // background position

    makeBackgroundCentered () {
        this.setBackgroundPosition("center")
        return this
    }

    setBackgroundPosition (s) {
        this.setCssProperty("background-position", s)
        return this
    }

    backgroundPosition () {
        return this.getCssProperty("background-position")
    }

    // icons - TODO: find a better place for this

    pathForIconName (aName) {
        const pathSeparator = "/"
        return ["strvct", "resources", "icons", aName + ".svg"].join(pathSeparator)
    }

    // transition

    justSetTransition (s) {
        this.setCssProperty("transition", s)
        return this
    }

    setTransition (s) {
        this.justSetTransition(s)

        if (this._transitions) {
            //debugger;
            this.transitions().syncFromDomView()
        }

        return this
    }

    transition () {
        return this.getCssProperty("transition")
    }

    // helper for hide/unhide transition

    isTransitionHidden () {
        return !Type.isNullOrUndefined(this.hiddenTransitionValue())
    }

    hideTransition () {
        if (!this.isTransitionHidden()) {
            this.setHiddenTransitionValue(this.transition())
            this.setTransition("all 0s")
            this.subviews().forEach(sv => sv.hideTransition())
        }
        return this
    }

    unhideTransition () {
        if (this.isTransitionHidden()) {
            this.setTransition(this.hiddenTransitionValue())
            this.setHiddenTransitionValue(null)
            this.subviews().forEach(sv => sv.unhideTransition())
        } else {
            this.setTransition(null)
        }
        return this
    }

    // hide/unhide transition

    /*
    hideTransition () {
        if (!Type.isNull(this.transition())) {
            this.setHiddenTransitionValue(this.transition())
            this.setTransition(null)
            this.subviews().forEach(sv => sv.hideTransition())
        }
        return this
    }

    unhideTransition () {
        if (Type.isNull(this.transition())) {
            if (this.hiddenTransitionValue()) {
                this.setTransition(this.hiddenTransitionValue())
                this.setHiddenTransitionValue(null)
                this.subviews().forEach(sv => sv.unhideTransition())
            }
        }
        return this
    }
    */

    // transitions

    transitions () {
        if (this._transitions == null) {
            this._transitions = DomTransitions.clone().setDomView(this).syncFromDomView()
        }
        return this._transitions
    }

    // transforms

    setTransform (s) {
        this.setCssProperty("transform", s)
        return this
    }

    setTransformOrigin (s) {
        //transform-origin: x-axis y-axis z-axis|initial|inherit;
        //const percentageString = this.percentageNumberToString(aNumber)
        this.setCssProperty("transform-origin", s)
        return this
    }

    /*
    TODO: add setter/getters for:

        perspective-origin: x-axis y-axis|initial|inherit;
        transform-style: flat|preserve-3d|initial|inherit;
        backface-visibility: hidden | visible;

    */

    // perspective

    setPerspective (n) {
        this.setPxCssProperty("perspective", n)
        return this
    }

    // opacity

    opacityValidatorFunction () {
        return (v) => { return Type.isNumber(v) || [null, "auto", "inherit", "initial", "unset"].contains(v) }
    }

    setOpacity (v) {
        //assert(this.opacityValidatorFunction()(v))
        this.setCssProperty("opacity", v)
        return this
    }

    opacity () {
        return this.getCssProperty("opacity")
    }

    // z index 

    setZIndex (v) {
        this.setCssProperty("z-index", v)
        return this
    }

    zIndex () {
        return this.getCssProperty("z-index")
    }

    // cursor 

    setCursor (s) {
        this.setCssProperty("cursor", s)
        return this
    }

    cursor () {
        return this.getCssProperty("cursor")
    }

    makeCursorDefault () {
        this.setCursor("default")
        return this
    }

    makeCursorPointer () {
        this.setCursor("pointer")
        return this
    }

    makeCursorText () {
        this.setCursor("text")
        return this
    }

    makeCursorGrab () {
        this.setCursor("grab")
        return this
    }

    makeCursorGrabbing () {
        this.setCursor("grabbing")
        return this
    }

    makeCursorColResize () {
        this.setCursor("col-resize")
        return this
    }

    makeCursorTileResize () {
        this.setCursor("row-resize")
        return this
    }


    // top

    setTop (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssProperty("top", v)
        return this
    }

    top () {
        return this.getCssProperty("top")
    }

    // top px

    setTopPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssProperty("top", v)
        return this
    }

    topPx () {
        return this.getPxCssProperty("top")
    }

    // left

    setLeft (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssProperty("left", v)
        return this
    }

    left () {
        return this.getCssProperty("left")
    }

    // left px

    setLeftPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssProperty("left", v)
        return this
    }

    leftPx () {
        return this.getPxCssProperty("left")
    }

    // right

    setRight (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssProperty("right", v)
        return this
    }


    right () {
        return this.getCssProperty("right")
    }

    // right px

    setRightPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssProperty("right", v)
        return this
    }

    rightPx () {
        return this.getPxCssProperty("right")
    }

    // bottom

    setBottom (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssProperty("bottom", v)
        return this
    }

    bottom () {
        return this.getCssProperty("bottom")
    }

    // bottom px

    setBottomPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssProperty("bottom", v)
        return this
    }

    bottomPx () {
        return this.getPxCssProperty("bottom")
    }

    // float

    validFloatPropertyValues () {
        return [null, "left", "right", "none", "inline-start", "inline-end", "start", "end", "initial", "inherit"]
    }

    setFloat (v) {
        assert(this.validFloatPropertyValues().contains(v))
        this.setCssProperty("float", v)
        return this
    }

    float () {
        return this.getCssProperty("float")
    }

    // box shadow

    setBoxShadow (s) {
        //this.debugLog(".setBoxShadow(" + s + ")")
        this.setCssProperty("box-shadow", s)
        return this
    }

    boxShadow () {
        return this.getCssProperty("box-shadow")
    }

    // sizing

    validBoxSizingPropertyValues () {
        return [null, "inherit", "content-box", "border-box"]
    }

    setBoxSizing (s) {
        assert(this.validBoxSizingPropertyValues().contains(s))
        return this.setCssProperty("box-sizing", s)
    }

    boxSizing () {
        return this.getCssProperty("box-sizing")
    }


    // border 

    setBorder (s) {
        this.setCssProperty("border", s)
        return this
    }

    border () {
        return this.getCssProperty("border")
    }

    // border style

    setBorderStyle (s) {
        this.setCssProperty("border-style", s)
        return this
    }

    borderStyle () {
        return this.getCssProperty("border-style")
    }

    // border color

    setBorderColor (s) {
        this.setCssProperty("border-color", s)
        return this
    }

    borderColor () {
        return this.getCssProperty("border-color")
    }

    // border top

    setBorderTop (s) {
        this.setCssProperty("border-top", s)
        return this
    }

    borderTop () {
        return this.getCssProperty("border-top")
    }

    setBorderTopStyle (s) {
        this.setCssProperty("border-top-style", s)
        return this
    }

    setBorderTopWidth (s) {
        this.setCssProperty("border-top-width", s)
        return this
    }

    setBorderTopColor (s) {
        this.setCssProperty("border-top-color", s)
        return this
    }

    // border bottom

    setBorderBottom (s) {
        this.setCssProperty("border-bottom", s)
        return this
    }

    borderBottom () {
        return this.getCssProperty("border-bottom")
    }

    setBorderBottomStyle (s) {
        this.setCssProperty("border-bottom-style", s)
        return this
    }

    setBorderBottomWidth (s) {
        this.setCssProperty("border-bottom-width", s)
        return this
    }

    setBorderBottomColor (s) {
        this.setCssProperty("border-bottom-color", s)
        return this
    }

    // border left

    setBorderLeft (s) {
        //this.debugLog(" border-left set '", s, "'")
        this.setCssProperty("border-left", s)
        return this
    }

    borderLeft () {
        return this.getCssProperty("border-left")
    }

    setBorderLeftStyle (s) {
        this.setCssProperty("border-left-style", s)
        return this
    }

    setBorderLeftWidth (s) {
        this.setCssProperty("border-left-width", s)
        return this
    }

    setBorderLeftColor (s) {
        this.setCssProperty("border-left-color", s)
        return this
    }

    // border right

    setBorderRight (s) {
        this.setCssProperty("border-right", s)
        return this
    }

    borderRight () {
        return this.getCssProperty("border-right")
    }

    borderRightPx () {
        return this.getPxCssProperty("border-right")
    }

    setBorderRightStyle (s) {
        this.setCssProperty("border-right-style", s)
        return this
    }

    setBorderRightWidth (s) {
        this.setCssProperty("border-right-width", s)
        return this
    }

    setBorderRightColor (s) {
        this.setCssProperty("border-right-color", s)
        return this
    }


    // border radius

    setBorderRadius (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssProperty("border-radius", v)
        return this
    }

    borderRadius () {
        return this.getCssProperty("border-radius")
    }

    // border radius

    setBorderRadiusPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssProperty("border-radius", v)
        return this
    }

    borderRadiusPx () {
        return this.getPxCssProperty("border-radius")
    }

    // outline

    setOutline (s) {
        assert(Type.isString(s) || Type.isNull(s))
        this.setCssProperty("outline", s)
        return this
    }

    outline () {
        return this.getCssProperty("outline")
    }

    // px line height

    setPxLineHeight (aNumber) {
        this.setPxCssProperty("line-height", aNumber)
        assert(this.lineHeight() === aNumber)
        return this
    }

    pxLineHeight () {
        return this.getPxCssProperty("line-height")
    }

    // line height

    setLineHeight (aString) {
        assert(Type.isString(aString) || Type.isNull(aString))
        this.setCssProperty("line-height", aString)
        return this
    }

    lineHeight () {
        return this.getCssProperty("line-height")
    }

    // alignment

    validTextAlignValues () {
        return [null, "left", "right", "center", "justify", "justify-all", "start", "end", "match-parent", "initial", "inherit", "unset"]
    }

    setTextAlign (v) {
        assert(this.validTextAlignValues().contains(v))
        this.setCssProperty("text-align", v)
        return this
    }

    textAlign () {
        return this.getCssProperty("text-align")
    }

    // clear

    setClear (v) {
        assert([null, "none", "left", "right", "both", "initial", "inherit"].contains(v))
        this.setCssProperty("clear", v)
        return this
    }

    clear () {
        return this.getCssProperty("clear")
    }

    // flex 

    setFlex (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssProperty("flex", v)
        return this
    }

    flex () {
        return this.getCssProperty("flex")
    }

    // flex wrap

    setFlexWrap (v) {
        assert(["nowrap", "wrap", "wrap-reverse", "initial", "inherit"].contains(v))
        this.setCssProperty("flex-wrap", v)
        return this
    }

    flex () {
        return this.getCssProperty("flex-wrap")
    }

    // flex order

    setOrder (v) {
        assert(Type.isNull(v) || Type.isNumber(v) || ["initial", "inherit"].contains(v))
        this.setCssProperty("order", v)
        return this
    }

    order () {
        return this.getCssProperty("order")
    }

    // flex align-items (flex-start, center, flex-end) - NOTE: alignment depends on direct of flex!

    validAlignItemsPropertyValues () {
        return [null, "flex-start", "center", "flex-end", "space-between", "space-around", "stretch"]
    }

    setAlignItems (v) {
        assert(this.validAlignItemsPropertyValues().contains(v))
        this.setCssProperty("align-items", v)
        return this
    }

    alignItems () {
        return this.getCssProperty("align-items")
    }

    // flex justify-content (flex-start, center, flex-end) - NOTE: alignment depends on direct of flex!
    
    validJustifyContentPropertyValues () {
        return [null, "flex-start", "center", "flex-end", "space-between", "space-around"]
    }

    setJustifyContent (v) {
        assert(this.validJustifyContentPropertyValues().contains(v))
        this.setCssProperty("justify-content", v)
        return this
    }

    justifyContent () {
        return this.getCssProperty("justify-content")
    }

    // flex direction - (row, column)

    setFlexDirection (v) {
        this.setCssProperty("flex-direction", v)
        return this
    }

    flexDirection () {
        return this.getCssProperty("flex-direction")
    }

    // flex grow

    setFlexGrow (v) {
        this.setCssProperty("flex-grow", v)
        return this
    }

    flexGrow () {
        return this.getCssProperty("flex-grow")
    }

    // flex shrink

    setFlexShrink (v) {
        this.setCssProperty("flex-shrink", v)
        return this
    }

    flexShrink () {
        return this.getCssProperty("flex-shrink")
    }

    // flex basis

    setFlexBasis (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssProperty("flex-basis", v)
        return this
    }

    flexBasis () {
        return this.getCssProperty("flex-basis")
    }

    // color

    setColor (v) {
        this.setCssProperty("color", v)
        return this
    }

    color () {
        return this.getCssProperty("color")
    }

    // filters

    setFilter (s) {
        this.setCssProperty("filter", s)
        return this
    }

    filter () {
        return this.getCssProperty("filter")
    }

    // visibility

    setIsVisible (aBool) {
        const v = aBool ? "visible" : "hidden"
        this.setCssProperty("visibility", v)
        return this
    }

    isVisible () {
        return this.getCssProperty("visibility") !== "hidden";
    }

    // display

    setDisplay (s) {
        //assert(s in { "none", ...} );
        this.setCssProperty("display", s)
        return this
    }

    display () {
        return this.getCssProperty("display")
    }

    // hide height


    /*
    hideHeight () {
		if (Type.isUndefined(this.hiddenMinHeight())) {
            this.setHiddenMinHeight(this.minHeight())
            this.setHiddenMaxHeight(this.maxHeight())
            this.setMinAndMaxHeight("0em")
        }
		return this
	}
	
	unhideHeight () {
		if (!Type.isUndefined(this.hiddenMinHeight())) {
			this.setMinHeight(this.hiddenMaxHeight())
			this.setHiddenMinHeight(undefined)

			this.setMaxHeight(this.hiddenMaxHeight())
			this.setHiddenMaxHeight(undefined)
		}
		
		return this
	}
    */

    // helper for hide/show display

    setIsDisplayHidden (aBool) {
        if (aBool) {
            this.hideDisplay()
        } else {
            this.unhideDisplay()
        }
        return this
    }

    isDisplayHidden () {
        return this.display() === "none"
    }

    hideDisplay () {
        if (this.display() !== "none") {
            this.setHiddenDisplayValue(this.display())
            this.setDisplay("none")
        }
        return this
    }

    unhideDisplay () {
        if (this.display() === "none") {
            if (this._hiddenDisplayValue) {
                this.setDisplay(this.hiddenDisplayValue())
                this.setHiddenDisplayValue(null)
            } else {
                this.setDisplay(null)
                // we don't now what value to set display to, so we have to raise an exception
                //throw new Error(this.type() + " attempt to unhide display value that was not hidden")
            }
        }
        return this
    }

    // visibility

    setVisibility (s) {
        this.setCssProperty("visibility", s)
        return this
    }

    visibility () {
        return this.getCssProperty("visibility")
    }

    // white space

    setWhiteSpace (s) {
        this.setCssProperty("white-space", s)
        return this
    }

    whiteSpace () {
        return this.getCssProperty("white-space")
    }


    // word-break

    setWordBreak (s) {
        assert(Type.isString(s))
        this.setCssProperty("word-break", s)
        return this
    }

    wordBreak () {
        return this.getCssProperty("word-break")
    }

    // webkit specific

    setWebkitOverflowScrolling (s) {
        assert(Type.isString(s))
        this.setSpecialCssProperty("-webkit-overflow-scrolling", s)
        assert(this.webkitOverflowScrolling() === s)
        return this
    }

    webkitOverflowScrolling () {
        return this.getSpecialCssProperty("-webkit-overflow-scrolling")
    }

    // ms specific 

    setMsOverflowStyle (s) {
        /* -ms-overflow-style: none; removes scrollbars on IE 10+  */
        assert(Type.isString(s))
        this.setSpecialCssProperty("-ms-overflow-style", s)
        assert(this.msOverflowStyle() === s)
        return this
    }

    msOverflowStyle () {
        return this.getSpecialCssProperty("-ms-overflow-style")
    }


    // overflow

    setOverflow (s) {
        assert(Type.isString(s))
        this.setCssProperty("overflow", s)
        return this
    }

    overflow () {
        return this.getCssProperty("overflow")
    }

    // overflow wrap

    setOverflowWrap (s) {
        assert(Type.isString(s))
        this.setCssProperty("overflow-wrap", s)
        return this
    }

    overflowWrap () {
        return this.getCssProperty("overflow-wrap")
    }

    // overflow x

    setOverflowX (s) {
        assert(Type.isString(s))
        this.setCssProperty("overflow-x", s)
        return this
    }

    overflowX () {
        return this.getCssProperty("overflow-x")
    }

    // overflow y

    setOverflowY (s) {
        assert(Type.isString(s))
        this.setCssProperty("overflow-y", s)
        return this
    }

    overflowY () {
        return this.getCssProperty("overflow-y")
    }

    /*	

    // text over flow

    // Overflow behavior at line end
    // Right end if ltr, left end if rtl 
    text-overflow: clip;
    text-overflow: ellipsis;
    text-overflow: "…";
    text-overflow: fade;
    text-overflow: fade(10px);
    text-overflow: fade(5%);

    // Overflow behavior at left end | at right end
    // Directionality has no influence 
    text-overflow: clip ellipsis;
    text-overflow: "…" "…";
    text-overflow: fade clip;
    text-overflow: fade(10px) fade(10px);
    text-overflow: fade(5%) fade(5%);

    // Global values 
    text-overflow: inherit;
    text-overflow: initial;
    text-overflow: unset;
    */

    setTextOverflow (s) {
        this.setCssProperty("text-overflow", s)
        return this
    }

    textOverflow () {
        return this.getCssProperty("text-overflow")
    }


    // user select

    userSelectKeys () {
        return [
            "-moz-user-select",
            "-khtml-user-select",
            "-webkit-user-select",
            "-o-user-select"
        ]
    }

    userSelect () {
        const style = this.cssStyle()
        let result = this.userSelectKeys().detect(key => style[key])
        result = result || style.userSelect
        return result
    }

    turnOffUserSelect () {
        this.setUserSelect("none");
        return this
    }

    turnOnUserSelect () {
        this.setUserSelect("text")
        return this
    }

    // user selection 

    setUserSelect (aString) {
        const style = this.cssStyle()
        //console.log("'" + aString + "' this.userSelect() = '" + this.userSelect() + "' === ", this.userSelect() == aString)
        if (this.userSelect() !== aString) {
            style.userSelect = aString
            this.userSelectKeys().forEach(key => style[key] = aString)
        }
        return this
    }

    // spell check

    setSpellCheck (aBool) {
        this.element().setAttribute("spellcheck", aBool);
        return this
    }

    // tool tip

    setToolTip (aName) {
        if (aName) {
            this.element().setAttribute("title", aName);
        } else {
            this.element().removeAttribute("title");
        }
        return this
    }

    // width and height

    computedWidth () {
        //return this.calcSize().width()
        return this.getComputedPxCssProperty("width")
    }

    computedHeight () {
        //return this.calcSize().height()
        return this.getComputedPxCssProperty("height")
    }

    // desired size

    desiredWidth () {
        return this.calcWidth()
    }

    desiredHeight () {
        return this.calcHeight()
    }

    // calculated size (outside of parent view)

    calcSize () {
        assert(this.parentView())

        const e = this.element()
        assert(e.parentNode)

        // reads
        this.didDomRead("display")
        //this.didDomRead("position")
        //this.didDomRead("width")
        const display = e.style.display
        const position = e.style.position
        const width = e.style.width

        // writes
        this.didDomWrite("display")
        //this.didDomWrite("position")
        //this.didDomWrite("width")
        e.style.display = "block"
        e.style.position = "absolute"
        e.style.width = "auto"

        // read calc
        this.didDomRead("clientWidth")
        //this.didDomRead("clientHeight")
        const w = (e.clientWidth + 1) 
        const h = (e.clientHeight + 1) 
        //const size = { width: w, height: h }
        const size = Point.clone().setXY(w, h).freeze()

        // write
        this.didDomWrite("display")
        //this.didDomWrite("position")
        //this.didDomWrite("width")
        e.style.display = display
        e.style.position = position
        e.style.width = width

        if (w === 1 && h === 1) {
            assert(e.hasAncestor(document.body)) // client measurements will be zero if it's not in a document
        }

        this.setCachedSize(size)
        return size
    }

    cacheClientSize () {
        if (this.display() === "none") {
            return Point.clone().freeze()
        }

        const e = this.element()
        this.setCachedSize(Point.clone().setXY(e.clientWidth, e.clientHeight).freeze())
        return this
    }

    cachedSize () {
        if (this.display() === "none") {
            return Point.clone().freeze()
        }
        return this._cachedSize
    }

    // calculated size (within parent view)

    calcWidth () {
        if (this.display() === "none") {
            return 0
        }
        return this.calcSize().width()
    }

    calcHeight () {
        if (this.display() === "none") {
            return 0
        }
        return this.calcSize().height()
    }

    // width

    setWidthString (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssProperty("width", v, () => { this.didChangeWidth() })
        return this
    }

    widthString () {
        return this.getCssProperty("width")
    }

    setWidth (s) {
        this.setWidthString(s)
        return this
    }

    setWidthPercentage (aNumber) {
        const newValue = this.percentageNumberToString(aNumber)
        this.setCssProperty("width", newValue, () => { this.didChangeWidth() })
        return this
    }

    /*
    hideScrollbar () {
        // need to do JS equivalent of: .class::-webkit-scrollbar { display: none; }
	    // this.setCssProperty("-webkit-scrollbar", { display: "none" }) // doesn't work
	    return this
    }
    */

    // clientX - includes padding but not scrollbar, border, or margin

    clientWidth () {
        return this.getAttribute("clientWidth")
    }

    clientHeight () {
        return this.getAttribute("clientHeight")
    }

    // offsetX - includes borders, padding, scrollbar 

    offsetWidth () {
        return this.getAttribute("offsetWidth")
    }

    offsetHeight () {
        return this.getAttribute("offsetHeight")
    }

    // width px

    minWidthPx () {
        const s = this.getCssProperty("min-width")
        // TODO: support em to px translation 
        return this.pxStringToNumber(s)
    }

    maxWidthPx () {
        const w = this.getCssProperty("max-width")
        if (w === "") {
            return null
        }
        return this.pxStringToNumber(w)
    }

    // height px

    minHeightPx () {
        const s = this.getCssProperty("min-height")
        // TODO: support em to px translation 
        return this.pxStringToNumber(s)
    }

    maxHeightPx () {
        const s = this.getCssProperty("max-height")
        if (s === "") {
            return null
        }
        return this.pxStringToNumber(s)
    }

    // -----------

    cssStyle () {
        return this.element().style
    }

    setMinWidth (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssProperty("min-width", v, () => { this.didChangeWidth() })
        return this
    }

    didChangeWidth () {
    }

    didChangeHeight () {
    }

    // --- lock/unlock size ---

    /*
    lockSize () {
        const h = this.computedHeight() 
        const w = this.computedWidth()
        this.setMinAndMaxWidth(w)
        this.setMinAndMaxHeight(h)
        return this
    }

    unlockSize () {
        this.setMinAndMaxWidth(null)
        this.setMinAndMaxHeight(null)
        return this
    }
    */

    // ----

    displayIsFlex () {
        // TODO: choose a better name for this method?
        return (this.display() === "flex" || this.hiddenDisplayValue() === "flex")
    }

    // fixed width

    /*
    setFixedWidthPx (v) {
        assert(Type.isNumber(v))
        if (this.displayIsFlex()) {
            this.setFlexGrow(0)
            this.setFlexShrink(0)
            this.setFlexBasis(v + "px")
        } else {
            this.setMinAndMaxWidth(v)
        }
        return this
    }

    fixedWidthPx () {
        if (this.displayIsFlex()) {
            const w = this.getPxCssProperty("flex-basis")
            assert(Type.isNumber(w))
            return w
        } else {
            const w1 = this.getPxCssProperty("min-width")
            const w2 = this.getPxCssProperty("max-width")
            assert(Type.isNumber(w1) && w1 === w2)
            return w1
        }
    }
    */

    // fixed height
    /*
    setFixedHeightPx (v) {
        assert(Type.isNumber(v))
        if (this.displayIsFlex()) {
            this.setFlexGrow(0)
            this.setFlexShrink(0)
            this.setFlexBasis(v + "px")
        } else {
            this.setMinAndMaxWidth(v)
        }
        return this
    }

    fixedHeightPx () {
        if (this.displayIsFlex()) {
            const w = this.getPxCssProperty("flex-basis")
            assert(Type.isNumber(w))
            return w
        } else {
            const w1 = this.getPxCssProperty("min-width")
            const w2 = this.getPxCssProperty("max-width")
            assert(Type.isNumber(w1) && w1 === w2)
            return w1
        }
    }
    */

    // ----

    setMinAndMaxSize (aSize) {
        this.setMinAndMaxWidth(aSize.x())
        this.setMinAndMaxHeight(aSize.y())
        return this
    }

    setMaxWidth (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssProperty("max-width", v, () => { this.didChangeWidth() })
        return this
    }

    setMinAndMaxWidth (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssProperty("max-width", v, () => { this.didChangeWidth() })
        this.setCssProperty("min-width", v, () => { this.didChangeWidth() })
        if (!Type.isNull(v)) {
            this.setCssProperty("width", v, null) // avoids weird behavior but not ideal if min and max settings change do diff values
        }
        return this
    }

    setMinAndMaxHeight (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssProperty("min-height", v, () => { this.didChangeHeight() })
        this.setCssProperty("max-height", v, () => { this.didChangeHeight() })
        if (!Type.isNull(v)) {
            this.setCssProperty("height", v, null) // avoids weird behavior but not ideal if min and max settings change do diff values
        }
        return this
    }

    setMinAndMaxWidthAndHeight (v) {
        this.setMinAndMaxWidth(v)
        this.setMinAndMaxHeight(v)
        return this
    }

    percentageNumberToString (aNumber) {
        assert(Type.isNumber(aNumber) && (aNumber >= 0) && (aNumber <= 100))
        return aNumber + "%"
    }

    pxNumberToString (aNumber) {
        if (Type.isNull(aNumber)) {
            return null
        }

        if (Type.isString(aNumber)) {
            if (aNumber.startsWith("calc") || aNumber.endsWith("px")) {
                return aNumber
            }
        }

        assert(Type.isNumber(aNumber))
        return aNumber + "px"
    }

    pxStringToNumber (s) {
        assert(Type.isString(s))
        
        if (s === "") {
            return 0
        }
        
        if (s === "auto") {
            return 0
        }

        if (s.contains("%")) {
            return 0
        }

        assert(s.endsWith("px"))
        return Number(s.replace("px", ""))
    }

    setMinAndMaxHeightPercentage (aNumber) {
        const newValue = this.percentageNumberToString(aNumber)
        this.setCssProperty("min-height", newValue, () => { this.didChangeHeight() })
        this.setCssProperty("max-height", newValue, () => { this.didChangeHeight() })
        return this
    }

    setHeightPercentage (aNumber) {
        // NOTE: %s don't work unless same parent view dimension is defined
        const newValue = this.percentageNumberToString(aNumber)
        this.setHeightString(newValue)
        return this
    }

    setMinWidthPx (aNumber) {
        this.setMinWidth(this.pxNumberToString(aNumber))
        return this
    }

    setMinHeightPx (aNumber) {
        this.setMinHeight(this.pxNumberToString(aNumber))
        return this
    }

    setMaxHeightPx (aNumber) {
        this.setMaxHeight(this.pxNumberToString(aNumber))
        return this
    }

    maxHeight () {
        return this.getCssProperty("max-height")
    }

    minHeight () {
        return this.getCssProperty("min-height")
    }

    maxWidth () {
        return this.getCssProperty("max-width")
    }

    minWidth () {
        return this.getCssProperty("min-width")
    }

    setMinHeight (newValue) {
        assert(Type.isString(newValue) || Type.isNull(newValue))
        // <length> | <percentage> | auto | max-content | min-content | fit-content | fill-available
        this.setCssProperty("min-height", newValue, () => { this.didChangeHeight() })
        return this
    }

    setMaxHeight (newValue) {
        assert(Type.isString(newValue) || Type.isNull(newValue))
        // <length> | <percentage> | none | max-content | min-content | fit-content | fill-available
        this.setCssProperty("max-height", newValue, () => { this.didChangeHeight() })
        return this
    }

    setWidthPx (aNumber) {
        this.setWidthString(this.pxNumberToString(aNumber))
        return this
    }

    setHeightPx (aNumber) {
        this.setHeightString(this.pxNumberToString(aNumber))
        return this
    }

    setHeight (s) {
        // height: auto|length|initial|inherit;

        if (Type.isNumber(s)) {
            return this.setHeightPx(s)
        }
        this.setHeightString(s)
        return this
    }

    setWidthToAuto () {
        this.setWidthString("auto")
        return this
    }

    setHeightToAuto () {
        this.setHeightString("auto")
        return this
    }

    setHeightString (s) {
        assert(Type.isString(s) || Type.isNull(s))
        this.setCssProperty("height", s, () => { this.didChangeHeight() })
        return this
    }

    height () {
        return this.getCssProperty("height")
    }

    // --- string ---

    setString (v) {
        return this.setTextContent(v)
        //return this.setInnerHtml(v)
    }

    string () {
        return this.textContent()
        //return this.innerHtml()
    }

    // --- innerHTML ---

    innerHtml () {
        return this.getAttribute("innerHTML")
        //return this.element().innerHTML
    }

    setInnerHtml (v) {
        this.setAttribute("innerHTML", v)
        //this.element().innerHTML = v
        return this
    }

    // --- innerText ---

    setInnerText (v) {
        const e = this.element().innerText = v
        return this
    }

    innerText () {
        const e = this.element()
        return e.innerText 
        //return e.textContent || e.innerText || "";
    }

    // --- textContent ---

    setTextContent (v) {
        this.element().textContent = v
        //this.setAttribute("textContent", v)
        return this
    }

    textContent () {
        return this.element().textContent
        //return this.getAttribute("textContent")
    }

    // --- touch events ---

    setTouchAction (s) {
        this.setCssProperty("-ms-touch-action", s) // needed?
        this.setCssProperty("touch-action", s)
        return this
    }

    // scroll top

    setScrollTop (v) {
        this.setAttribute("scrollTop", v)
        return this
    }

    scrollTop () {
        return this.getAttribute("scrollTop")
    }

    // scroll width & scroll height

    scrollWidth () { 
        // a read-only value
        return this.getAttribute("scrollWidth")
    }

    scrollHeight () {
        // a read-only value
        return this.getAttribute("scrollHeight") 
    }

    // offset width & offset height

    offsetLeft () {
        // a read-only value
        return this.getAttribute("offsetLeft")
    }

    offsetTop () {
        // a read-only value
        return this.getAttribute("offsetTop")
    }

    boundingClientRect () {
        this.didDomRead("boundingClientRect")
        return this.element().getBoundingClientRect()
    }

    viewportX () {
        return this.boundingClientRect().x
    }

    viewportY () {
        return this.boundingClientRect().y
    }

    /*
    containsViewportPoint () {
        throw new Error("unimplemented")
    }
    */


    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------


    // view position helpers ----

    setRelativePos (p) {
        // why not a 2d transform?
        this.setLeftPx(p.x())
        this.setTopPx(p.y())
        return this
    }

    containsPoint (aPoint) {
        // point must be in document coordinates
        return this.frameInDocument().containsPoint(aPoint)
    }

    // viewport coordinates helpers

    frameInViewport () {
        const origin = this.positionInViewport()
        const size = this.sizeInViewport()
        const frame = Rectangle.clone().setOrigin(origin).setSize(size)
        return frame
    }

    positionInViewport () {
        const box = this.boundingClientRect();
        return Point.clone().set(Math.round(box.left), Math.round(box.top));
    }

    sizeInViewport () {
        const box = this.boundingClientRect();
        return Point.clone().set(Math.round(box.width), Math.round(box.height));
    }

    // document coordinates helpers

    // --- document positioning ---

    setFrameInDocument (aRect) {
        this.setPosition("absolute")
        this.setLeftPx(aRect.origin().x())
        this.setTopPx(aRect.origin().y())
        this.setMinAndMaxSize(aRect.size())
        return this
    }

    frameInDocument () {
        const origin = this.positionInDocument()
        const size = this.size()
        const frame = Rectangle.clone().setOrigin(origin).setSize(size)

        //const size = this.calcSize() // this.size()
        //onst frame = Rectangle.clone().setOrigin(origin)
        //frame.size().setX(size.width).setY(size.height)

        return frame
    }

    // -------------------
    // fixed - assumes position is absolute and width and height are fixed via min-width === max-width, etc
    // -------------------

    // fixed position

    hasFixedX () {
        return !Type.isNullOrUndefined(this.leftPx() ) 
    }

    hasFixedY () {
        return !Type.isNullOrUndefined(this.topPx() ) 
    }

    hasFixedPosition () {
        return this.position() === "absolute" && this.hasFixedX() && this.hasFixedY()
    }

    // fixed size

    hasFixedSize () {
        return this.hasFixedWidth() && this.hasFixedHeight()
    }

    hasFixedWidth () {
        const v1 = this.minWidthPx()
        const v2 = this.maxWidthPx()
        return !Type.isNullOrUndefined(v1) && v1 === v2
    }

    hasFixedHeight () {
        const v1 = this.minHeightPx()
        const v2 = this.maxHeightPx()
        return !Type.isNullOrUndefined(v1) && v1 === v2
    }

    decrementFixedWidth () {
        assert(this.hasFixedWidth())
        this.setMinAndMaxWidth(Math.max(0, this.minWidthPx()-1))
        return this
    }

    decrementFixedHeight () {
        assert(this.hasFixedHeight())
        this.setMinAndMaxHeight(Math.max(0, this.minHeightPx()-1))
        return this
    }

    // fixed frame

    hasFixedFrame () {
        return this.hasFixedPosition() && this.hasFixedSize()
    }

    fixedFrame () {
        assert(this.hasFixedFrame())
        const origin = Point.clone().set(Math.round(this.leftPx()), Math.round(this.topPx()))
        const size   = Point.clone().set(Math.round(this.minWidthPx()), Math.round(this.minHeightPx()))
        const frame  = Rectangle.clone().setOrigin(origin).setSize(size)
        return frame
    }

    //--------------

    estimatedWidthPx () {
        const v1 = this.minWidthPx()
        const v2 = this.maxWidthPx()
        if (!Type.isNullOrUndefined(v1) && v1 === v2) {
            return v1
        }
        return this.clientWidth()
    }

    estimatedHeightPx () {
        const v1 = this.minHeightPx()
        const v2 = this.maxHeightPx()
        if (!Type.isNullOrUndefined(v1) && v1 === v2) {
            return v1
        }
        return this.clientHeight()
    }

    // ------------------------

    positionInDocument () {
        this.didDomRead("scrollTop")
        //this.didDomRead("scrollLeft")

        const box = this.element().getBoundingClientRect();

        // return Point.clone().set(Math.round(box.left), Math.round(box.top));

        const body = document.body;
        const docEl = document.documentElement;

        const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        const clientTop = docEl.clientTop || body.clientTop || 0;
        const clientLeft = docEl.clientLeft || body.clientLeft || 0;

        const top = box.top + scrollTop - clientTop;
        const left = box.left + scrollLeft - clientLeft;

        const p = Point.clone().set(Math.round(left), Math.round(top));
        return p
    }

    size () {
        return EventPoint.clone().set(this.clientWidth(), this.clientHeight());
    }

    // ---------------------

    setFrameInParent (aRect) {
        this.setPosition("absolute")
        this.setLeftPx(aRect.origin().x())
        this.setTopPx(aRect.origin().y())
        this.setMinAndMaxSize(aRect.size())
        return this
    }

    frameInParentView () {
        const origin = this.relativePos()
        const size = this.size()
        const frame = Rectangle.clone().setOrigin(origin).setSize(size)
        return frame
    }

    // ---

    relativePos () {
        const pv = this.parentView()
        if (pv) {
            return this.positionInDocument().subtract(pv.positionInDocument())
            //return pv.positionInDocument().subtract(this.positionInDocument())
        }
        return this.positionInDocument()
    }

    setRelativePos (p) {
        //this.setPosition("absolute")
        this.setLeftPx(p.x())
        this.setTopPx(p.y())
        return this
    }

    // ---

    viewPosForWindowPos (pos) {
        return pos.subtract(this.positionInDocument())
    }

    // --------------

    makeAbsolutePositionAndSize () {
        const f = this.frameInParentView()
        this.setFrameInParent(f)
        return this 
    }

    makeRelativePositionAndSize () {
        // TODO: check if it's flex and set flex basis in flex direction instead?
        this.setPosition("relative")

        this.setTopPx(null)
        this.setLeftPx(null)
        this.setRightPx(null)
        this.setBottomPx(null)

        this.setMinAndMaxWidth(null)
        this.setMinAndMaxHeight(null)  
        return this 
    }

    // --------------

    /*
    cancelVerticallyAlignAbsolute () {
        this.setPosition("relative")
    }
    */

    // --- scroll actions ---

    scrollToTop () {
        this.setScrollTop(0)
        return this
    }

    setVerticalAlign (s) {
        this.setCssProperty("vertical-align", s)
        return this
    }

    // --- css :after :before ---

    setContentAfterOrBeforeString (aString, afterOrBefore) {
        const uniqueClassName = "UniqueClass_" + this.puuid()
        const e = this.element()
        if (e.className.indexOf(uniqueClassName) === -1) {
            const newRuleKey = "DomView" + uniqueClassName + ":" + afterOrBefore
            const newRuleValue = "content: \"" + aString + "\;"
            //console.log("newRule '" + newRuleKey + "', '" + newRuleValue + "'")
            document.styleSheets[0].addRule(newRuleKey, newRuleValue);
            e.className += " " + uniqueClassName
        }
        return this
    }

    setContentAfterString (s) {
        this.setContentAfterOrBeforeString(s, "after")
        return this
    }

    setContentBeforeString (s) {
        this.setContentAfterOrBeforeString(s, "before")
        return this
    }

    didDomRead (opName) {
        //ThrashDetector.shared().didRead(opName, this)
        return this
    }

    didDomWrite (opName) {
        //ThrashDetector.shared().didWrite(opName, this)
        return this
    }

    // reflow thrash avoidance helpers


}.initThisClass());
