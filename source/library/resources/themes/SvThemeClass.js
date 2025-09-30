/**
 * @module library.resources.themes
 */

/**
 * @class SvThemeClass
 * @extends SvThemeFolder
 * @classdesc
 * SvThemeClass represents a theme class in the theming system.
 * 
 * Notes on attribute lookup:
 * 
 * If we have the following path of theme classes:
 * 
 *   Default -(child)-> Tile -(child)-> TextTile
 * 
 * Example lookup path for a selected TextTile:
 * 
 *   TextTile/selected   -> Tile/selected   -> Default->selected
 *   TextTile/unselected -> Tile/unselected -> Default->unselected
 *   TextTile/disabled   -> Tile/disabled   -> Default->disabled
 */
(class SvThemeClass extends SvThemeFolder {

  /**
   * @description Initializes the SvThemeClass instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);

    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled " + this.thisClass().visibleClassName());
    this.setSubtitle("class")
    this.setCanDelete(true);
    this.setSubnodeClasses([SvThemeState, SvThemeFolder]);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Performs final initialization of the SvThemeClass instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    if (!this.hasSubnodes()) {
      this.subnodeWithTitleIfAbsentInsertProto("states", SvThemeStates);
      this.subnodeWithTitleIfAbsentInsertProto("children", SvThemeClassChildren);
    }
  }

  /**
   * @description Returns the parent theme class of this instance.
   * @returns {SvThemeClass|null} The parent theme class or null if it's a root theme class.
   * @category Hierarchy
   */
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

  /**
   * @description Sets up this instance as the default theme class.
   * @returns {SvThemeClass} This instance.
   * @category Setup
   */
  setupAsDefault () {
    this.setTitle("Tile");
    //this.setupSubnodes();
    this.states().setupAsDefault()
    this.children().addSubnode(SvThemeClass.clone().setTitle("HeaderTile"));
    this.children().addSubnode(SvThemeClass.clone().setTitle("BreadCrumbsTile"));
    return this;
  }

  /**
   * @description Returns the state with the given name.
   * @param {string} name - The name of the state to retrieve.
   * @returns {SvThemeState} The state with the given name.
   * @category State Management
   */
  stateWithName (name) {
    return this.states().stateWithName(name);
  }

  /**
   * @description Returns the states subnode of this theme class.
   * @returns {SvThemeStates} The states subnode.
   * @category State Management
   */
  states () {
    return this.firstSubnodeWithTitle("states");
  }

  /**
   * @description Returns the children subnode of this theme class.
   * @returns {SvThemeClassChildren} The children subnode.
   * @category Hierarchy
   */
  children () {
    return this.firstSubnodeWithTitle("children");
  }

  /**
   * @description Returns an array containing this theme class and all its descendant theme classes.
   * @returns {SvThemeClass[]} An array of theme classes.
   * @category Hierarchy
   */
  selfAndAllThemeChildren () {
    const children = this.children().subnodes().map(themeClass => themeClass.selfAndAllThemeChildren())
    return [this].concat(children.flat())
  }

}.initThisClass());