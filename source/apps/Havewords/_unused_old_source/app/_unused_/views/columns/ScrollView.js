"use strict";

/* 
    ScrollView

    Has a contentView which fit's height of content.
    Items are added/removed from contentView.

*/

(class ScrollView extends View {
  initPrototypeSlots() {
    this.newSlot("centeringView", null);
    this.newSlot("contentView", null);
  }

  init() {
    super.init();
    //this.create();
  }

  initElement () {
    super.initElement();
    //this.setClassName("ScrollView");

    this.setupView();
    this.setupCenteringView();
    this.setupContentView();
    return this;
  }

  setupView () {
    const e = this.element();
    //e.style.overflowX = "hidden";
    //e.style.overflowY = "scroll";

    e.style.marginRight = "1px"; /* to give scroll bar a margin */
    e.style.flexGrow = 1;
    e.style.border = "0px solid #777";
    e.style.display = "flex";
    e.style.flexDirection = "column";
    //e.style.justifyContent = "flex-end";
    e.style.overflowX = "hidden";
    e.style.overflowY = "visible";
    e.style.scrollBehavior = "smooth";
    return this;
  }

  setupCenteringView () {
    const view = View.clone().create().setClassName("ScrollCenteringView");
    const e = view.element();
    e.style.textAlign = "center";
    this.addSubview(view);
    this.setCenteringView(view);
  }

  setupContentView () {
    const view = View.clone().create().setClassName("ScrollContentView");
    const e = view.element();
    e.style.width = "100%";
    e.style.height = "fit-content";
    e.style.margin = "auto";
    e.style.padding = "0em";
    e.style.overflowX = "hidden";
    e.style.overflowY = "hidden";
    e.style.maxWidth = "38.5em";
    this.centeringView().addSubview(view);
    this.setContentView(view);
  }

  scrollToBottom () {
    const e = this.element();
    e.scrollTo(0, e.scrollHeight); // use scrollTo() so "scroll-behavior: smooth;" setting can work.
    return this;
  }

  isScrolledToBottom () {
    const e = this.element();
    return (e.scrollTop + e.offsetHeight) >= e.scrollHeight;
  }

  scheduleScrollToBottomIfAtBottom () {
    if (this.isScrolledToBottom()) {
      setTimeout(()=> {
        this.scrollToBottom();
      }, 0);
    }
    return this;
  }

  // items - might be better to do via content view directly?

  addItemView (aView) {
    this.contentView().addSubview(aView);
    return this;
  }

  itemViews () {
    return this.contentView().subviews();
  }

  removeAllItems () {
    return this.contentView().clear();
    return this;
  }
  
}).initThisClass();


