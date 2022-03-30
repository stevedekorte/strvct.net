"use strict";

/*
    
  SvgIconNode
	
    
*/

(class SvgIconNode extends BMResource {

  static supportedExtensions () {
    return ["svg"]
  }

  initPrototype() {
    this.newSlot("svgString", null).setCanInspect(true).setSlotType("String").setLabel("SVG string")
    //this.newSlot("path", null)
  }

  load () {
    this.setTitle(this.path().lastPathComponent().sansExtension())
    return this
  }

  svgIconView() {
    const icon = SvgIconView.clone().setSvgString(this.svgString())
    return icon
  }

  noteIconName() {
    return this.title()
  }

}.initThisClass());



