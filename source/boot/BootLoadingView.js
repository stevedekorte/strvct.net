
"use strict";

class BootLoadingView {

  isAvailable() {
    return this.element() !== null;
  }

  element () {
    return document.getElementById("loadingView");
  }
  
  titleElement () {
    return document.getElementById("loadingViewTitle");
  }

  barElement () {
    return document.getElementById("innerLoadingView");
  }

  /*
  unhide () {
    this.element().style.display = "block";
  }

  hide () {
    this.element().style.display = "none";
  }
  */

  setTitle (s) {
    if (!this.isAvailable()) {
        return;
    }
    this.titleElement().innerText = s;
    return this;
  }

  title () {
    return this.titleElement().innerText;
  }

  setErrorMessage (s) {
    this.setTitle(s);
    this.titleElement().style.color = "red";
  }

  setBarRatio (r) {
    if (r < 0 || r > 1) {
        throw new Error("invalid ratio");
    }

    const v = Math.round(100 * r)/100; // limit to 2 decimals
    this.barElement().style.width = 10 * v + "em";
    return this;
  }

  setBarToNofM (n, count) {
    if (!this.isAvailable()) {
        return
    }

    this.setBarRatio(n / count);
    return this
  }

  close () {
    if (!this.isAvailable()) {
        return
    }
    const e = this.element();
    e.parentNode.removeChild(e);
  }
}

getGlobalThis().bootLoadingView = new BootLoadingView();
