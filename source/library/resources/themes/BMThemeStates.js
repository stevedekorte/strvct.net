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

  initForNonDeserialization () {
    super.initForNonDeserialization();
    this.setupSubnodes();
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
    return this.firstSubnodeWithTitle("active");
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

    this.setupActiveDefault();
    this.setupUnselectedDefault();
    this.setupSelectedDefault();
    this.setupDisabledDefault();

    //this.setupColumnsDefault()
    return this;
  }

  // --- default states ---

  setupActiveDefault () {
    const state = this.activeThemeState();
    //state.setColor("white")
    //state.setBackgroundColor("#333")
    state.setThemeAttribute("color", "white");
    state.setThemeAttribute("backgroundColor", "#333");
    //state.setThemeAttribute("fontWeight", "normal");
    state.setThemeAttribute("paddingLeft", "22px");
    state.setThemeAttribute("paddingRight", "22px");
    state.setThemeAttribute("paddingTop", "8px");
    state.setThemeAttribute("paddingBottom", "8px");

  }

  setupUnselectedDefault () {
    const state = this.unselectedThemeState();
    state.setThemeAttribute("color", "#bbb");
    state.setThemeAttribute("backgroundColor", "transparent");
    //state.setThemeAttribute("fontWeight", "normal");
  }

  setupSelectedDefault () {
    const state = this.selectedThemeState();
    state.setThemeAttribute("color", "white");
    state.setThemeAttribute("backgroundColor", "#222");
    //state.setThemeAttribute("fontWeight", "normal");
  }

  setupDisabledDefault () {
    const state = this.disabledThemeState();
    state.setThemeAttribute("color", "#ccc");
    //state.setThemeAttribute("backgroundColor", "transparent");
    //state.setThemeAttribute("fontWeight", "normal");
  }

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

}.initThisClass());
