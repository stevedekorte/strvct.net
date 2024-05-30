"use strict";

/*

    BMTheme


    BMThemeResources.shared().activeTheme().newThemeClassOptions()
*/

(class BMTheme extends BMThemeFolder {
  
  initPrototypeSlots () {
  }

  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled " + this.thisClass().visibleClassName());
    this.setSubtitle("theme")
    //this.setSubtitle("Theme")
    this.setCanDelete(true);
    this.setNodeCanAddSubnode(true);
    //this.setSubnodeClasses([BMThemeLevel]);
    this.setSubnodeClasses([BMThemeClass]);
    this.setNodeCanReorderSubnodes(true);
    //this.setupSubnodes()
  }

  setupAsDefault () {
    debugger
    this.setTitle("DefaultTheme");
    const defaultThemeClass = BMThemeClass.clone().setupAsDefault();
    this.addSubnode(defaultThemeClass);
    return this;
  }

  // --- 

  themeClassNamed (name) {
    return this.firstSubnodeWithTitle(name)
  }

  themeClassNames () {
    return this.subnodes().map(themeClass => themeClass.title())
  }

  newThemeClassOptions () {
    const options = BMOptionsNode.clone()
    this.subnodes().forEach(themeClass => {
        const name = themeClass.title()
        const option = BMOptionNode.clone().setLabel(name).setValue(name)
        options.addSubnode(option)
    })
    return options
  }

  themeClassNamed (name) {
    return this.allThemeClasses().detect(themeClass => themeClass.title() === name)
/*
    const themeClass = this.firstSubnodeWithTitle(className)
    if (themeClass) {
      return themeClass.themeClassNamed(name)
    }
    return null
    */
  }

  allThemeClasses () {
    return this.subnodes().map(themeClass => themeClass.selfAndAllThemeChildren()).flat()
  }

  allThemeClassesMap () {
    const map = new Map()
    this.allThemeClasses().forEach(themeClass => map.set(themeClass.title(), themeClass))
    return map
  }

  stateWithName (name) {
    return this.states().stateWithName(name)
  }

}.initThisClass());
