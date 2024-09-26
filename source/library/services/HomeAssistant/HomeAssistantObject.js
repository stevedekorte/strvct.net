"use strict";

/**
 * @module library.services.HomeAssistant
 */

/**
 * @class HomeAssistantObject
 * @extends BMSummaryNode
 * @classdesc Represents a HomeAssistant object with various properties and methods for managing its state and relationships.
 */
(class HomeAssistantObject extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the HomeAssistantObject.
   */
  initPrototypeSlots () {

    /**
     * @member {HomeAssistantGroup|null} group - Reference to HomeAssistantGroup subclass instance.
     */
    {
      const slot = this.newSlot("group", null)
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {Object|null} owner - The owner of this HomeAssistantObject.
     */
    {
      const slot = this.newSlot("owner", null)
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {string} name - The name of the HomeAssistantObject.
     */
    {
      const slot = this.newSlot("name", "")
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {Object|null} haJson - The Home Assistant JSON data.
     */
    {
      const slot = this.newSlot("haJson", null)
      slot.setShouldStoreSlot(false);
    }

    /**
     * @member {string} jsonString - The JSON string representation of the haJson.
     */
    {
      const slot = this.newSlot("jsonString", "");
      slot.setCanEditInspection(false);
      slot.setCanInspect(true);
      //slot.setInspectorPath("Info");
      slot.setLabel("json");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the HomeAssistantObject.
   */
  init() {
    super.init();
    this.setTitle("");
    this.setCanDelete(true);
    this.setHaJson({});
  }
  
  /**
   * @description Performs final initialization of the HomeAssistantObject.
   */
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setNodeSubtitleIsChildrenSummary(false);
    this.setSummaryFormat("key value");
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * @description Returns the JSON string representation of the haJson.
   * @returns {string} The JSON string.
   */
  jsonString () {
    return JSON.stringify(this.haJson(), 2, 2);
  }

  /**
   * @description Returns the HomeAssistant instance.
   * @returns {HomeAssistant} The HomeAssistant instance.
   */
  homeAssistant () {
    return this.group().homeAssistant();
//    return this.firstParentChainNodeOfClass(HomeAssistant)
  }

  /**
   * @description Returns the HomeAssistantArea instance.
   * @returns {HomeAssistantArea} The HomeAssistantArea instance.
   */
  area () {
    return this.firstParentChainNodeOfClass(HomeAssistantArea)
  }

  /**
   * @description Returns the owner ID.
   * @throws {Error} Subclasses should override this method.
   */
  ownerId () {
    throw new Error("subclasses should override");
  }

  /**
   * @description Returns the owner group.
   * @throws {Error} Subclasses should override this method.
   */
  ownerGroup () {
    throw new Error("subclasses should override");
  }

  /**
   * @description Finds and returns the owner object.
   * @returns {Object} The owner object.
   */
  findOwner () {
    return this.ownerGroup().objectWithId(this.ownerId());
  }

  /**
   * @description Connects this object to its owner.
   * @returns {HomeAssistantObject} This instance.
   */
  connectObjects () {
    const owner = this.findOwner();
    if (owner) {
      this.setOwner(owner);
      owner.addChild(this);
    } else{
      console.warn(this.type() + " " + this.id() + " unable to find owner with id " + this.ownerId())
    }
    return this;
  }

  /**
   * @description Adds a child node to this object.
   * @param {Object} node - The node to add as a child.
   */
  addChild (node) {
    this.addSubnode(node);
  }

  /**
   * @description Completes the setup of this object.
   */
  completeSetup () {
    this.updateTitles();
  }

  /**
   * @description Updates the title and subtitle of this object.
   */
  updateTitles () {
    this.setTitle(this.computeShortName());
    this.setSubtitle(this.type().after("HomeAssistant"));
  }

  /**
   * @description Returns the ID of this object.
   * @throws {Error} Subclasses should implement this method.
   */
  id () {
    throw new Error("subclasses should implement this method");
  }

  /**
   * @description Returns the parent chain path as a string.
   * @returns {string} The parent chain path.
   */
  parentChainPath () {
    return this.parentChainNodes().map(node => {
      return node.type() + " \"" + node.title() + "\"";
    }).join(" / ");
  }

  /*
  title () {
    return this.computeShortName();
  }
  */

  /**
   * @description Computes and returns the short name of this object.
   * @returns {string} The computed short name.
   */
  computeShortName () {
    let name = this.name();
    const owner = this.findOwner();
    //console.log("", this.parentChainPath());
    //debugger;
    if (owner) {
      const prefix = owner.title();
      if (name.beginsWith(prefix) && name !== prefix) {
        name = name.after(prefix);
      }
    }
    return name;
  }

}).initThisClass();