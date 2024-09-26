/**
 * @module library.resources.themes.BMThemeStates
 */

/**
 * @class BMThemeStates
 * @extends BMThemeFolder
 * @classdesc Represents a collection of theme states.
 */
(class BMThemeStates extends BMThemeFolder {
  /**
   * @description Initializes the prototype slots for the class.
   */
  initPrototypeSlots () {
    /**
     * @member {Array} standardStateNames - An array of standard state names.
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
   */
  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);

    this.setNodeCanEditTitle(true);
    this.setTitle("States");
    this.setSubtitle("")
    this.setCanDelete(true);
    this.setSubnodeClasses([BMThemeState]);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Performs final initialization.
   */
  finalInit () {
    super.finalInit();
    this.setupSubnodes()
  }

  /**
   * @description Sets up the subnodes.
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
   * @returns {BMThemeState} The theme state with the given name.
   */
  stateWithName (name) {
    assert(this.standardStateNames().contains(name))
    return this.firstSubnodeWithTitle(name);
  }

  /**
   * @description Retrieves the active theme state.
   * @returns {BMThemeState} The active theme state.
   */
  activeThemeState () {
    return this.stateWithName("active");
  }

  /**
   * @description Retrieves the unselected theme state.
   * @returns {BMThemeState} The unselected theme state.
   */
  unselectedThemeState () {
    return this.stateWithName("unselected");
  }

  /**
   * @description Retrieves the selected theme state.
   * @returns {BMThemeState} The selected theme state.
   */
  selectedThemeState () {
    return this.stateWithName("selected");
  }

  /**
   * @description Retrieves the disabled theme state.
   * @returns {BMThemeState} The disabled theme state.
   */
  disabledThemeState () {
    return this.stateWithName("disabled");
  }

  /**
   * @description Sets up the instance as default.
   * @returns {BMThemeStates} The instance.
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
    const columns = BMThemeFolder.clone().setTitle("columns");
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
      const field = BMStringField.clone()
        .setKey("backgroundColor")
        .setValue(cssColorString);
      columns.addSubnode(field);
    });
  }
  */

}.initThisClass());