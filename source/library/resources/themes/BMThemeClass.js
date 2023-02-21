"use strict";

/*

    BMThemeClass

*/

(class BMThemeClass extends BMThemeFolder {
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
    this.setTitle("Untitled " + this.thisClass().visibleClassName());
    this.setSubtitle("class")
    this.setCanDelete(true);
    this.addAction("add");
    this.setSubnodeClasses([BMThemeState, BMThemeFolder]);
    this.setNodeCanReorderSubnodes(true);
    this.removeAction("add")
  }

  /*
  setSubtitle (s) {
    if (this.subtitle() && (s === "" || s === null)) {
      debugger;
    }
    super.setSubtitle(s)
    return this
  }
  */

  didInit () {
    super.didInit();
    this.setSubtitle("class")
    //this.removeAction("add")

    //console.log(this.typeId() + " subnodes: ", this.subnodes())
    this.setupSubnodes();
  }

  subnodeNames () {
    return this.standardStateNames();
  }

  setupSubnodes () {
    const subnodeClass = this.subnodeClasses().first();
    this.subnodeNames().forEach((name) => {
      const subnode = this.subnodeWithTitleIfAbsentInsertProto(
        name,
        subnodeClass
      );
    });
  }

  // --- states ---

  activeThemeState () {
    return this.firstSubnodeWithTitle("active");
  }

  unselectedThemeState () {
    return this.firstSubnodeWithTitle("unselected");
  }

  selectedThemeState () {
    return this.firstSubnodeWithTitle("selected");
  }

  disabledThemeState () {
    return this.firstSubnodeWithTitle("disabled");
  }

  // --- default ---

  setupAsDefault() {
    this.setTitle("DefaultThemeClass");
    this.setupSubnodes();
    this.subnodes().forEach((sn) => sn.didInit());

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
    state.setThemeAttribute("opacity", "1");
  }

  setupDisabledDefault () {
    const state = this.disabledThemeState();
    state.setThemeAttribute("color", "#ccc");
    state.setThemeAttribute("backgroundColor", "transparent");
    //state.setThemeAttribute("fontWeight", "normal");
    state.setThemeAttribute("opacity", "0.5");
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

  // -- heplers ---

  themeAttributeNamed(name) {
    return this.firstSubnodeWithTitle(name);
  }

  themeSubclassNamed(name) {
    return this.firstSubnodeWithTitle(name);
  }

}.initThisClass());
