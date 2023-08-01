import ParserInterface from "@3d-dice/dice-parser-interface";

(class RollPanelView extends View {
  //Public
  initPublicPrototypeSlots() {
    this.newSlot("isMouseOver", false);
  }

  character() {
    return this.characterTextField().value();
  }

  setCharacter(character) {
    this.characterTextField().setValue(character);
    return this;
  }

  notation() {
    let notation = this.countTextField().value();
    notation += this.dieOptionsView().selectedValue();
    notation += this.rollTypeOptionsView().selectedValue();
    notation += this.modifierTextField().value();
    return notation;
  }

  setNotation(notation) {
    this.parser().parseNotation(notation)[0];
    const parsedNotation = this.parser().parsedNotation;
    //console.log(parsedNotation);
    const die = parsedNotation.head || parsedNotation;
    this.countTextField().setValue(String(die.count.value));
    this.dieOptionsView().setSelectedValue('d' + String(die.die.value));
    if (parsedNotation.ops && parsedNotation.ops.length > 0) {
      const op = parsedNotation.ops[0];
      this.modifierTextField().setValue(op.op + String(op.tail.value))
    }
    const mod = die.mods[0];
    if (mod) {
      if (mod.highlow == 'h') {
        this.rollTypeOptionsView().setSelectedValue('kh1')
      }
      else if (mod.highlow == 'l') {
        this.rollTypeOptionsView().setSelectedValue('kl1')
      }
    }
    return this;
  }

  rollTarget() {
    return parseInt(this.targetTextField().value());
  }

  setRollTarget(rollTarget) {
    rollTarget = parseInt(rollTarget);
    if (isNaN(rollTarget)) {
      rollTarget = "";
    }
    this.targetTextField().setValue(rollTarget);
    return this;
  }

  async roll() {
    const dv = DiceRollView.shared();
    dv.setCharacter(this.character())
    dv.setNotation(this.notation())
    dv.setRollTarget(this.rollTarget());
    this.hide();
    await dv.roll();
    setTimeout(() => { dv.clear() }, 500);
    AiChatColumn.shared().messageInput().appendText(dv.outcomeDescription());
    if (this.shouldSendImmediately()) {
      AiChatColumn.shared().addPrompt();
    }
    else {
      AiChatColumn.shared().messageInput().appendText("\n");
    }
    return this;
  }

  show() {
    this.element().style.display = 'flex';
    return this;
  }

  positionRelativeTo(element) {
    const elementRect = element.getBoundingClientRect();
    const myRect = this.element().getBoundingClientRect();
    this.element().style.position = 'absolute';
    this.element().style.left = String(elementRect.left - (myRect.width - elementRect.width)/2) + "px";

    let top = elementRect.top - myRect.height;
    if (top < 0) {
      top = elementRect.top + elementRect.height;
    }
    this.element().style.top = String(top) + "px";
  }

  hide() {
    this.element().style.display = 'none';
  }


  //Internal
  initPrototypeSlots() {
    super.initPrototypeSlots();
    
    this.initPublicPrototypeSlots();

    //Internal
    this.newSlot("characterTextField", null);
    this.newSlot("dieOptionsView", null);
    this.newSlot("countTextField", null);
    this.newSlot("modifierTextField", null);
    this.newSlot("rollTypeOptionsView", null);
    this.newSlot("targetTextField", null);
    this.newSlot("sendImmediatelyCheckbox", null);
    this.newSlot("rollButton", null);
    this.newSlot("cancelButton", null);

    this.newSlot("parser", null);
  }

  init() {
    super.init();
    this.setId("rollPanelView");
    this.setParser(new ParserInterface());
  }

  initElement() {
    super.initElement();

    this.setCharacterTextField(TextFieldView.clone().setId("rollPanelCharacter"));
    this.setCountTextField(TextFieldView.clone().setId("rollPanelCount"));
    this.setDieOptionsView(OptionsView.clone().setId("rollPanelDie"));
    this.setModifierTextField(TextFieldView.clone().setId("rollPanelModifier"));
    this.setRollTypeOptionsView(OptionsView.clone().setId("rollPanelRollType"));
    this.setTargetTextField(TextFieldView.clone().setId("rollPanelTarget"));
    //this.setSendImmediatelyCheckbox(CheckboxView.clone().setId("rollPanelSendImmediately"));
    this.setRollButton(Button.clone().setId("rollPanelRollButton").setTarget(this).setAction("roll"));
    this.setCancelButton(Button.clone().setId("rollPanelCancelButton").setTarget(this).setAction("hide"));

    var self = this;
    this.element().addEventListener('mouseover', e => { self.didMouseOver(e) });
    this.element().addEventListener('mouseout', e => { self.didMouseOut(e) });
    
    this.hide();
  }

  didMouseOver() {
    this.setIsMouseOver(true);
  }

  didMouseOut() {
    this.setIsMouseOver(false);
    //this.hide();
  }

  shouldSendImmediately() {
    return true;
    //return this.sendImmediatelyCheckbox().isChecked();
  }
}).initThisClass();

window.RollPanelView = RollPanelView;