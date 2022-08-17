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
    }

    /*
    init () {
        super.init()
        return this
    }
    */

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
        this[setterName].apply(this, [newValue])
        return this
    }

    popSlotValue (slotName) {
        const a = this.pushedSlotValuesAt(slotName)
        if (a.length === 0) {
            throw new Error("attempt to pop empty slot value stack")
        }
        const oldValue = a.pop()
        const setterName = "set" + slotName.capitalized()
        this[setterName].apply(this, [oldValue])
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
        const oldValue = this.getCssAttribute(name)
        stack.push(oldValue)
        this.setCssAttribute(name, newValue) // NOTE: bypasses css change callbacks
        return this
    }

    popAttribute (name) {
        const a = this.pushedAttributesAt(name)
        if (a.length === 0) {
            throw new Error("attempt to pop empty css attribute stack")
        }
        const oldValue = a.pop()
        this.setCssAttribute(name, oldValue) // NOTE: bypasses css change callbacks
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
            this.setCssAttribute(k, v)
        })
        return this
    }

    setCssAttribute (key, newValue, didChangeCallbackFunc) {
        assert(Type.isString(key))

        const style = this.cssStyle()
        const doesSanityCheck = false
        const oldValue = style[key]

        if (String(oldValue) !== String(newValue)) {
            if (newValue == null) {
                //console.log("deleting css key ", key)
                //delete style[key]
                style.removeProperty(key)
                //console.log(this.cssStyle()[key])
            } else {
                style[key] = newValue

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

                    const resultValue = style[key]
                    if (!(key in ignoredKeys) && resultValue != newValue) {
                        let msg = "DomView: style['" + key + "'] not set to expected value\n";
                        msg += "     set: <" + typeof(newValue) + "> '" + newValue + "'\n";
                        msg += "     got: <" + typeof(resultValue) + "> '" + resultValue + "'\n";
                        console.warn(msg)
                        //throw new Error(msg) 
                    }
                }
            }

            if (didChangeCallbackFunc) {
                didChangeCallbackFunc()
            }
        }

        return this
    }

    getCssAttribute (key, errorCheck) {
        if (errorCheck) {
            throw new Error("getCssAttribute called with 2 arguments")
        }
        return this.cssStyle()[key]
    }

    // css px attributes

    setPxCssAttribute (name, value, didChangeCallbackFunc) {
        this.setCssAttribute(name, this.pxNumberToString(value), didChangeCallbackFunc)
        return this
    }

    getPxCssAttribute (name, errorCheck) {
        const s = this.getCssAttribute(name, errorCheck)
        if (s.length) {
            return this.pxStringToNumber(s)
        }
        return 0
    }

    // computed style

    getComputedCssAttribute (name, errorCheck) {
        return window.getComputedStyle(this.element()).getPropertyValue(name)
    }

    getComputedPxCssAttribute (name, errorCheck) {
        const s = this.getComputedCssAttribute(name, errorCheck)
        if (s.length) {
            return this.pxStringToNumber(s)
        }
        return 0
    }

    // --- css properties ---

    setPosition (s) {
        this.setCssAttribute("position", s)
        return this
    }

    position () {
        return this.getCssAttribute("position")
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
        return this.setCssAttribute("pointer-events", s)
    }

    pointerEvents () {
        return this.getCssAttribute("pointer-events")
    }

    // transform

    textTransformValidValues () {
        return [null, "none", "capitalize", "uppercase", "lowercase", "initial", "inherit"]
    }

    setTextTransform (v) {
        assert(this.textTransformValidValues().contains(v))
        this.setCssAttribute("text-transform", v)
        return this
    }

    textTransform () {
        return this.getCssAttribute("text-transform")
    }

    // word wrap

    wordWrapValidValues () {
        return [null, "normal", "break-word", "initial", "inherit"]
    }

    setWordWrap (v) {
        assert(this.wordWrapValidValues().contains(v))
        this.setCssAttribute("word-wrap", v)
        return this
    }

    wordWrap () {
        return this.getCssAttribute("word-wrap")
    }

    // zoom

    setZoom (s) {
        this.setCssAttribute("zoom", s)
        return this
    }

    zoom () {
        return this.getCssAttribute("zoom")
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
        this.setCssAttribute("zoom", aNumber + "%")
        return this
    }

    // font family

    setFontFamily (s) {
        assert(Type.isString(s) || Type.isNull(s))
        this.setCssAttribute("font-family", s)
        return this
    }

    fontFamily () {
        return this.getCssAttribute("font-family")
    }

    // font weight

    fontWeightValidatorFunction (v) {
       return (v) => { Type.isNumber(v) || [null, "normal", "bold", "bolder", "lighter", "initial", "inherit"].contains(v) }
    }

    setFontWeight (v) {
        //assert(this.fontWeightValidatorFunction()(v))
        this.setCssAttribute("font-weight", v)
        return this
    }

    fontWeight () {
        return this.getCssAttribute("font-weight")
    }

    // font size

    setFontSizeAndLineHeight (s) {
        this.setFontSize(s)
        this.setLineHeight(s)
        return this
    }

    setFontSize (s) {
        this.setCssAttribute("font-size", s)
        return this
    }

    fontSize () {
        return this.getCssAttribute("font-size")
    }

    computedFontSize () {
        return this.getComputedCssAttribute("font-size")
    }

    // px font size

    setPxFontSize (s) {
        this.setPxCssAttribute("font-size", s)
        return this
    }

    pxFontSize () {
        return this.getPxCssAttribute("font-size")
    }

    computedPxFontSize () {
        return this.getComputedPxCssAttribute("font-size")
    }

    // text-shadow

    setTextShadow (s) {
        this.setCssAttribute("text-shadow", s)
        return this
    }

    textShadow () {
        return this.getCssAttribute("text-shadow")
    }

    // ---

    // letter spacing

    setLetterSpacing (s) {
        this.setCssAttribute("letter-spacing", s)
        return this
    }

    letterSpacing () {
        return this.getCssAttribute("letter-spacing")
    }

    computedLetterSpacing () {
        return this.getComputedCssAttribute("letter-spacing")
    }

    // margin

    setMarginString (s) {
        this.setCssAttribute("margin", s)
        return this
    }

    // margin

    setMargin (s) {
        this.setCssAttribute("margin", s)
        this.setMarginTop(null)
        this.setMarginBottom(null)
        this.setMarginLeft(null)
        this.setMarginRight(null)
        return this
    }

    margin () {
        return this.getCssAttribute("margin")
    }

    // margin px

    setMarginPx (s) {
        this.setPxCssAttribute("margin", s)
        this.setMarginTop(null)
        this.setMarginBottom(null)
        this.setMarginLeft(null)
        this.setMarginRight(null)
        return this
    }

    marginPx () {
        return this.getPxCssAttribute("margin")
    }

    // margin top

    setMarginTop (m) {
        if (Type.isNumber(m)) {
            this.setPxCssAttribute("margin-top", m)
        } else {
            this.setCssAttribute("margin-top", m)
        }
        return this
    }

    // margin bottom

    setMarginBottom (m) {
        if (Type.isNumber(m)) {
            this.setPxCssAttribute("margin-bottom", m)
        } else {
            this.setCssAttribute("margin-bottom", m)
        }
        return this
    }

    // margin left

    setMarginLeft (m) {
        if (Type.isNumber(m)) {
            this.setPxCssAttribute("margin-left", m)
        } else {
            this.setCssAttribute("margin-left", m)
        }
        return this
    }

    // margin right

    setMarginRight (m) {
        this.setCssAttribute("margin-right", m)
        return this
    }

    marginRight () {
        return this.getCssAttribute("margin-right")
    }

    // margin right px

    setMarginRightPx (m) {
        this.setPxCssAttribute("margin-right", m)
        return this
    }

    marginRightPx () {
        return this.getPxCssAttribute("margin-right")
    }

    // padding

    setPadding (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setPaddingTop(null)
        this.setPaddingBottom(null)
        this.setPaddingLeft(null)
        this.setPaddingRight(null)
        this.setCssAttribute("padding", v)
        return this
    }
    
    padding () {
        return this.getCssAttribute("padding")
    }

    // top

    setPaddingTop (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssAttribute("padding-top", v)
        return this
    }

    paddingTop () {
        return this.getCssAttribute("padding-top")
    }
    // bottom

    setPaddingBottom (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssAttribute("padding-bottom", v)
        return this
    }

    paddingBottom () {
        return this.getCssAttribute("padding-bottom")
    }

    // left

    setPaddingLeft (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssAttribute("padding-left", v)
        return this
    }

    paddingLeft () {
        return this.getCssAttribute("padding-left")
    }

    // right
    
    setPaddingRight (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssAttribute("padding-right", v)
        return this
    }

    paddingRight () {
        return this.getCssAttribute("padding-right")
    }

    // padding px

    setPaddingPx (aNumber) {
        this.setPxCssAttribute("padding", aNumber)
        return this
    }

    paddingPx () {
        return this.getPxCssAttribute("padding")
    }

    // padding right px

    setPaddingRightPx (aNumber) {
        this.setPxCssAttribute("padding-right", aNumber)
        return this
    }

    paddingRightPx () {
        return this.getPxCssAttribute("padding-right")
    }

    // padding left px

    setPaddingLeftPx (aNumber) {
        this.setPxCssAttribute("padding-left", aNumber)
        return this
    }

    paddingLeftPx () {
        return this.getPxCssAttribute("padding-left")
    }

    // padding top px

    setPaddingTopPx (aNumber) {
        this.setPxCssAttribute("padding-top", aNumber)
        return this
    }

    paddingTopPx () {
        return this.getPxCssAttribute("padding-top")
    }

    // padding bottom px

    setPaddingBottomPx (aNumber) {
        this.setPxCssAttribute("padding-bottom", aNumber)
        return this
    }

    paddingBottomPx () {
        return this.getPxCssAttribute("padding-bottom")
    }

    // background color

    setBackgroundColor (v) {
        this.setCssAttribute("background-color", v)
        return this
    }

    backgroundColor () {
        return this.getCssAttribute("background-color")
    }

    computedBackgroundColor () {
        return this.getComputedCssAttribute("background-color")
    }

    // background image

    setBackgroundImage (v) {
        this.setCssAttribute("background-image", v)
        return this
    }

    backgroundImage () {
        return this.getCssAttribute("background-image")
    }

    setBackgroundImageUrlPath (path) {
        this.setBackgroundImage("url(\"" + path + "\")")
        return this
    }

    // background size

    setBackgroundSizeWH (x, y) {
        this.setCssAttribute("background-size", x + "px " + y + "px")
        return this
    }

    setBackgroundSize (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssAttribute("background-size", v)
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
        this.setCssAttribute("background-repeat", s)
        return this
    }

    backgroundRepeat () {
        return this.getCssAttribute("background-repeat")
    }

    // background position

    makeBackgroundCentered () {
        this.setBackgroundPosition("center")
        return this
    }

    setBackgroundPosition (s) {
        this.setCssAttribute("background-position", s)
        return this
    }

    backgroundPosition () {
        return this.getCssAttribute("background-position")
    }

    // icons - TODO: find a better place for this

    pathForIconName (aName) {
        const pathSeparator = "/"
        return ["resources", "icons", aName + ".svg"].join(pathSeparator)
    }

    // transition

    setTransition (s) {
        this.setCssAttribute("transition", s)

        if (this._transitions) {
            this.transitions().syncFromDomView()
        }

        return this
    }

    transition () {
        return this.getCssAttribute("transition")
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
        this.setCssAttribute("transform", s)
        return this
    }

    setTransformOrigin (s) {
        //transform-origin: x-axis y-axis z-axis|initial|inherit;
        //const percentageString = this.percentageNumberToString(aNumber)
        this.setCssAttribute("transform-origin", s)
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
        this.setPxCssAttribute("perspective", n)
        return this
    }

    // opacity

    opacityValidatorFunction () {
        return (v) => { return Type.isNumber(v) || [null, "auto", "inherit", "initial", "unset"].contains(v) }
    }

    setOpacity (v) {
        //assert(this.opacityValidatorFunction()(v))
        this.setCssAttribute("opacity", v)
        return this
    }

    opacity () {
        return this.getCssAttribute("opacity")
    }

    // z index 

    setZIndex (v) {
        this.setCssAttribute("z-index", v)
        return this
    }

    zIndex () {
        return this.getCssAttribute("z-index")
    }

    // cursor 

    setCursor (s) {
        this.setCssAttribute("cursor", s)
        return this
    }

    cursor () {
        return this.getCssAttribute("cursor")
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
        this.setCssAttribute("top", v)
        return this
    }

    top () {
        return this.getCssAttribute("top")
    }

    // top px

    setTopPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssAttribute("top", v)
        return this
    }

    topPx () {
        return this.getPxCssAttribute("top")
    }

    // left

    setLeft (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssAttribute("left", v)
        return this
    }

    left () {
        return this.getCssAttribute("left")
    }

    // left px

    setLeftPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssAttribute("left", v)
        return this
    }

    leftPx () {
        return this.getPxCssAttribute("left")
    }

    // right

    setRight (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssAttribute("right", v)
        return this
    }


    right () {
        return this.getCssAttribute("right")
    }

    // right px

    setRightPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssAttribute("right", v)
        return this
    }

    rightPx () {
        return this.getPxCssAttribute("right")
    }

    // bottom

    setBottom (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssAttribute("bottom", v)
        return this
    }

    bottom () {
        return this.getCssAttribute("bottom")
    }

    // bottom px

    setBottomPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssAttribute("bottom", v)
        return this
    }

    bottomPx () {
        return this.getPxCssAttribute("bottom")
    }

    // float

    setFloat (v) {
        assert([null, "left", "right", "none", "inline-start", "inline-end", "start", "end", "initial", "inherit"].contains(v))
        this.setCssAttribute("float", v)
        return this
    }

    float () {
        return this.getCssAttribute("float")
    }

    // box shadow

    setBoxShadow (s) {
        //this.debugLog(".setBoxShadow(" + s + ")")
        this.setCssAttribute("box-shadow", s)
        return this
    }

    boxShadow () {
        return this.getCssAttribute("box-shadow")
    }

    // sizing

    setBoxSizing (s) {
        //this.setBoxSizing("border-box") content-box
        return this.setCssAttribute("box-sizing", s)
    }

    boxSizing () {
        return this.getCssAttribute("box-sizing")
    }


    // border 

    setBorder (s) {
        this.setCssAttribute("border", s)
        return this
    }

    border () {
        return this.getCssAttribute("border")
    }

    // border style

    setBorderStyle (s) {
        this.setCssAttribute("border-style", s)
        return this
    }

    borderStyle () {
        return this.getCssAttribute("border-style")
    }

    // border color

    setBorderColor (s) {
        this.setCssAttribute("border-color", s)
        return this
    }

    borderColor () {
        return this.getCssAttribute("border-color")
    }

    // border top

    setBorderTop (s) {
        this.setCssAttribute("border-top", s)
        return this
    }

    borderTop () {
        return this.getCssAttribute("border-top")
    }

    // border bottom

    setBorderBottom (s) {
        this.setCssAttribute("border-bottom", s)
        return this
    }

    borderBottom () {
        return this.getCssAttribute("border-bottom")
    }

    // border left

    setBorderLeft (s) {
        //this.debugLog(" border-left set '", s, "'")
        this.setCssAttribute("border-left", s)
        return this
    }

    borderLeft () {
        return this.getCssAttribute("border-left")
    }

    // border right

    setBorderRight (s) {
        this.setCssAttribute("border-right", s)
        return this
    }

    borderRight () {
        return this.getCssAttribute("border-right")
    }

    borderRightPx () {
        return this.getPxCssAttribute("border-right")
    }

    // border radius

    setBorderRadius (v) {
        assert(Type.isNull(v) || Type.isString(v))
        this.setCssAttribute("border-radius", v)
        return this
    }

    borderRadius () {
        return this.getCssAttribute("border-radius")
    }

    // border radius

    setBorderRadiusPx (v) {
        assert(Type.isNull(v) || Type.isNumber(v))
        this.setPxCssAttribute("border-radius", v)
        return this
    }

    borderRadiusPx () {
        return this.getPxCssAttribute("border-radius")
    }

    // outline

    setOutline (s) {
        assert(Type.isString(s) || Type.isNull(s))
        this.setCssAttribute("outline", s)
        return this
    }

    outline () {
        return this.getCssAttribute("outline")
    }

    // px line height

    setPxLineHeight (aNumber) {
        this.setPxCssAttribute("line-height", aNumber)
        assert(this.lineHeight() === aNumber)
        return this
    }

    pxLineHeight () {
        return this.getPxCssAttribute("line-height")
    }

    // line height

    setLineHeight (aString) {
        assert(Type.isString(aString) || Type.isNull(aString))
        this.setCssAttribute("line-height", aString)
        return this
    }

    lineHeight () {
        return this.getCssAttribute("line-height")
    }

    // alignment

    validTextAlignValues () {
        return [null, "left", "right", "center", "justify", "justify-all", "start", "end", "match-parent", "initial", "inherit", "unset"]
    }

    setTextAlign (v) {
        assert(this.validTextAlignValues().contains(v))
        this.setCssAttribute("text-align", v)
        return this
    }

    textAlign () {
        return this.getCssAttribute("text-align")
    }

    // clear

    setClear (v) {
        assert([null, "none", "left", "right", "both", "initial", "inherit"].contains(v))
        this.setCssAttribute("clear", v)
        return this
    }

    clear () {
        return this.getCssAttribute("clear")
    }

    // flex 

    setFlex (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssAttribute("flex", v)
        return this
    }

    flex () {
        return this.getCssAttribute("flex")
    }

    // flex wrap

    setFlexWrap (v) {
        assert(["nowrap", "wrap", "wrap-reverse", "initial", "inherit"].contains(v))
        this.setCssAttribute("flex-wrap", v)
        return this
    }

    flex () {
        return this.getCssAttribute("flex-wrap")
    }

    // flex order

    setOrder (v) {
        assert(Type.isNull(v) || Type.isNumber(v) || ["initial", "inherit"].contains(v))
        this.setCssAttribute("order", v)
        return this
    }

    order () {
        return this.getCssAttribute("order")
    }

    // flex align-items (flex-start, center, flex-end) - NOTE: alignment depends on direct of flex!

    setAlignItems (v) {
        assert([null, "flex-start", "center", "flex-end"].contains(v))
        this.setCssAttribute("align-items", v)
        return this
    }

    alignItems () {
        return this.getCssAttribute("align-items")
    }

    // flex justify-content (flex-start, center, flex-end) - NOTE: alignment depends on direct of flex!
    
    setJustifyContent (v) {
        assert([null, "flex-start", "center", "flex-end"].contains(v))
        this.setCssAttribute("justify-content", v)
        return this
    }

    justifyContent () {
        return this.getCssAttribute("justify-content")
    }

    // flex direction - (row, column)

    setFlexDirection (v) {
        this.setCssAttribute("flex-direction", v)
        return this
    }

    flexDirection () {
        return this.getCssAttribute("flex-direction")
    }

    // flex grow

    setFlexGrow (v) {
        this.setCssAttribute("flex-grow", v)
        return this
    }

    flexGrow () {
        return this.getCssAttribute("flex-grow")
    }

    // flex shrink

    setFlexShrink (v) {
        this.setCssAttribute("flex-shrink", v)
        return this
    }

    flexShrink () {
        return this.getCssAttribute("flex-shrink")
    }

    // flex basis

    setFlexBasis (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssAttribute("flex-basis", v)
        return this
    }

    flexBasis () {
        return this.getCssAttribute("flex-basis")
    }

    // color

    setColor (v) {
        this.setCssAttribute("color", v)
        return this
    }

    color () {
        return this.getCssAttribute("color")
    }

    // filters

    setFilter (s) {
        this.setCssAttribute("filter", s)
        return this
    }

    filter () {
        return this.getCssAttribute("filter")
    }

    // visibility

    setIsVisible (aBool) {
        const v = aBool ? "visible" : "hidden"
        this.setCssAttribute("visibility", v)
        return this
    }

    isVisible () {
        return this.getCssAttribute("visibility") !== "hidden";
    }

    // display

    setDisplay (s) {
        //assert(s in { "none", ...} );
        this.setCssAttribute("display", s)
        return this
    }

    display () {
        return this.getCssAttribute("display")
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

    setDisplayIsHidden (aBool) {
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
        this.setCssAttribute("visibility", s)
        return this
    }

    visibility () {
        return this.getCssAttribute("visibility")
    }

    // white space

    setWhiteSpace (s) {
        this.setCssAttribute("white-space", s)
        return this
    }

    whiteSpace () {
        return this.getCssAttribute("white-space")
    }


    // word-break

    setWordBreak (s) {
        assert(Type.isString(s))
        this.setCssAttribute("word-break", s)
        return this
    }

    wordBreak () {
        return this.getCssAttribute("word-break")
    }

    // webkit specific

    setWebkitOverflowScrolling (s) {
        assert(Type.isString(s))
        this.setCssAttribute("-webkit-overflow-scrolling", s)
        assert(this.webkitOverflowScrolling() === s)
        return this
    }

    webkitOverflowScrolling () {
        return this.getCssAttribute("-webkit-overflow-scrolling")
    }

    // ms specific 

    setMsOverflowStyle (s) {
        /* -ms-overflow-style: none; removes scrollbars on IE 10+  */
        assert(Type.isString(s))
        this.setCssAttribute("-ms-overflow-style", s)
        assert(this.msOverflowStyle() === s)
        return this
    }

    msOverflowStyle () {
        return this.getCssAttribute("-ms-overflow-style")
    }


    // overflow

    setOverflow (s) {
        assert(Type.isString(s))
        this.setCssAttribute("overflow", s)
        return this
    }

    overflow () {
        return this.getCssAttribute("overflow")
    }

    // overflow wrap

    setOverflowWrap (s) {
        assert(Type.isString(s))
        this.setCssAttribute("overflow-wrap", s)
        return this
    }

    overflowWrap () {
        return this.getCssAttribute("overflow-wrap")
    }

    // overflow x

    setOverflowX (s) {
        assert(Type.isString(s))
        this.setCssAttribute("overflow-x", s)
        return this
    }

    overflowX () {
        return this.getCssAttribute("overflow-x")
    }

    // overflow y

    setOverflowY (s) {
        assert(Type.isString(s))
        this.setCssAttribute("overflow-y", s)
        return this
    }

    overflowY () {
        return this.getCssAttribute("overflow-y")
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
        this.setCssAttribute("text-overflow", s)
        return this
    }

    textOverflow () {
        return this.getCssAttribute("text-overflow")
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
        const w = this.getComputedPxCssAttribute("width")
        return w
    }

    computedHeight () {
        const h = this.getComputedPxCssAttribute("height")
        return h
    }

    // desired size

    desiredWidth () {
        return this.calcCssWidth()
    }

    desiredHeight () {
        return this.calcCssHeight()
    }

    // calculated CSS size (outside of parent view)

    calcCssWidth () {
        if (this.display() === "none") {
            return 0
        }
        return DomTextTapeMeasure.shared().sizeOfCSSClassWithText(this.elementClassName(), this.innerHtml()).width;
    }

    calcCssHeight () {
        if (this.display() === "none") {
            return 0
        }
        return DomTextTapeMeasure.shared().sizeOfCSSClassWithText(this.element(), this.innerHtml()).height;
    }

    // calculated size (within parent view)

    calcWidth () {
        if (this.display() === "none") {
            return 0
        }
        return DomTextTapeMeasure.shared().sizeOfElementWithText(this.element(), this.innerHtml()).width;
    }

    calcHeight () {
        if (this.display() === "none") {
            return 0
        }
        return DomTextTapeMeasure.shared().sizeOfElementWithText(this.element(), this.innerHtml()).height;
    }

    // width

    setWidthString (v) {
        assert(Type.isString(v) || Type.isNull(v))
        this.setCssAttribute("width", v, () => { this.didChangeWidth() })
        return this
    }

    widthString () {
        return this.getCssAttribute("width")
    }

    setWidth (s) {
        this.setWidthString(s)
        return this
    }

    setWidthPercentage (aNumber) {
        const newValue = this.percentageNumberToString(aNumber)
        this.setCssAttribute("width", newValue, () => { this.didChangeWidth() })
        return this
    }

    /*
    hideScrollbar () {
        // need to do JS equivalent of: .class::-webkit-scrollbar { display: none; }
	    // this.setCssAttribute("-webkit-scrollbar", { display: "none" }) // doesn't work
	    return this
    }
    */

    // clientX - includes padding but not scrollbar, border, or margin

    clientWidth () {
        return this.element().clientWidth
    }

    clientHeight () {
        return this.element().clientHeight
    }

    // offsetX - includes borders, padding, scrollbar 

    offsetWidth () {
        return this.element().offsetWidth
    }

    offsetHeight () {
        return this.element().offsetHeight
    }

    // width px

    minWidthPx () {
        const s = this.getCssAttribute("min-width")
        // TODO: support em to px translation 
        return this.pxStringToNumber(s)
    }

    maxWidthPx () {
        const w = this.getCssAttribute("max-width")
        if (w === "") {
            return null
        }
        return this.pxStringToNumber(w)
    }

    // height px

    minHeightPx () {
        const s = this.getCssAttribute("min-height")
        // TODO: support em to px translation 
        return this.pxStringToNumber(s)
    }

    maxHeightPx () {
        const s = this.getCssAttribute("max-height")
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
        this.setCssAttribute("min-width", v, () => { this.didChangeWidth() })
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
            const w = this.getPxCssAttribute("flex-basis")
            assert(Type.isNumber(w))
            return w
        } else {
            const w1 = this.getPxCssAttribute("min-width")
            const w2 = this.getPxCssAttribute("max-width")
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
            const w = this.getPxCssAttribute("flex-basis")
            assert(Type.isNumber(w))
            return w
        } else {
            const w1 = this.getPxCssAttribute("min-width")
            const w2 = this.getPxCssAttribute("max-width")
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
        this.setCssAttribute("max-width", v, () => { this.didChangeWidth() })
        return this
    }

    setMinAndMaxWidth (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssAttribute("max-width", v, () => { this.didChangeWidth() })
        this.setCssAttribute("min-width", v, () => { this.didChangeWidth() })
        if (!Type.isNull(v)) {
            this.setCssAttribute("width", v, null) // avoids weird behavior but not ideal if min and max settings change do diff values
        }
        return this
    }

    setMinAndMaxHeight (v) {
        if (Type.isNumber(v)) {
            v = this.pxNumberToString(v)
        }
        this.setCssAttribute("min-height", v, () => { this.didChangeHeight() })
        this.setCssAttribute("max-height", v, () => { this.didChangeHeight() })
        if (!Type.isNull(v)) {
            this.setCssAttribute("height", v, null) // avoids weird behavior but not ideal if min and max settings change do diff values
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
        this.setCssAttribute("min-height", newValue, () => { this.didChangeHeight() })
        this.setCssAttribute("max-height", newValue, () => { this.didChangeHeight() })
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
        return this.getCssAttribute("max-height")
    }

    minHeight () {
        return this.getCssAttribute("min-height")
    }

    maxWidth () {
        return this.getCssAttribute("max-width")
    }

    minWidth () {
        return this.getCssAttribute("min-width")
    }

    setMinHeight (newValue) {
        assert(Type.isString(newValue) || Type.isNull(newValue))
        // <length> | <percentage> | auto | max-content | min-content | fit-content | fill-available
        this.setCssAttribute("min-height", newValue, () => { this.didChangeHeight() })
        return this
    }

    setMaxHeight (newValue) {
        assert(Type.isString(newValue) || Type.isNull(newValue))
        // <length> | <percentage> | none | max-content | min-content | fit-content | fill-available
        this.setCssAttribute("max-height", newValue, () => { this.didChangeHeight() })
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
        this.setCssAttribute("height", s, () => { this.didChangeHeight() })
        return this
    }

    height () {
        return this.getCssAttribute("height")
    }

    // --- innerHTML ---

    innerHtml () {
        return this.element().innerHTML
    }

    setInnerHtml (v) {
        this.element().innerHTML = v
        return this
    }

    setString (v) {
        return this.setInnerHtml(v)
    }

    string () {
        return this.innerHtml()
    }

    // ----

    innerText () {
        const e = this.element()
        return e.textContent || e.innerText || "";
    }

    // --- touch events ---

    setTouchAction (s) {
        this.setCssAttribute("-ms-touch-action", s) // needed?
        this.setCssAttribute("touch-action", s)
        return this
    }

    // scroll top

    setScrollTop (v) {
        this.element().scrollTop = v
        return this
    }

    scrollTop () {
        return this.element().scrollTop
    }

    // scroll width & scroll height

    scrollWidth () {
        return this.element().scrollWidth // a read-only value
    }

    scrollHeight () {
        return this.element().scrollHeight // a read-only value
    }

    // offset width & offset height

    offsetLeft () {
        return this.element().offsetLeft // a read-only value
    }

    offsetTop () {
        return this.element().offsetTop // a read-only value
    }

    boundingClientRect () {
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
        const box = this.element().getBoundingClientRect();
        return Point.clone().set(Math.round(box.left), Math.round(box.top));
    }

    sizeInViewport () {
        const box = this.element().getBoundingClientRect();
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
        this.setCssAttribute("vertical-align", s)
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
    

}.initThisClass());
