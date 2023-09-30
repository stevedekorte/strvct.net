"use strict";

/* 
    PlayersColumn

*/

(class PlayersColumn extends ColumnView {
  initPrototypeSlots() {
    this.newSlot("guestUserList", null)
    this.newSlot("subnodeViewClass", null)
    this.newSlot("syncButton", null)
  }

  init() {
    super.init();
    this.setId("PlayersColumn");
    this.setSubnodeViewClass(PlayerView);
    this.setScrollView(ScrollView.clone().setId("PlayersColumn_ScrollView"));

    this.setSyncButton(Button.clone().setId("SyncPlayersButton").setTarget(this));
  }

  onSubmit_SyncPlayersButton () {
    console.log("syncing players");

    if (App.shared().isHost()) {
      this.node().onChange();
    } else {
      this.node().localPlayer().share();
    }
  }

  node () {
    return App.shared().session().players();
  }

  syncFromNode() {
    this.display();
    return this;
  }

  display () {
    this.scrollView().removeAllItems();
    this.node().subnodes().forEach((player) => {
        const view = this.subnodeViewClass().clone().create().setPlayer(player);
        this.scrollView().addItemView(view);
    });
  }

}.initThisClass());
