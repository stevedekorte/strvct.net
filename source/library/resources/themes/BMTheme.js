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
    this.addAction("add");
    //this.setSubnodeClasses([BMThemeLevel]);
    this.setSubnodeClasses([BMThemeClass, BMThemeFolder, BMThemeLeveledFolder]);
    this.setNodeCanReorderSubnodes(true);
    //this.setupSubnodes()
  }

  setupAsDefault () {
    this.setTitle("DefaultTheme");
    const defaultThemeClass = BMThemeClass.clone().setupAsDefault();
    this.addSubnode(defaultThemeClass);
    return this;
  }

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

}.initThisClass());
