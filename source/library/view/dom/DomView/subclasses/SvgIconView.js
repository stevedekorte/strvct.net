/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class SvgIconView
 * @extends FlexDomView
 * @classdesc A view to render scalable SVG within a view that can be
 * synced to match the color of the parent view's text color by
 * getting the computed color and applying it to the fill or stroke of the
 * svg views.
 *
 * TODO: support disabled/uneditable color style?
 *
 * Example use:
 *
 * SvgIconView.clone().setIconName("add")
 */
"use strict";

(class SvgIconView extends FlexDomView {

    /**
     * @static
     * @description Initializes the class by creating a new class slot.
     * @category Initialization
     */
    static initClass () {
        this.newClassSlot("sharedSvgMap", new Map()); // svgStringHash -> hidden svg element defined in document
    }

    /**
     * @description Initializes the prototype slots for the SvgIconView.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Element} svgElement
         * @category SVG
         */
        {
            const slot = this.newSlot("svgElement", null);
            slot.setSlotType("Element");
        }
        /**
         * @member {String} svgString
         * @category SVG
         */
        {
            const slot = this.newSlot("svgString", "");
            slot.setSlotType("String");
        }
        /**
         * @member {URL} url
         * @category Resource
         */
        {
            const slot = this.newSlot("url", null);
            slot.setSlotType("URL");
        }
        /**
         * @member {String} iconName
         * @category IconCreative
         */
        {
            const slot = this.newSlot("iconName", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Boolean} doesMatchParentColor
         * @category Styling
         */
        {
            const slot = this.newSlot("doesMatchParentColor", false);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {String} strokeColor
         * @category Styling
         */
        {
            const slot = this.newSlot("strokeColor", "white");
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
        }
        /**
         * @member {String} fillColor
         * @category Styling
         */
        {
            const slot = this.newSlot("fillColor", "white");
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
        }
        /**
         * @member {Number} strokeWidth
         * @category Styling
         */
        {
            const slot = this.newSlot("strokeWidth", 1);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the SvgIconView.
     * @returns {SvgIconView}
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setElementClassName("SvgIconView");
        this.turnOffUserSelect();
        this.setOverflow("hidden");

        this.setPadding("0em");
        this.setMargin("0em");

        this.setOverflow("visible");
        this.syncColors();

        return this;
    }

    /**
     * @description Returns a debug type ID for the icon.
     * @returns {string}
     * @category Debugging
     */
    svDebugId () {
        const name = this.iconName();
        return  super.svDebugId() + (name ? " '" + name + "'" : "");
    }

    /**
     * @description Clears the SVG string and hides the display.
     * @category SVG
     */
    clear () {
        this.setSvgString(null);
        this.hideDisplay();
    }

    /**
     * @description Sets the icon name and updates the SVG string.
     * @param {string} name - The name of the icon.
     * @returns {SvgIconView}
     * @category Icon
     */
    setIconName (name) {
        if (this._iconName !== name) {
            this._iconName = name;

            if (name === null) {
                this.clear();
                return this;
            }

            const icons = SvIconResources.shared();
            const iconNode = icons.firstSubnodeWithTitle(name);

            if (iconNode) {
                this.setSvgString(iconNode.svgString());
                this.unhideDisplay();
            } else {
                const error = "can't find icon '" + name + "'";
                console.error(this.logPrefix(), error);

                this.clear();
                return this;
            }

            this.setElementId(this.svDebugId() + " '" + this.svgId() + "'");
        }

        return this;
    }

    /**
     * @description Returns the SVG ID.
     * @returns {string}
     * @category SVG
     */
    svgId () {
        return "svgid-" + this.iconName();
    }

    /**
     * @description Sets the SVG string and updates the element.
     * @param {string} s - The SVG string.
     * @returns {SvgIconView}
     * @category SVG
     */
    setSvgString (s) {
        this._svgString = s;

        if (s) {
            // remove and old svg element
            while (this.element().lastChild) {
                this.element().removeChild(this.element().lastChild);
            }

            // add svg element
            const e = SvgIconCache.shared().newLinkElementForSvgString(s);
            this.element().appendChild(e);
            this.setSvgElement(e);
        }

        return this;
    }

    /**
     * @description Sets both fill and stroke colors.
     * @param {string} aColor - The color to set.
     * @returns {SvgIconView}
     * @category Styling
     */
    setColor (aColor) {
        this.setFillColor(aColor);
        this.setStrokeColor(aColor);
        return this;
    }

    /**
     * @description Synchronizes the colors with the CSS properties.
     * @category Styling
     */
    syncColors () {
        const style = this.element().style;
        style.setProperty("--fillColor", this.fillColor());
        style.setProperty("--strokeColor", this.strokeColor());
        style.setProperty("--strokeWidth", this.strokeWidth());
    }

    /**
     * @description Updates the fill color CSS property.
     * @param {string} oldValue - The old fill color.
     * @param {string} newValue - The new fill color.
     * @category Styling
     */
    didUpdateSlotFillColor (oldValue, newValue) {
        this.setCssProperty("--fillColor", newValue);
    }

    /**
     * @description Updates the stroke color CSS property.
     * @param {string} oldValue - The old stroke color.
     * @param {string} newValue - The new stroke color.
     * @category Styling
     */
    didUpdateSlotStrokeColor (oldValue, newValue) {
        this.setCssProperty("--strokeColor", newValue);
    }

    /**
     * @description Updates the stroke width CSS property.
     * @param {number} oldValue - The old stroke width.
     * @param {number} newValue - The new stroke width.
     * @category Styling
     */
    didUpdateSlotStrokeWidth (oldValue, newValue) {
        this.setCssProperty("--strokeWidth", newValue);
    }

    /**
     * @description Returns a map of variable attributes.
     * @returns {Map}
     * @category Styling
     */
    variableAttributeMap () {
        const m = new Map();
        m.set("fill", "var(--fillColor)");
        m.set("stroke", "var(--strokeColor)");
        m.set("strokeWidth", "var(--strokeWidth)");
        m.set("transition", "var(--transition)");
        return m;
    }

    /**
     * @description Returns a map of parent variable attributes.
     * @returns {Map}
     * @category Styling
     */
    parentVariableAttributeMap () {
        const m = new Map();
        m.set("fill", "var(--color)");
        m.set("stroke", "var(--color)");
        m.set("strokeWidth", "var(--strokeWidth)");
        m.set("transition", "var(--transition)");
        return m;
    }

}.initThisClass());
