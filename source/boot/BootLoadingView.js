"use strict";

/**
 * @module boot
 * @class BootLoadingView
 * @extends Object
 * @description Manages the loading view displayed during the boot process.
 */

class BootLoadingView extends Object {

  constructor() {
    super();
    this._isClosing = false;
  }

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
   * @returns {BootLoadingView} The current instance for chaining.
   */
  setTitle (s) {
    if (!this.isAvailable() || this.isClosing()) {
      return this;
    }
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
   * @returns {BootLoadingView} The current instance for chaining.
   * @throws {Error} If the ratio is invalid.
   */
  setBarRatio (r) {
    if (r < 0 || r > 1) {
      throw new Error("invalid ratio");
    }

    if (!this.isAvailable() || this.isClosing()) {
      return this;
    }

    const v = Math.round(100 * r) / 100; // limit to 2 decimals
    this.barElement().style.width = 10 * v + "em";
    return this;
  }

  /**
   * @method setBarToNofM
   * @category UI Update
   * @param {number} n - The current step.
   * @param {number} count - The total number of steps.
   * @returns {BootLoadingView} The current instance for chaining.
   */
  setBarToNofM (n, count) {
    if (!this.isAvailable() || this.isClosing()) {
      return this;
    }

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
  asyncClose () {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve();
        return;
      }
      
      // Set closing flag to prevent further updates
      this._isClosing = true;
      
      const e = this.element();
      
      // Add transition if not already present
      if (!e.style.transition) {
        e.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      }
      
      // Start fade out animation
      e.style.opacity = '0';
      e.style.transform = 'scale(0.95)';
      
      // Remove element after animation completes
      setTimeout(() => {
        if (e.parentNode) {
          e.parentNode.removeChild(e);
        }
        this._isClosing = false; // Reset flag
        resolve();
      }, 300); // Match the 0.3s transition duration
    });
  }
}

SvGlobals.globals().bootLoadingView = new BootLoadingView();
