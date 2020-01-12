"use strict"

/*
    
	SvgIconNode
	
    
*/

window.SvgIconNode = class SvgIconNode extends BMNode {
    
    initPrototype () {
      this.newSlot("svgString", null).setCanInspect(true).setSlotType("String").setLabel("SVG string")
    }

    svgIconView () {
      const icon = SvgIconView.clone().setSvgString(this.svgString())
      return icons
    }
    
    note () {
      return "&gt;"
    }

    noteIconName () {
      return this.title()
    }

}.initThisClass()



