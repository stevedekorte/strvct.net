/**
 * @module library.resources.themes
 */

"use strict";

/**
 * @class BMTheme
 * @extends BMThemeFolder
 * @classdesc BMTheme class represents a theme in the application.
 * 
 * BMThemeResources.shared().activeTheme().newThemeClassOptions()
 */
(class BMTheme extends BMThemeFolder {
  
  /**
   * @description Initializes the prototype slots for the BMTheme class.
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the prototype for the BMTheme class.
   * @category Initialization
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled " + this.thisClass().visibleClassName());
    this.setSubtitle("theme")
    //this.setSubtitle("Theme")
    this.setCanDelete(true);
    this.setNodeCanAddSubnode(true);
    //this.setSubnodeClasses([BMThemeLevel]);
    this.setSubnodeClasses([BMThemeClass]);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Initializes a new instance of the BMTheme class.
   * @category Initialization
   */
  init () {
    super.init();
    //this.setupSubnodes()
  }

  /**
   * @description Sets up the theme as the default theme.
   * @returns {BMTheme} The current instance.
   * @category Setup
   */
  setupAsDefault () {
    debugger
    this.setTitle("DefaultTheme");
    const defaultThemeClass = BMThemeClass.clone().setupAsDefault();
    this.addSubnode(defaultThemeClass);
    return this;
  }

  // --- 

  /**
   * @description Retrieves a theme class by its name.
   * @param {string} name - The name of the theme class to retrieve.
   * @returns {BMThemeClass|null} The theme class with the given name, or null if not found.
   * @category Retrieval
   */
  themeClassNamed (name) {
    return this.firstSubnodeWithTitle(name);
  }

  /**
   * @description Gets an array of all theme class names.
   * @returns {string[]} An array of theme class names.
   * @category Retrieval
   */
  themeClassNames () {
    return this.subnodes().map(themeClass => themeClass.title());
  }

  /**
   * @description Creates new theme class options.
   * @returns {BMOptionsNode} The options node containing theme class options.
   * @category Creation
   */
  newThemeClassOptions () {
    const options = BMOptionsNode.clone();
    this.subnodes().forEach(themeClass => {
        const name = themeClass.title();
        const option = BMOptionNode.clone().setLabel(name).setValue(name);
        options.addSubnode(option);
    })
    return options
  }

  /**
   * @description Retrieves a theme class by its name from all theme classes.
   * @param {string} name - The name of the theme class to retrieve.
   * @returns {BMThemeClass|undefined} The theme class with the given name, or undefined if not found.
   * @category Retrieval
   */
  themeClassNamed (name) {
    return this.allThemeClasses().detect(themeClass => themeClass.title() === name);
/*
    const themeClass = this.firstSubnodeWithTitle(className);
    if (themeClass) {
      return themeClass.themeClassNamed(name);
    }
    return null;
    */
  }

  /**
   * @description Gets an array of all theme classes, including nested ones.
   * @returns {BMThemeClass[]} An array of all theme classes.
   * @category Retrieval
   */
  allThemeClasses () {
    return this.subnodes().map(themeClass => themeClass.selfAndAllThemeChildren()).flat();
  }

  /**
   * @description Creates a map of all theme classes, with their titles as keys.
   * @returns {Map<string, BMThemeClass>} A map of all theme classes.
   * @category Creation
   */
  allThemeClassesMap () {
    const map = new Map()
    this.allThemeClasses().forEach(themeClass => map.set(themeClass.title(), themeClass));
    return map
  }

  /**
   * @description Retrieves a state by its name.
   * @param {string} name - The name of the state to retrieve.
   * @returns {BMState|undefined} The state with the given name, or undefined if not found.
   * @category Retrieval
   */
  stateWithName (name) {
    return this.states().stateWithName(name);
  }

}.initThisClass());