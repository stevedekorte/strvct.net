"use strict"

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


window.SvgIconView = class SvgIconView extends DomView {
    
    initPrototype () {
        this.newSlot("doesMatchParentColor", false)
        this.newSlot("svgString", "")
        this.newSlot("url", null)
        this.newSlot("iconName", null)
        this.newSlot("strokeColor", "white")
        this.newSlot("fillColor", "transparent")
        this.newSlot("strokeWidth", 1)
    }

    init () {
        super.init()
        this.setDivClassName("SvgIconView")
        this.turnOffUserSelect()
        this.setOverflow("hidden")

        //this.setPosition("absolute")
        //this.setTop(0)
        //this.setLeft(0)

        //this.setPadding(0)
        //this.setMargin(0)
        
        this.setOverflow("hidden")
        this.setTransition("all 0.2s")
        
        return this
    }

    setIconName (name) {
        const iconNode = BMIconResources.shared().firstSubnodeWithTitle(name)

        if (iconNode) {
            this.setSvgString(iconNode.svgString())
        } else {
            this.setSvgString(null)
            //throw new Error("can't find icon '" + name + "'") 
        }

        return this
    }

    setSvgString (s) {
        this._svgString = s
        this.setInnerHTML(s)
        this.updateAppearance()
        /*
        const style = this.svgElement().style
        //this.svgElement().setAttribute("preserveAspectRatio", "xMidYMin slice")

        if (Type.isUndefined(style)) {
            console.warn("missing style on svgElement")
        } else {
            style.position = "absolute"
            //style.top = "0px"
            //style.left = "0px"
        }
        */
        return this
    }

    svgElement () {
        return this.element().childNodes[0]
    }

    // didUpdateSlot

    setColor (aColor) {
        this.setFillColor(aColor)
        this.setStrokeColor(aColor)
        return this
    }

    didUpdateSlotFillColor (oldValue, newValue) {
        this.updateAppearance()
    }

    didUpdateSlotStrokeColor (oldValue, newValue) {
        this.updateAppearance()
    }

    // svg icon

    updateAppearance () {
        // sent by superview when it changes or syncs to a node
        // so we can update our appearance to match changes to the parent view's style

        const e = this.element()

        if (this.doesMatchParentColor()) {
            if (this.parentView()) {
                const color = this.parentView().getComputedCssAttribute("color")
                Element_setStyleIncludingDecendants(e, "fill", color)
                Element_setStyleIncludingDecendants(e, "stroke", color)
            } else {
                console.warn("missing svg parentView to match color to")
            }
        } else {
            Element_setStyleIncludingDecendants(e, "fill", this.fillColor())
            Element_setStyleIncludingDecendants(e, "stroke", this.strokeColor())
        }

        Element_setStyleIncludingDecendants(e, "strokeWidth", this.strokeWidth().toString())
        Element_setStyleIncludingDecendants(e, "transition", this.transition())

        return this
    }

    /*
    setupBackground () {
        // can't use this because we can't walk and set the fill/stroke style on the svg elements 
        // if it's a background image

        const url = this.pathForIconName(this.iconName())

        this.setBackgroundImageUrlPath(url)
        this.setBackgroundSizeWH(16, 16) // use "contain" instead?
        this.setBackgroundPosition("center")
        this.makeBackgroundNoRepeat()
        Element_setStyleIncludingDecendants(this.element(), "fill", "white")
        Element_setStyleIncludingDecendants(this.element(), "stroke", "white")
        Element_setStyleIncludingDecendants(this.element(), "color", "white")
    }

    asyncLoad () {
        // can't do this on a file:// because of cross site request error
        const url = this.pathForIconName(this.iconName())
        const rawFile = new XMLHttpRequest();
        rawFile.open("GET", url, false);
        rawFile.onreadystatechange = function () {
            if(rawFile.readyState === 4) {
                if(rawFile.status === 200 || rawFile.status === 0) {
                    const data = rawFile.responseText;
                    this.setSvgString(data)
                }
            }
        }
        rawFile.send(null);
    }
    */

}.initThisClass()
