"use strict";

/**
 * @module boot
 * @class SvBootLoadingView
 * @extends Object
 * @description Manages the loading view displayed during the boot process.
 */

class SvBootLoadingView extends Object {

  constructor () {
    super();
    this._isClosing = false;
    this._hasInitialized = false;
    this._currentBarRatio = 0;
    this._updateCount = 0;
    this._maxUpdateCount = 9;
    //this._interval = null;
  }

  static _shared = null;

  /**
   * @method shared
   * @category Singleton
   * @returns {SvBootLoadingView} The shared instance of the loading view.
   */
  static shared () {
    if (this._shared === null) {
      this._shared = new SvBootLoadingView();
    }
    return this._shared;
  }

  /*
  startInterval () {
    const fps = 30;
    this._interval = setInterval(() => {
      // let's force a DOM render here

    }, 1000/fps);
  }

  stopInterval () {
    clearInterval(this._interval);
    this._interval = null;
  }
  */

  /**
   * @method isAvailable
   * @category State
   * @returns {boolean} True if the loading view element is available in the DOM.
   */
  isAvailable () {
    return this.element() !== null;
  }

  /**
   * @method isClosing
   * @category State
   * @returns {boolean} True if the loading view is currently animating closed.
   */
  isClosing () {
    return this._isClosing;
  }

  /**
   * @method initializeFadeIn
   * @category Lifecycle
   * @description Initializes the loading view with a fade-in animation.
   */
  initializeFadeIn () {
    if (this._hasInitialized || !this.isAvailable()) {
      return;
    }
    
    this._hasInitialized = true;
    const e = this.element();
    
    // Set initial state (invisible and slightly scaled down)
    e.style.opacity = '0';
    e.style.transform = 'scale(0.95)';
    e.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    
    // Start fade in animation after a brief moment
    setTimeout(() => {
      if (this.isAvailable() && !this.isClosing()) {
        e.style.opacity = '1';
        e.style.transform = 'scale(1)';
      }
    }, 50); // Small delay to ensure styles are applied
  }

  /**
   * @method element
   * @category DOM
   * @returns {HTMLElement|null} The main loading view element.
   */
  element () {
    if (SvPlatform.isBrowserPlatform()) {
      return document.getElementById("loadingView");
    }
    return null;
  }
  
  /**
   * @method titleElement
   * @category DOM
   * @returns {HTMLElement|null} The title element of the loading view.
   */
  titleElement () {
    return document.getElementById("loadingViewTitle");
  }

  subtitleElement () {
    return document.getElementById("loadingViewSubtitle");
  }

  /**
   * @method barElement
   * @category DOM
   * @returns {HTMLElement|null} The progress bar element of the loading view.
   */
  barElement () {
    return document.getElementById("innerLoadingView");
  }

  // Commented out methods remain unchanged

  /**
   * @method setTitle
   * @category UI Update
   * @param {string} s - The title text to set.
   * @returns {SvBootLoadingView} The current instance for chaining.
   */
  setTitle (s) {
    if (!this.isAvailable() || this.isClosing()) {
      return this;
    }
    
    // Initialize fade-in animation on first use
    this.initializeFadeIn();
    
    this.titleElement().innerText = s;
    return this;
  }

  /**
   * @method title
   * @category UI State
   * @returns {string} The current title of the loading view.
   */
  title  () {
    return this.titleElement().innerText;
  }

  setSubtitle (s) {
    if (!this.isAvailable() || this.isClosing()) {
      return this;
    }

    let ratio = Math.min( this._updateCount / this._maxUpdateCount, 1);

    this.subtitleElement().innerText = s;
    
    //console.log("-- SvBootLoadingView setSubtitle(\"" + s + "\") #" + this._updateCount);

    if (ratio !== null) {
      this.setBarRatio(ratio);
    }

    this._updateCount ++;
    return this;
  }

  subtitle () {
    return this.subtitleElement().innerText;
  }


  /**
   * @method setErrorMessage
   * @category UI Update
   * @param {string} s - The error message to display.
   */
  setErrorMessage (s) {
    this.setTitle(s);
    this.titleElement().style.color = "red";
  }

  /**
   * @method setBarRatio
   * @category UI Update
   * @param {number} r - The ratio to set (between 0 and 1).
   * @returns {SvBootLoadingView} The current instance for chaining.
   * @throws {Error} If the ratio is invalid.
   */
  setBarRatio (r) {
    if (r < 0 || r > 1) {
      throw new Error("invalid ratio");
    }

    if (!this.isAvailable() || this.isClosing()) {
      return this;
    }

    // Initialize fade-in animation on first use
    this.initializeFadeIn();

    const barElement = this.barElement();
    
    // Add smooth transition for width changes if not already present
    /*if (!barElement.style.transition) {
      barElement.style.transition = 'width 1s ease-out';
    }
      */

    const v = Math.round(100 * r) / 100; 
    if (v !== this._currentBarRatio) {
      this._currentBarRatio = v;
      barElement.style.width = 10 * v + "em";
    }
    //console.log("setBarRatio", v);
    return this;
  }


  /**
   * @method setBarToNofM
   * @category UI Update
   * @param {number} n - The current step.
   * @param {number} count - The total number of steps.
   * @returns {SvBootLoadingView} The current instance for chaining.
   */
  setBarToNofM (n, count) {
    this.setBarRatio(n / count);
    return this;
  }

  /**
   * @method close
   * @category Lifecycle
   * @description Removes the loading view element from the DOM immediately (legacy method).
   */
  close () {
    if (!this.isAvailable()) {
      return;
    }
    const e = this.element();
    e.parentNode.removeChild(e);
  }

  /**
   * @method asyncClose
   * @category Lifecycle
   * @description Removes the loading view element from the DOM with a fade-out animation.
   * @returns {Promise} A promise that resolves when the animation completes.
   */
  async asyncClose () {
    if (!this.isAvailable()) {
      return;
    }
    this.setSubtitle("");

    const e = this.element();

    if (e.parentNode === null) {
      return;  // already closed
    }
    
    // Set closing flag to prevent further updates
    this._isClosing = true;
    
    
    // Add transition if not already present
    if (!e.style.transition) {
      e.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    }
    
    // Start fade out animation
    e.style.opacity = '0';
    e.style.transform = 'scale(0.95)';
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 300)); // Match the 0.3s transition duration
    
    if (e.parentNode) {
      e.parentNode.removeChild(e);
    }
    this._isClosing = false; // Reset flag
  }
}

SvGlobals.set("SvBootLoadingView", SvBootLoadingView);
SvBootLoadingView.shared();

// Initialize fade-in animation immediately on browsers
if (SvPlatform.isBrowserPlatform()) {
  // Use setTimeout to ensure this runs after current execution context
  setTimeout(() => {
    SvBootLoadingView.shared().initializeFadeIn();
  }, 0);
}
