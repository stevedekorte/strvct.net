import DiceBox from "@3d-dice/dice-box";
import ParserInterface from "@3d-dice/dice-parser-interface";

(class DiceRollView extends View {
  initPrototypeSlots() {
    super.initPrototypeSlots();

    //Public Interface
    this.newSlot("character", "");
    this.newSlot("notation", "");
    this.newSlot("rollTarget", NaN);

    //Internal
    this.newSlot("diceBox");
    this.newSlot("parser");
    this.newSlot("rollResults", "");
  }

  //Public Interface
  async setup() {
    return this.diceBox().init();
  }

  async roll() {
    this.setRollResults(null);
    await this.diceBox().roll(this.parser().parseNotation(this.notation()));
    this.setRollResults(this.parser().parseFinalResults(this.diceBox().getRollResults()));
    this.augmentRollResults();
    return this;
  }

  value() {
    return this.rollResults().value;
  }

  hasRollTarget() {
    return !isNaN(this.rollTarget());
  }

  hasAdvantage() {
    return this.notation().includes("kh1");
  }

  hasDisadvantage() {
    return this.notation().includes("kl1");
  }

  wasSuccess() {
    return this.rollResults().success;
  }

  wasCritical() {
    return this.wasCriticalSuccess() || this.wasCriticalFailure();
  }

  wasCriticalSuccess() {
    return this.rollResults().critical == "success";
  }

  wasCriticalFailure() {
    return this.rollResults().critical == "failure";
  }

  outcomeDescription() {
    return this.characterDescription() + 
      this.diceDescription() + 
      this.advantageDescription() + 
      ':' + 
      this.rollDescription() +
      this.modifierDescription() +
      this.valueDescription() +
      this.targetDescription() +
      this.successDescription();
  }

  clear() {
    this.diceBox().clear();
  }

  //Internal
  init() {
    super.init();

    this.setDiceBox(new DiceBox("#dice-box", {
      assetPath: "assets/",
      assetPath: "/source/external/@3d-dice/dice-box/dist/assets/",
      //origin: "https://unpkg.com/@3d-dice/dice-box@1.0.8/dist/",
      //origin: "./source/external/@3d-dice/dice-box/dist/",
      theme: "smooth",
      themeColor: "#000000",
      offscreen: true,
      scale: 4
    }));

    this.setParser(new ParserInterface());
  }

  rolls() {
    switch(this.rollResults().type) {
      case "die":
        return this.rollResults().rolls;
      case "expressionroll":
       return this.rollResults().dice.find(die => die.type == "die").rolls;
    } 
  }

  augmentRollResults() {
    const results = this.rollResults();

    const rolls = this.rolls();
    let highestRoll = { value: Number.MIN_SAFE_INTEGER }
    let lowestRoll = { value: Number.MAX_SAFE_INTEGER }
    rolls.forEach(roll => {
      if (roll.value > highestRoll.value) {
        highestRoll = roll;
      }
      if (roll.value < lowestRoll.value) {
        lowestRoll = roll;
      }
    });

    var self = this;
    rolls.forEach(roll => {
      if (self.hasAdvantage()) {
        roll.ignored = roll != highestRoll;
      }
      else if (self.hasDisadvantage()) {
        roll.ignored = roll != lowestRoll;
      }
      else {
        roll.ignored = false;
      }
    });

    if (this.hasRollTarget()) {
      const results = this.rollResults();
      results.target = this.rollTarget();
      if (this.hasAdvantage()) {
        results.critical = highestRoll.critical;
      }
      else if (this.hasDisadvantage()) {
        results.critical = lowestRoll.critical; 
      }
      else {
        results.critical = highestRoll.critical; 
      }

      if (this.wasCritical()) {
        results.success = this.wasCriticalSuccess();
      }
      else {
        results.success = this.value() >= results.target;
      }
    }
  }

  characterDescription() {
    return `${this.character()} rolled`;
  }

  diceDescription() {
    return ' ' + this.diceCount() + 'd' + this.dieNumber();
  }

  rollInfo() {
    let results = this.rollResults();
    if (results.type == "expressionroll") {
      return results.dice.find(d => d.type == "die");
    }
    else {
      return results;
    }
  }

  diceCount() {
    return this.rollInfo().count.value;
  }

  dieNumber() {
    let results = this.rollResults();
    let die = results;
    if (results.type == "expressionroll") {
      die = results.dice.find(d => d.type == "die");
    }
    return this.rollInfo().die.value;
  }

  advantageDescription() {
    if (this.hasAdvantage()) {
      return ' with Advantage';
    }
    else if (this.hasDisadvantage()) {
      return ' with Disadvantage';
    }
    else {
      return '';
    }
  }

  rollDescription() {
    return " (" + this.rolls().map((roll) => {
      return this.tagForRoll(roll)
    }).join(" + ") + ")"
  }

  tagForRoll(roll) {
    const classForRoll = this.classForRoll(roll);

    if (classForRoll != "") {
      return `<span class='${classForRoll}'>${roll.value}</span>`;
    }
    else {
      return String(roll.value);
    }
  }

  classForRoll(roll) {
    const classes = [];
    if (roll.critical == 'success') {
      classes.push('criticalSuccessRoll');
    }
    else if (roll.critical == 'failure') {
      classes.push('criticalFailureRoll');
    }
    if (roll.ignored) {
      classes.push('ignoredRoll');
    }

    return classes.join(" ");
  }

  modifierDescription() {
    if (this.hasModifier()) {
      const results = this.rollResults();
      return ' ' + results.ops[0] + ' ' + String(results.dice.find(d => d.type == "number").value);
    }
    else {
      return '';
    }
  }

  hasModifier() {
    return this.rollResults().type == "expressionroll";
  }

  valueDescription() {
    let description = ' = ';
    if (this.wasCritical()) {
      const classForValue = this.wasCriticalSuccess() ? 'criticalSuccessRoll' : 'criticalFailureRoll';
      description += `<span class='${classForValue}'>${ this.value() }</span>`
    }
    else {
      description += String(this.value());
    }

    return description;
  }

  targetDescription() {
    if (this.hasRollTarget()) {
      let description = ' vs ';
      if (this.wasCritical()) {
        description += "<span class='ignoredRoll'>"
      }
      description += String(this.rollTarget());
      if (this.wasCritical()) {
        description += "</span>"
      }

      return description;
    }
    else {
      return '';
    }
  }

  successDescription() {
    if (this.hasRollTarget()) {
      let description = ' (';

      if (this.wasCritical()) {
        description += '<strong>Critical ';
      }
      description += this.wasSuccess() ? 'Success' : 'Failure';
      if (this.wasCritical()) {
        description += '</strong>';
      }

      return description + ')';
    }
    else {
      return '';
    }
  }
}).initThisClass();

window.DiceRollView = DiceRollView;