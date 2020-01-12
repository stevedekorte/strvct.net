"use strict"

/*
    
	BMIconResources
	
	Hack to put SVG files into Javascript strings to avoid cross site loading issues.
    
*/

window.BMIconResources = class BMIconResources extends BMNode {
    
    initPrototype () {
	}
	
	init () {
		super.init()
		this.setTitle("Icons")
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

}.initThisClass()



