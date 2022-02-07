"use strict";

/*
    
	BMIconResources
	
	Hack to put SVG files into Javascript strings to avoid cross site loading issues.
    
*/

(class BMIconResources extends BMNode {
	
	static initThisClass () {
        super.initThisClass()
		this.setIsSingleton(true)
		return this
	}
	
    initPrototype () {
	}
	
	init () {
		super.init()
		this.setTitle("Icons")
		this.setNoteIsSubnodeCount(true)
		this.addIcon("empty", null)
		return this
	}

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



