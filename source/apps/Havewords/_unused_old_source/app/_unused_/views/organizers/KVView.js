"use strict";

/* 
    KVView

*/

(class KVView extends HView {
  initPrototypeSlots() {
    this.newSlot("topView", null);
    this.newSlot("keyView", null);
    this.newSlot("valueView", null);
    this.newSlot("collapseButton", null);
    this.newSlot("isCollapsable", false);
  }

  init() {
    super.init();
    this.setIsDebugging(false);

    this.setTopView(HView.clone());
    this.topView().makeWidthFitContent()
    this.addSubview(this.topView());

    this.setKeyView(HView.clone());
    this.keyView().makeWidthFitContent().setTarget(this);
    this.keyView().listenForClick();
    this.topView().addSubview(this.keyView());

    this.setCollapseButton(View.clone().create());
    this.collapseButton().makeWidthFitContent().setTarget(this);
    this.collapseButton().listenForClick();
    this.setIsCollapsable(false);

    this.collapseButton().style().fontSize = "0.5em";
    //this.collapseButton().style().transform = "translateY(5px)";
    this.collapseButton().hide();
    this.topView().addSubview(this.collapseButton());

    this.setValueView(HView.clone());
    this.valueView().makeWidthFitContent();
    this.addSubview(this.valueView());

    this.collapseValue();
  }

  setLabel (s) {
    this.keyView().setString(s);
    return this;
  }

  label () {
    return this.keyView().string();
  }

  onClickView(keyView) {
    if (this.isCollapsable()) {
      if (this.isCollapsed()) {
        this.uncollapseValue();
        this.sendRespondingDescendants("uncollapseValue");
      } else {
        this.collapseValue();
        this.sendRespondingDescendants("collapseValue");
      }
    }
  }

  // --- collapsable ---

  setIsCollapsable(aBool) {
    this._isCollapsable = aBool;
    this.collapseButton().setIsHidden(!aBool);
    return this;
  }

  isCollapsed () {
    return this.valueView().isHidden();
  }

  collapseValue () {
    if (this.isCollapsable()) {
      this.valueView().hide();
    }
    this.collapseButton().setString("&#9660;");
  }

  uncollapseValue () {
      this.valueView().unhide();
      this.collapseButton().setString("&#9650;");
  }

  // flex direction

  stackVertically () {
    this.setFlexDirection("column");
    this.valueView().style().paddingLeft = "0.75em"
    this.valueView().style().paddingBottom = "0.5em"
    //this.valueView().style().borderLeft = "1px #aaa solid"
    return this;
  }

  stackHorizontally () {
    this.setFlexDirection("row");
    this.valueView().style().paddingLeft = "0.5em"
    //this.valueView().style().border = "1px blue solid"
    return this;
  }

  setIsStackedVertically (aBool) {
    if (aBool) {
      this.stackVertically();
    } else {
      this.stackHorizontally();
    }
    return this;
  }

}).initThisClass();
