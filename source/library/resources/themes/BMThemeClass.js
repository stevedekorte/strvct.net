"use strict";

/*

    BMThemeClass

    Notes on attribute lookup:

    If we have the following path of theme classes:

      Default -(child)-> Tile -(child)-> TextTile

    Example lookup path for a selected TextTile:

      TextTile/selected   -> Tile/selected   -> Default->selected
      TextTile/unselected -> Tile/unselected -> Default->unselected
      TextTile/disabled   -> Tile/disabled   -> Default->disabled

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

  finalInit () {
    super.finalInit();
    if (!this.hasSubnodes()) {
      this.subnodeWithTitleIfAbsentInsertProto("states", BMThemeStates);
      this.subnodeWithTitleIfAbsentInsertProto("children", BMThemeClassChildren);
    }
  }

  parentThemeClass () {
    const parentChildrenNode = this.parentNode()
    if (parentChildrenNode.title() !== "children") {
      // it's a root themeClass under the Theme
      return null
    }
    if (parentChildrenNode) {
        const parentThemeClass = parentChildrenNode.parentNode()
        return parentThemeClass
    }
    return null
 }

  // --- default ---

  setupAsDefault() {
    this.setTitle("Tile");
    //this.setupSubnodes();
    this.states().setupAsDefault()
    this.children().addSubnode(BMThemeClass.clone().setTitle("HeaderTile"));
    this.children().addSubnode(BMThemeClass.clone().setTitle("BreadCrumbsTile"));
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
