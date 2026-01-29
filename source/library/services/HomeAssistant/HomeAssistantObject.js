"use strict";

/**
 * @module library.services.HomeAssistant
 */

/**
 * @class HomeAssistantObject
 * @extends SvSummaryNode
 * @classdesc Represents a HomeAssistant object with various properties and methods for managing its state and relationships.
 */
(class HomeAssistantObject extends SvSummaryNode {
    /**
   * @description Initializes the prototype slots for the HomeAssistantObject.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {HomeAssistantGroup|null} group - Reference to HomeAssistantGroup subclass instance.
     * @category Relationships
     */
        {
            const slot = this.newSlot("group", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("HomeAssistantGroup");
        }

        /**
     * @member {Object|null} owner - The owner of this HomeAssistantObject.
     * @category Relationships
     */
        {
            const slot = this.newSlot("owner", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Object");
        }

        /**
     * @member {string} name - The name of the HomeAssistantObject.
     * @category Identification
     */
        {
            const slot = this.newSlot("name", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        /**
     * @member {Object|null} haJson - The Home Assistant JSON data.
     * @category Data
     */
        {
            const slot = this.newSlot("haJson", null);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("JSON Object");
        }

        /**
     * @member {string} jsonString - The JSON string representation of the haJson.
     * @category Data
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
   * @category Initialization
   */
    init () {
        super.init();
        this.setTitle("");
        this.setCanDelete(true);
        this.setHaJson({});
    }

    /**
   * @description Performs final initialization of the HomeAssistantObject.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setCanDelete(true);
        this.setNodeCanEditTitle(true);
        this.setNodeSubtitleIsChildrenSummary(false);
        this.setSummaryFormat("key value");
        this.setNoteIsSubnodeCount(true);
    }

    jsonString () {
        return JSON.stableStringifyWithStdOptions(this.haJson(), null, 2);
    }

    /**
   * @description Returns the HomeAssistant instance.
   * @returns {HomeAssistant} The HomeAssistant instance.
   * @category Relationships
   */
    homeAssistant () {
        return this.group().homeAssistant();
        //    return this.firstParentChainNodeOfClass(HomeAssistant)
    }

    /**
   * @description Returns the HomeAssistantArea instance.
   * @returns {HomeAssistantArea} The HomeAssistantArea instance.
   * @category Relationships
   */
    area () {
        return this.firstParentChainNodeOfClass(HomeAssistantArea);
    }

    /**
   * @description Returns the owner ID.
   * @throws {Error} Subclasses should override this method.
   * @category Relationships
   */
    ownerId () {
        throw new Error("subclasses should override");
    }

    /**
   * @description Returns the owner group.
   * @throws {Error} Subclasses should override this method.
   * @category Relationships
   */
    ownerGroup () {
        throw new Error("subclasses should override");
    }

    /**
   * @description Finds and returns the owner object.
   * @returns {Object} The owner object.
   * @category Relationships
   */
    findOwner () {
        return this.ownerGroup().objectWithId(this.ownerId());
    }

    /**
   * @description Connects this object to its owner.
   * @returns {HomeAssistantObject} This instance.
   * @category Relationships
   */
    connectObjects () {
        const owner = this.findOwner();
        if (owner) {
            this.setOwner(owner);
            owner.addChild(this);
        } else {
            console.warn(this.svType() + " " + this.id() + " unable to find owner with id " + this.ownerId());
        }
        return this;
    }

    /**
   * @description Adds a child node to this object.
   * @param {Object} node - The node to add as a child.
   * @category Relationships
   */
    addChild (node) {
        this.addSubnode(node);
    }

    /**
   * @description Completes the setup of this object.
   * @category Initialization
   */
    completeSetup () {
        this.updateTitles();
    }

    /**
   * @description Updates the title and subtitle of this object.
   * @category Display
   */
    updateTitles () {
        this.setTitle(this.computeShortName());
        this.setSubtitle(this.svType().after("HomeAssistant"));
    }

    /**
   * @description Returns the ID of this object.
   * @throws {Error} Subclasses should implement this method.
   * @category Identification
   */
    id () {
        throw new Error("subclasses should implement this method");
    }

    /**
   * @description Returns the parent chain path as a string.
   * @returns {string} The parent chain path.
   * @category Relationships
   */
    parentChainPath () {
        return this.parentChainNodes().map(node => {
            return node.svType() + " \"" + node.title() + "\"";
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
   * @category Display
   */
    computeShortName () {
        let name = this.name();
        const owner = this.findOwner();
        //console.log("", this.parentChainPath());

        if (owner) {
            const prefix = owner.title();
            if (name.beginsWith(prefix) && name !== prefix) {
                name = name.after(prefix);
            }
        }
        return name;
    }

}).initThisClass();
