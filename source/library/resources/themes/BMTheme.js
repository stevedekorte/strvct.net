"use strict";

/*

    BMTheme

*/

(class BMTheme extends BMStorableNode {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled " + this.thisClass().visibleClassName());
    //this.setSubtitle("Theme")
    this.setCanDelete(true);
    this.addAction("add");
    //this.setSubnodeClasses([BMThemeLevel]);
    this.setSubnodeClasses([BMThemeClass, BMThemeFolder]);
    this.setNodeCanReorderSubnodes(true);
    //this.setupSubnodes()
  }

  setupAsDefault() {
    this.setTitle("DefaultTheme");
    const defaultThemeClass = BMThemeClass.clone().setupAsDefault();
    this.addSubnode(defaultThemeClass);
    return this;
  }

  themeClassNamed (name) {
    return this.firstSubnodeWithTitle(name)
  }

}.initThisClass());
