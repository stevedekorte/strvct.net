"use strict";

/* 
    JsonSchemaNode

*/

(class JsonSchemaNode extends BMSummaryNode {

  static initClass () {
    return this;
  }

  setupSlotsFromJsonSchema (schema) {

    const properties = schema.properties;

    if (properties) {
      Object.keys(properties).forEach(key => {
        const propertySchema = properties[key];
        const slot = this.newSlot(key);
        if (slot) {
          slot.setJsonSchema(propertySchema);
        }
      });
    }

    const items = schema.items;

    if (items) {
      assert(items.anyOf);
      const classNames = items.anyOf.map(item => {
        const definition = item["$ref"];
        assert(defintion);
        return JsonSchema.classNameForRef(definition);
      });
      
      // verify that these are all subclasses of JsonGroup
      classNames.forEach(className => {
        const aClass = getGlobalThis()[className];
        assert(aClass !== undefined, "missing class '" + className + "'");
        assert(aClass.isClass && aClass.isClass(), "'" + className + "' is not a class");
      });
      this.setSubnodeClasses(classNames);
    }

    const required = schema.required;

    if (required) {
      required.forEach(key => {
        this.slotNamed(key).setIsRequired(true);
      });
    }
  }

  initPrototypeSlots () {

    {
      const slot = this.newSlot("schemaString", "");
      slot.setInspectorPath("schemaString");
      slot.setShouldJsonArchive(false);
      slot.setCanEditInspection(true);
      slot.setDuplicateOp("duplicate");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setIsSubnodeFieldVisible(true);
      slot.setSummaryFormat("key");
      slot.setSyncsToView(true);
      slot.setNodeFillsRemainingWidth(true);
    }
  }
  
  initPrototype () {
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanEditTitle(false);
    this.setSummaryFormat("key");
    this.setHasNewlineAfterSummary(true);
  }

  didInit () {
    super.didInit()
    const json = this.thisClass().asRootJsonSchema(); //TODO
    this.setSchemaString(JSON.stringify(json, 2, 2)); //TODO
    return this;
  }

  title () {
    return this.basicInformation().name();

    const name = this.basicInformation().name();
    const health = this.combatStats().healthDescription();
    if (health) {
      return name + " (" + health + ")"
    }

    return name;
  }


  /*
  setTitle (s) {
    super.setTitle(s)
    this.basicInformation().setName(s)
    return this
  }
  */

  name () {
    return this.basicInformation().name();
  }

  subtitle () {
    const parts = [this.basicInformation().description().trim()];
    /*
    if (this.basicInformation().creatureType() === "Humanoid") {
      //parts.push("character");
    }
    */
    return parts.join(" ")
  }

  characterId () {
    return this.basicInformation().characterId()
  }

  playerProfile () {
    if (this.parentNode()) {
      return this.parentNode().parentNode();
    }
    else {
      return null;
    }
  }

  setCharacterId (cid) {
    this.basicInformation().setCharacterId(cid)
    return this
  }

  setJsonArchive (json) {
    debugger;
    this.setJson(json)
    return this
  }

  updateJson (json) {
    // we assume it's a patch if it's an array
    if (Type.isArray(json)) { 
      this.applyJsonPatches(json)
    } else {
      super.updateJson(json)
    }
    return this
  }

  didUpdateNode () {
    super.didUpdateNode()

    //console.log("Character '" + this.name() + "' didUpdateNode " + EventManager.shared().currentEventName() + " isUserInput:" + EventManager.shared().currentEventIsUserInput())
    if (EventManager.shared().currentEventIsUserInput()) {
      //console.log(this.type() + " '" + this.name() + "' didUpdateNode (FROM USER INPUT)")
      if (this.player()) {
        this.scheduleMethod("shareUiUpdate")
      }
    }
  }

  shareUiUpdate () {
    console.log(this.type() + " '" + this.name() + "' shareUiUpdate")
    this.player().session().onLocalUiUpdateCharacter(this)
  }

  setupAsSample () {
    this.subnodes().forEach(sn => {
      if (sn.setupAsSample) {
        sn.setupAsSample();
      }
    })
    return this
  }

  updateMsgJson () {
    const json = {
      name: "updateCharacter",
      characterId: this.characterId(),
      payload: this.asJson() // special case JSON representation which we also share with AI
    }
    if (this.player()) {
      json.playerId = this.player().playerId()
    }
    return json;
  }

  jsonString () {
    return JSON.stringify(this.asJson(), 2, 2);
  }

  static jsonSchemaProperties (refSet) {
    //debugger;
    const json = super.jsonSchemaProperties(refSet);
    /*
    if (!Type.isUndefined(json)) {
      const s = JSON.stringify(json, 2, 2);
      assert(!s.includes("schemaString"));
    }
    */
    return json;
  }

  asJson () {
    // we want to limit to just the slots that are json archivable

    const slots = this.thisClass().jsonSchemaSlots();
    const dict = {};

    slots.forEach(slot => {
      const value = slot.onInstanceGetValue(this);
      dict[value.title()] = value.asJson();
    });

    return dict;
  }

}.initThisClass());
