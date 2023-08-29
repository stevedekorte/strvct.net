"use strict";

/*

    HwPromptComposer

*/

(class HwPromptComposer extends BMSummaryNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("configJson", null);
    }

    {
        const slot = this.newSlot("composedPrompt", "");
        //slot.setInspectorPath("")
        slot.setLabel("composed prompt")
        slot.setShouldStoreSlot(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("String");
        slot.setIsSubnodeField(true);
        slot.setSyncsToView(true)
        //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("completedPrompt", "");
      //slot.setInspectorPath("")
      slot.setLabel("completed prompt")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setSyncsToView(true)
      //slot.setValidValues(values)
  }

    {
      const slot = this.newSlot("composeAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Compose");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("compose");
    }

  }

  init () {
    super.init();

    this.addAction("add");
    this.setCanDelete(false);
    this.setNodeCanEditTitle(false);
    this.setTitle("Prompt Composer");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
  }


  finalInit () {
    super.finalInit();
    //this.setupSessionOptions()
  }

  subtitle () {
    let prompt = this.completedPrompt()
    if (prompt.length > 0) {
      if (prompt.includes("ERROR")) {
        return "ERROR"
      }
      return "complete"
    }
    return "?"
  }

  sessionSettings () {
    return this.parentNode()
  }

  prepareToAccess () {
    this.compose()
  }

  // --- config json resource ---

  baseConfigJson () {
    return this.sessionSettings().thisPrototype().slotNamed("genre").validValues()
  }

  configJsonCopy () {
    const configJson = JSON.parse(JSON.stringify(this.baseConfigJson())) // deep copy, so we can mess with protos on our copy
    return configJson
  }

  /*
  selectedPathComponents () {
      // example item: 
      // {
      //  "label": "Curse of Strahd",
      //  "value": "Curse of Strahd",
      //  "path": ["Fantasy", "Dungeons & Dragons", "Curse of Strahd"]
      // }

    const items = this.sessionSettings().genreOptions()
    const item = items.first()
    const pathComponents = item.path;
    return pathComponents
  }

  selectedItem () {
      //const pathComponents = this.selectedPathComponents()
      //const dict = this.dictAtPath(this.baseConfigJson(), pathComponents)
  }
  */

  selectedItem () {
    const configDict = { options: this.configJsonCopy(), prompt: "", promptPrefix: "", promptSuffix: "" }
    const selectedLabel = this.sessionSettings().genre()
    const item = this.findItemWithLabel(configDict, selectedLabel)
    this.setupProtosOnJsonDict(configDict)
    return item
  }

  compose () {

    const item = this.selectedItem()
    if (!item) {
      this.setComposedPrompt("")
    }

    //debugger
    const parts = [item.promptPrefix,  item.prompt, item.promptSuffix]
    console.log("composed prompt parts: ", JSON.stringify(parts, 2, 2))
    const prompt = parts.join("")
    this.setComposedPrompt(prompt)

    let s = this.replacedConfigString(prompt)
    s += "\n\n" + this.sessionSettings().customInstructions();

    this.setCompletedPrompt(s)

    return this
  }

  // --- setup dict protos ---

  setupProtosOnJsonDict (dict, parentDict) {
    if (parentDict) {
      dict.__proto__ = parentDict
    }

    if (dict.hasOwnProperty("options")) {
      dict.options.forEach(subDict => {
        this.setupProtosOnJsonDict(subDict, dict)
      })
    }
  }

  setupProtosOnJsonArray (jsonArray, parentJson) {
    if (parentJson) {
      json.proto = parentJson
    }
    if (json.hasOwnProperty("options")) {
      json.options.forEach(subJson => {
        this.setupProtosOnJson(subJson, json)
      })
    }
  }

  // --- get dict at path ---

  /*
  dictAtPath (json, pathComponents) {
    const optionName = pathComponents.shift()
    if (optionName && json.hasOwnProperty("options")) {
      json = json.options.detect(option => option.label === optionName)
      assert(json)
      return this.dictAtPath(json, pathComponents)
    }
    return json
  }
  */

  // --- get dict with label ---

  findItemWithLabel (json, label) {
    //console.log("json.label: " + json.label + " =?= " +label)
    if (json.hasOwnProperty("label") && json.label === label) {
      return json
    }
    if (json.hasOwnProperty("options")) {
      return json.options.detectAndReturnValue(option => {
        return this.findItemWithLabel(option, label)
      })
      
    }
    return null
  }

  // --- player info ---

  session () {
    return this.sessionSettings().session()
  }

  players () {
    return this.session().players().subnodes()
  }

  playerNamesString () {
    if (this.players().length === 0) {
      return "\n\n[ERROR: NO PLAYERS TO PROVIDE PLAYER NAMES]\n\n"
    }
    return this.players().map(player => player.nickname()).join(", ");
  }

  playerCharacterSheetsString () {
    if (this.players().length === 0) {
      return "\n\n[ERROR: NO PLAYERS TO PROVIDE CHARACTER SHEETS]\n\n"
    }
    const sheetsJson = this.players().map(player => player.characterSheetJson());
    return JSON.stringify(sheetsJson);
  }

  selectedItemLabelString () {
    const item = this.selectedItem()
    return item ? item.label : "\n\n[ERROR: NO SELECTED ITEM]\n\n"
  }

  replacedConfigString (s) {
    s = s.replaceAll("[selectedItemLabel]", this.selectedItemLabelString());
    s = s.replaceAll("[playerNames]", this.playerNamesString());
    s = s.replaceAll("[playerCharacterSheets]", this.playerCharacterSheetsString());
    return s;
  }


}).initThisClass();


