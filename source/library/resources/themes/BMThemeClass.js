"use strict";

/*

    BMThemeClass

*/

(class BMThemeClass extends BMThemeFolder {

  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);

    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled " + this.thisClass().visibleClassName());
    this.setSubtitle("class")
    this.setCanDelete(true);
    this.setSubnodeClasses([BMThemeState, BMThemeFolder]);
    this.setNodeCanReorderSubnodes(true);
  }

  initForNonDeserialization () {
    super.initForNonDeserialization();
    this.setSubtitle("class")
    this.setupSubnodes();
  }

  setupSubnodes () {
    debugger
    if (!this.hasSubnodes()) {
      this.subnodeWithTitleIfAbsentInsertProto("states", BMThemeStates);
      this.subnodeWithTitleIfAbsentInsertProto("children", BMThemeClassChildren);
    }
  }

  // --- default ---

  setupAsDefault() {
    this.setTitle("Tile");
    this.setupSubnodes();
    this.states().setupAsDefault()
    return this;
  }

  stateWithName (name) {
    return this.states().stateWithName(name);
  }

  states () {
    return this.firstSubnodeWithTitle("states");
  }

  children () {
    return this.firstSubnodeWithTitle("children");
  }

  selfAndAllThemeChildren () {
    const children = this.children().subnodes().map(themeClass => themeClass.selfAndAllThemeChildren())
    return [this].concat(children.flat())
  }

}.initThisClass());
