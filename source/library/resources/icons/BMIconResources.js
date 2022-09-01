"use strict";

/*
    
	BMIconResources
	
	Hack to put SVG files into Javascript strings to avoid cross site loading issues.
    
*/

(class BMIconResources extends BMResourceGroup {

	init () {
		super.init()
		this.setTitle("Icons")
		return this
	}

	setup () {
        // subclasses need to use this to set ResourceClasses
        this.setResourceClasses([SvgIconNode])
    }

	/*
	setupSubnodes () {
		super.setupSubnodes()
		return this
	}
	*/

	// --- old code to add svg directly using a string ---

    addIcon (aName, svgString) {
		const node = SvgIconNode.clone().setTitle(aName).setSvgString(svgString)
		this.addSubnode(node)
        return this
	}
	
	iconWithName (aName) {
		const node = this.subnodeWithTitle(aName)
		if (node) {
			return node.svgIconView()
		}
		return null
	}

	iconNames () {
		return this.subnodes().map(sn => sn.title())
	}

}.initThisClass());



