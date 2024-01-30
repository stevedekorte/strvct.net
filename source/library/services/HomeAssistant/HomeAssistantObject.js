"use strict";

/* 
    HomeAssistantObject

*/

(class HomeAssistantObject extends BMSummaryNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("group", null) // ref to HomeAssistantGroup subclass instance
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("owner", null)
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("name", "")
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("haJson", null)
      slot.setShouldStoreSlot(false);
    }

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

  init() {
    super.init();
    this.setTitle("");
    this.setCanDelete(true);
    this.setHaJson({});
  }
  
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setNodeSubtitleIsChildrenSummary(false);
    this.setSummaryFormat("key value");
    this.setNoteIsSubnodeCount(true);
  }

  jsonString () {
    return JSON.stringify(this.haJson(), 2, 2);
  }

  homeAssistant () {
    return this.group().homeAssistant();
//    return this.firstParentChainNodeOfClass(HomeAssistant)
  }

  area () {
    return this.firstParentChainNodeOfClass(HomeAssistantArea)
  }

  // --- connecting to owner ---

  ownerId () {
    throw new Error("subclasses should override");
  }

  ownerGroup () {
    throw new Error("subclasses should override");
  }

  findOwner () {
    return this.ownerGroup().objectWithId(this.ownerId());
  }

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

  addChild (node) {
    this.addSubnode(node);
  }

  completeSetup () {
    this.updateTitles();
  }

  updateTitles () {
    this.setTitle(this.computeShortName());
    this.setSubtitle(this.type().after("HomeAssistant"));
  }

  id () {
    throw new Error("subclasses should implement this method");
  }

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
