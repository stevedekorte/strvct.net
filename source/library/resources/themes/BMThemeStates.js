"use strict";

/*

    BMThemeStates

*/

(class BMThemeStates extends BMThemeFolder {
  initPrototypeSlots () {
      this.newSlot("standardStateNames", [
        "disabled",
        "unselected", 
        "selected", 
        "active"
      ]);
  }

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

  finalInit () {
    super.finalInit();
    this.setupSubnodes()
  }

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

  // --- states ---

  stateWithName (name) {
    assert(this.standardStateNames().contains(name))
    return this.firstSubnodeWithTitle(name);
  }

  activeThemeState () {
    return this.stateWithName("active");
  }

  unselectedThemeState () {
    return this.stateWithName("unselected");
  }

  selectedThemeState () {
    return this.stateWithName("selected");
  }

  disabledThemeState () {
    return this.stateWithName("disabled");
  }

  // --- default ---

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
