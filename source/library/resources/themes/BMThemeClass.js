/**
 * @module library.resources.themes
 */

/**
 * @class BMThemeClass
 * @extends BMThemeFolder
 * @classdesc
 * BMThemeClass represents a theme class in the theming system.
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
(class BMThemeClass extends BMThemeFolder {

  /**
   * @description Initializes the BMThemeClass instance.
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
    this.setSubnodeClasses([BMThemeState, BMThemeFolder]);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Performs final initialization of the BMThemeClass instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    if (!this.hasSubnodes()) {
      this.subnodeWithTitleIfAbsentInsertProto("states", BMThemeStates);
      this.subnodeWithTitleIfAbsentInsertProto("children", BMThemeClassChildren);
    }
  }

  /**
   * @description Returns the parent theme class of this instance.
   * @returns {BMThemeClass|null} The parent theme class or null if it's a root theme class.
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
   * @returns {BMThemeClass} This instance.
   * @category Setup
   */
  setupAsDefault() {
    this.setTitle("Tile");
    //this.setupSubnodes();
    this.states().setupAsDefault()
    this.children().addSubnode(BMThemeClass.clone().setTitle("HeaderTile"));
    this.children().addSubnode(BMThemeClass.clone().setTitle("BreadCrumbsTile"));
    return this;
  }

  /**
   * @description Returns the state with the given name.
   * @param {string} name - The name of the state to retrieve.
   * @returns {BMThemeState} The state with the given name.
   * @category State Management
   */
  stateWithName (name) {
    return this.states().stateWithName(name);
  }

  /**
   * @description Returns the states subnode of this theme class.
   * @returns {BMThemeStates} The states subnode.
   * @category State Management
   */
  states () {
    return this.firstSubnodeWithTitle("states");
  }

  /**
   * @description Returns the children subnode of this theme class.
   * @returns {BMThemeClassChildren} The children subnode.
   * @category Hierarchy
   */
  children () {
    return this.firstSubnodeWithTitle("children");
  }

  /**
   * @description Returns an array containing this theme class and all its descendant theme classes.
   * @returns {BMThemeClass[]} An array of theme classes.
   * @category Hierarchy
   */
  selfAndAllThemeChildren () {
    const children = this.children().subnodes().map(themeClass => themeClass.selfAndAllThemeChildren())
    return [this].concat(children.flat())
  }

}.initThisClass());