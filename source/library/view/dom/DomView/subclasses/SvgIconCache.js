"use strict";

/**
 * @module library.view.dom.DomView.subclasses.SvgIconCache
 */

/**
 * @class SvgIconCache
 * @extends ProtoClass
 * @classdesc Singleton that manages cached Svg objects in document.
 */
(class SvgIconCache extends ProtoClass {

    /**
     * @static
     * @description Initializes the class as a singleton.
     */
    static initClass () {
        this.setIsSingleton(true)
    }

    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
        /**
         * @property {Map} hashToElementMap - Map to store hash to element mappings.
         */
        {
            const slot = this.newSlot("hashToElementMap", new Map());
            slot.setSlotType("Map");
        }
        /**
         * @property {Element} svgCacheElement - The SVG cache element.
         */
        {
            const slot = this.newSlot("svgCacheElement", null);
            slot.setSlotType("Element");
        }
    }

    /**
     * @description Generates an SVG ID for a given string.
     * @param {string} s - The input string.
     * @returns {string} The generated SVG ID.
     */
    svgIdForString (s) {
        return "SvgId-" + s.hashCode();
    }

    /**
     * @description Generates an SVG content ID for a given string.
     * @param {string} s - The input string.
     * @returns {string} The generated SVG content ID.
     */
    svgContentIdForString (s) {
        return "SvgContentId-" + s.hashCode();
    }

    /**
     * @description Caches an SVG for a given string if it's not already cached.
     * @param {string} s - The input string.
     * @returns {Element} The cached SVG element.
     */
    cacheSvgForStringIfNeeded (s) {
        const map = this.hashToElementMap()
        const h = this.svgIdForString(s)
        if (!map.has(h)) {
            assert(document.getElementById(h) === null)
            const e = this.elementForSvgString(s)
            assert(e.id === h)
            this.svgCacheElement().appendChild(e)
            assert(document.getElementById(h) !== null)
            map.set(h, e)
        }
        return map.at(h)
    }

    /**
     * @description Gets or creates the SVG cache element.
     * @returns {Element} The SVG cache element.
     */
    svgCacheElement () {
        if (!this._svgCacheElement) {
            const e = document.createElement("defs");
            e.id = "SvgIconCache"
            e.style.display = "none"
            document.body.appendChild(e)
            this._svgCacheElement = e
        }
        return this._svgCacheElement
    }

    /**
     * @description Creates an SVG element from an SVG string.
     * @param {string} s - The SVG string.
     * @returns {Element} The created SVG element.
     */
    elementForSvgString (s) {
        // NOTES: 
        // - style.position of SVG needs to be absolute if in a flex container
        // - need to use createElementNS and setAttributeNS or things silently fail (e.g. width being 0)
 
        const xmlns = "http://www.w3.org/2000/svg";

        // create a temporary element to put innerHTML in so we can extract svg element
        const e = document.createElement("g"); 
        e.innerHTML = s

        // get the SVG element (as there may be comments, etc
        const svg = e.getElementsByTagName("svg")[0]
        svg.id = this.svgIdForString(s)
        svg.style.position = "absolute" 

        // to be able to reference the svg content from a use tag, 
        // we need to group the content into a g tag and add an id
        //const content = svg.addSymbolLayer()
        const content = svg.addSvgGroupLayer()
        content.id = this.svgContentIdForString(s)

        // set up fill, stroke as variables and remove them from descendants
        // this only works if we want them to be uniform, as we typically do for icons
        // and it lets us set the colors without creating a new icon
        svg.setAttributesAndRemoveFromDecendants(this.variableAttributeMap()) 
        //svg.setAttribute("preserveAspectRatio", "xMidYMin slice")
        return svg
    }

    /**
     * @description Creates a new link element for an SVG string.
     * @param {string} s - The SVG string.
     * @returns {Element} The created SVG link element.
     */
    newLinkElementForSvgString (s) {
        const cachedSvg = this.cacheSvgForStringIfNeeded(s)
        // e.g. <use xlink:href="#fire" />
        const xmlns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(xmlns, "svg");
        svg.copyAttributesFrom(cachedSvg)
        /*
        svg.setAttributeNS(xmlns, "x", "0")
        svg.setAttributeNS(xmlns, "y", "0")
        svg.setAttributeNS(xmlns, "width", "100%")
        svg.setAttributeNS(xmlns, "height", "100%")
        */
        svg.copyStyleFrom(cachedSvg)

        // need this to avoid zero width issue
        // https://stackoverflow.com/questions/58792503/why-is-svg-width-0-if-container-is-display-flex
        svg.style.position = "absolute" 

        const use = document.createElementNS(xmlns, "use"); // is document.createElementNS needed?
        use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + this.svgContentIdForString(s))
        //use.style.width = "100%"
        //use.style.height = "100%"
        //use.style.width = "15px"
        //use.style.height = "15px"
        //use.style.overflow = "visible"
        //use.setAttribute("width", "100%")
        //use.setAttribute("height", "100%")
        svg.appendChild(use)
        return svg
    }
 
    /**
     * @description Returns a map of variable attributes for SVG elements.
     * @returns {Map} The variable attribute map.
     */
    variableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--fillColor)")
        m.set("stroke", "var(--strokeColor)")
        //m.set("strokeWidth", "var(--strokeWidth)")
        //m.set("transition", "var(--transition)")
        return m
    }

    /*
    parentVariableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--color)")
        m.set("stroke", "var(--color)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }
    */


}.initThisClass());