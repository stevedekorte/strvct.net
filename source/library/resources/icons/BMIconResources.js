/**
 * @module icons
 */

/**
 * @class BMIconResources
 * @extends BMResourceGroup
 * @classdesc BMIconResources
 * 
 * Hack to put SVG files into Javascript strings to avoid cross site loading issues.
 */
(class BMIconResources extends BMResourceGroup {

    /**
     * @description Initializes the BMIconResources instance.
     * @returns {BMIconResources} The initialized instance.
     */
    init() {
        super.init()
        this.setTitle("Icons")
        return this
    }

    /**
     * @description Sets up the BMIconResources instance.
     */
    setup() {
        super.setup();
        this.setResourceClasses([SvgIconNode]);
        this.setSubnodeClasses([SvgIconNode]);
    }

    // --- old code to add svg directly using a string ---

    /**
     * @description Adds an icon to the resources.
     * @param {string} aName - The name of the icon.
     * @param {string} svgString - The SVG string representation of the icon.
     * @returns {BMIconResources} The current instance.
     */
    addIcon(aName, svgString) {
        const node = SvgIconNode.clone().setTitle(aName).setSvgString(svgString)
        this.addSubnode(node)
        return this
    }

    /**
     * @description Retrieves an icon view by name.
     * @param {string} aName - The name of the icon to retrieve.
     * @returns {Object|null} The SVG icon view if found, null otherwise.
     */
    iconWithName(aName) {
        const node = this.firstSubnodeWithTitle(aName)
        if (node) {
            return node.svgIconView()
        }
        return null
    }

    /**
     * @description Gets an array of all icon names.
     * @returns {string[]} An array of icon names.
     */
    iconNames() {
        return this.subnodes().map(sn => sn.title())
    }

}.initThisClass());