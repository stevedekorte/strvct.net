"use strict";

/*
    
  SvgIconNode
	
    
*/

(class SvgIconNode extends BMResource {

  static supportedExtensions() {
    return ["svg"]
  }

  initPrototype() {
    this.newSlot("svgString", null).setCanInspect(true).setSlotType("String").setLabel("SVG string")
    this.newSlot("error", null)
    //this.newSlot("path", null)
  }

  load() {
    this.setTitle(this.path().lastPathComponent().sansExtension())

    const rootFolder = BMFileResources.shared().rootFolder()
    const fileResource = rootFolder.nodeAtSubpathString(this.path())
    if (!fileResource) {
      const error = "no index for file resource at path '" + this.path() + "'"
      this.setError(error)
      throw new Error(error)
    }
    this.watchOnceForNoteFrom("resourceFileLoaded", fileResource)
    fileResource.load()
    return this
  }

  resourceFileLoaded(aNote) {
    const fileResource = aNote.sender()
    this.setSvgString(fileResource.data())
    this.postNoteNamed("resourceLoaded")
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



