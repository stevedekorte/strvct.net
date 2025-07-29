/**
 * @module library.resources.icons
 */

/**
 * @class SvIconResources
 * @extends SvResourceGroup
 * @classdesc SvIconResources
 * 
 * Hack to put SVG files into Javascript strings to avoid cross site loading issues.
 */
(class SvIconResources extends SvResourceGroup {

    /**
     * @description Initializes the SvIconResources instance.
     * @returns {SvIconResources} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setTitle("Icons")
        return this
    }

    /**
     * @description Sets up the SvIconResources instance.
     * @category Initialization
     */
    setup () {
        super.setup();
        this.setResourceClasses([SvgIconNode]);
        this.setSubnodeClasses([SvgIconNode]);
    }

    // --- old code to add svg directly using a string ---

    /**
     * @description Adds an icon to the resources.
     * @param {string} aName - The name of the icon.
     * @param {string} svgString - The SVG string representation of the icon.
     * @returns {SvIconResources} The current instance.
     * @category Icon Management
     */
    addIcon (aName, svgString) {
        const node = SvgIconNode.clone().setTitle(aName).setSvgString(svgString)
        this.addSubnode(node)
        return this
    }

    /**
     * @description Retrieves an icon view by name.
     * @param {string} aName - The name of the icon to retrieve.
     * @returns {Object|null} The SVG icon view if found, null otherwise.
     * @category Icon Retrieval
     */
    iconWithName (aName) {
        const node = this.firstSubnodeWithTitle(aName)
        if (node) {
            return node.svgIconView()
        }
        return null
    }

    /**
     * @description Gets an array of all icon names.
     * @returns {string[]} An array of icon names.
     * @category Icon Retrieval
     */
    iconNames () {
        return this.subnodes().map(sn => sn.title())
    }

    preCacheWhereAppropriate () {
        // no precaching for icons
    }   

}.initThisClass());