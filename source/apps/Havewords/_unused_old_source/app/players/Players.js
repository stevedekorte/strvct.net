"use strict";

/* 

    Players

      manages a list of Player objects

      replaces Guestlist
      
*/

(class Players extends Node {
  initPrototypeSlots() {
  }

  shared () {
    throw new Error("Players is not a singleton. Use App.shared().session().players()");
  }

  init() {
    super.init();
    this.setSubnodeClass(Player);
  }

  addLocalPlayer () {
    console.log("Players addLocalPlayer ---------");
    this.updatePlayerJson(LocalUser.shared().asPlayerJson());
  }

  asJson () {
    return this.subnodes().map(player => player.asJson());
  }

  setJson(json) {
    console.log("Players setJson ---------");
    this.updateJson(json);
    return this;
  }

  updateJson(json) {
    const ids = new Set(json.map(j => j.id));
    const subnodesToRemove = this.subnodes().filter(sn => !ids.has(sn.id()));
    subnodesToRemove.forEach(sn => this.removeSubnode(sn));

    json.forEach(playerJson => {
      this.updatePlayerJson(playerJson);
    })

    return this;
  }

  localPlayer() {
    return this.playerWithId(LocalUser.shared().id());
  }

  playerWithId (id) {
    return this.subnodes().find(player => player.id() === id);
  }

  playerWithName (name) {
    return this.subnodes().find(player => player.nickname() === name);
  }

  updatePlayerJson(json) { // returns true if player was updated, false if it was added
    //console.log("updatePlayerJson: ", JSON.stringify(json));
    const player = this.playerWithId(json.id);
    if (player) {
      player.setJson(json);
      this.scheduleOnChange();
      return player;
    } else {
      this.scheduleOnChange();
      return this.addSubnodeWithJson(json);
    }
  }

  clear () {
    this.removeAllSubnodes();
    return this;
  }

  onChange () {
    if (App.shared().isHost()) {
      App.shared().session().hostSession().sharePlayers();
    }
    PlayersColumn.shared().display();
  }

  processSceneSummary(text) {
    this.subnodes().forEach(player => {
      text = player.processSceneSummary(text);
    })
    return text;
  }

}.initThisClass());

