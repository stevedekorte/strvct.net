/**
 * @module library.resources.themes
 */

/**
 * @class SvThemeStates
 * @extends SvThemeFolder
 * @classdesc Represents a collection of theme states.
 */
(class SvThemeStates extends SvThemeFolder {
  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {Array} standardStateNames - An array of standard state names.
     * @category Configuration
     */
    {
      const slot =this.newSlot("standardStateNames", [
        "disabled",
        "unselected", 
        "selected", 
        "active"
      ]);
      slot.setSlotType("Array");
    }
  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);

    this.setNodeCanEditTitle(true);
    this.setTitle("States");
    this.setSubtitle("")
    this.setCanDelete(true);
    this.setSubnodeClasses([SvThemeState]);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Performs final initialization.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    this.setupSubnodes()
  }

  /**
   * @description Sets up the subnodes.
   * @category Initialization
   */
  setupSubnodes () {
    if (!this.hasSubnodes()) {
      const subnodeClass = this.subnodeClasses().first();
      this.standardStateNames().forEach((name) => {
        const subnode = this.subnodeWithTitleIfAbsentInsertProto(
          name,
          subnodeClass
        );
      });
    }
  }

  /**
   * @description Retrieves a state with the given name.
   * @param {string} name - The name of the state to retrieve.
   * @returns {SvThemeState} The theme state with the given name.
   * @category State Retrieval
   */
  stateWithName (name) {
    assert(this.standardStateNames().contains(name))
    return this.firstSubnodeWithTitle(name);
  }

  /**
   * @description Retrieves the active theme state.
   * @returns {SvThemeState} The active theme state.
   * @category State Retrieval
   */
  activeThemeState () {
    return this.stateWithName("active");
  }

  /**
   * @description Retrieves the unselected theme state.
   * @returns {SvThemeState} The unselected theme state.
   * @category State Retrieval
   */
  unselectedThemeState () {
    return this.stateWithName("unselected");
  }

  /**
   * @description Retrieves the selected theme state.
   * @returns {SvThemeState} The selected theme state.
   * @category State Retrieval
   */
  selectedThemeState () {
    return this.stateWithName("selected");
  }

  /**
   * @description Retrieves the disabled theme state.
   * @returns {SvThemeState} The disabled theme state.
   * @category State Retrieval
   */
  disabledThemeState () {
    return this.stateWithName("disabled");
  }

  /**
   * @description Sets up the instance as default.
   * @returns {SvThemeStates} The instance.
   * @category Initialization
   */
  setupAsDefault () {
    this.setTitle("states");
    this.setupSubnodes();

    this.subnodes().forEach(state => state.setupAsDefault())
    //this.setupColumnsDefault()
    return this;
  }

  /*
  setupColumnsDefault () {
    const columns = SvThemeFolder.clone().setTitle("columns");
    this.addSubnode(columns);

    const colors = [
      [60, 60, 60],
      [48, 48, 48],
      [32, 32, 32],
      [26, 26, 26],
      [16, 16, 16],
    ];

    colors.forEach((c) => {
      const cssColorString = "rgb(" + c.join(",") + ")";
      const field = SvStringField.clone()
        .setKey("backgroundColor")
        .setValue(cssColorString);
      columns.addSubnode(field);
    });
  }
  */

}.initThisClass());