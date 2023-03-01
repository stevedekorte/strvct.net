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

  load () {
    this.loadFileResource() 
    return this
  }

  didLoad () {
    super.didLoad()
    this.setSvgString(this.data())
    return this
  }

  svgIconView () {
    // TODO: this view stuff probably shouldn't be in the model
    const icon = SvgIconView.clone().setSvgString(this.svgString())
    return icon
  }

  noteIconName () {
    return this.title()
  }

}.initThisClass());



