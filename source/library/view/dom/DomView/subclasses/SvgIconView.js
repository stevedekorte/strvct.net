"use strict";

/*

    SvgIconView

    A view to render scalable SVG within a view that can be 
    synced to match the color of the parent view's text color by
    getting the computed color and applying it to the fill or stroke of the
    svg views.

    TODO: support disabled/uneditable color style?


    Example use:

    SvgIconView.clone().setIconName("add")

*/

(class SvgIconView extends FlexDomView {
    
    static initClass () {
        this.newClassSlot("sharedSvgMap", new Map()) // svgStringHash -> hidden svg element defined in document
		return this
    }

    initPrototypeSlots () {
        this.newSlot("svgElement", null)
        this.newSlot("svgString", "")
        this.newSlot("url", null)
        this.newSlot("iconName", null)
        
        this.newSlot("doesMatchParentColor", false).setDoesHookSetter(true)
        this.newSlot("strokeColor", "white").setDoesHookSetter(true)
        this.newSlot("fillColor", "transparent").setDoesHookSetter(true)
        this.newSlot("strokeWidth", 1).setDoesHookSetter(true)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setElementClassName("SvgIconView")
        this.turnOffUserSelect()
        this.setOverflow("hidden")

        //this.setPosition("absolute")
        //this.setTopPx(0)
        //this.setLeftPx(0)

        this.setPadding("0em")
        this.setMargin("0em")
        
        // /this.setOverflow("hidden")
        this.setOverflow("visible")
        this.setTransition("all 0.2s")
        //this.setBorder("1px yellow dashed")


        return this
    }

    debugTypeId () {
        const name = this.iconName()
        return  super.debugTypeId() + (name ? " '" + name + "'" : "")
    }

    setIconName (name) {
        this._iconName = name

        if (name) {
            const iconNode = BMIconResources.shared().firstSubnodeWithTitle(name)

            if (iconNode) {
                this.setSvgString(iconNode.svgString())
                this.unhideDisplay()
            } else {
                this.setSvgString(null)
                const error = "can't find icon '" + name + "'"
                console.log(error)
                debugger;
                //throw new Error(error) 
            }
        } else {
            this.setSvgString(null)
            this.hideDisplay()
        }

        this.setElementId(this.debugTypeId() + " '" + this.svgId() + "'")

        return this
    }

    svgId () {
        return "svgid-" + this.iconName() 
        //return "svgid-" + this.svgString().hashCode()
    }

    setSvgString (s) {
        this._svgString = s

        const e = SvgIconCache.shared().newLinkElementForSvgString(s)
        // remove other children and add svg element
        while (this.element().lastChild) {
            this.element().removeChild(this.element().lastChild);
        }
        this.element().appendChild(e)
        this.setSvgElement(e)
        //e.style.border = "1px blue dashed"

        return this
    }

    // --- color ---

    setColor (aColor) {
        this.setFillColor(aColor)
        this.setStrokeColor(aColor)
        return this
    }
        
    // --- didUpdateSlot hooks ---


    didUpdateSlotFillColor (oldValue, newValue) {
        this.setSpecialCssProperty("--fillColor", newValue)
    }

    didUpdateSlotStrokeColor (oldValue, newValue) {
        this.setSpecialCssProperty("--strokeColor", newValue)
    }

    didUpdateSlotStrokeWidth (oldValue, newValue) {
        this.setSpecialCssProperty("--strokeWidth", newValue)
    }

    // --- variable maps ---
    
    variableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--fillColor)")
        m.set("stroke", "var(--strokeColor)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }

    parentVariableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--color)")
        m.set("stroke", "var(--color)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }

    /*
    asyncLoad () {
        // can't do this on a file:// because of cross site request error
        const url = this.pathForIconName(this.iconName())
        const rawFile = new XMLHttpRequest();
        rawFile.open("GET", url, false);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status === 0) {
                    const data = rawFile.responseText;
                    this.setSvgString(data)
                }
            }
        }
        rawFile.send(null);
    }
    */

}.initThisClass());
