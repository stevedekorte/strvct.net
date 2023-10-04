"use strict";

/*
    
  SvgIconNode
	
    
*/

(class SvgIconNode extends BMResource {

  static supportedExtensions () {
    return ["svg"]
  }

  initPrototypeSlots () {
    {
      const slot = this.newSlot("svgString", null)
      slot.setCanInspect(true)
      slot.setSlotType("String")
      slot.setLabel("SVG string")
    }
  }

  didLoad () {
    super.didLoad()
    //debugger
    this.setSvgString(this.urlResource().dataAsText())
    return this
  }

  svgIconView () {
    // TODO: this view stuff probably shouldn't be in the model
    debugger
    const icon = SvgIconView.clone().setSvgString(this.svgString())
    return icon
  }

  noteIconName () {
    return this.title()
  }

}.initThisClass());



