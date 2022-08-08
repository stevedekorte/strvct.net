"use strict";

/*
    CssDomView

    CSS related state and behavior.

*/

(class CssDomView extends BaseDomView {
    
    initPrototype () {
        // css hidden values

        this.newSlot("hiddenDisplayValue", undefined)
        this.newSlot("hiddenMinHeight", undefined)
        this.newSlot("hiddenMaxHeight", undefined)
        this.newSlot("hiddenTransitionValue", undefined)
    }

    init () {
        super.init()
        return this
    }


    // --- css ---
    
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

    setPointerEvents (s) {
        assert([null, 
            "auto", "none", "visiblePainted", 
            "visibleFill", "visibleStroke", "visible", 
            "painted", "fill", "stroke", "all", 
            "inherit", "initial", "unset"].contains(v))
        return this.setCssAttribute("pointer-events", s)
    }

    pointerEvents () {
        return this.getCssAttribute("pointer-events")
    }

    // transform

    setTextTransform (v) {
        assert([null, "none", "capitalize", "uppercase", "lowercase", "initial", "inherit"].contains(v))
        this.setCssAttribute("text-transform", v)
        return this
    }

    textTransform () {
        return this.getCssAttribute("text-transform")
    }

    // word wrap

    setWordWrap (v) {
        assert([null, "normal", "break-word", "initial", "inherit"].contains(v))
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

}.initThisClass());
