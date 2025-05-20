"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class KeyboardKey
 * @extends Device
 * @classdesc Represents a key on a keyboard.
 */
(class KeyboardKey extends Device {
    
    initPrototypeSlots () {
        /**
         * @member {Boolean} isDown - Indicates whether the key is pressed down.
         * @category State
         */
        {
            const slot = this.newSlot("isDown", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Number} code - The key code.
         * @category Identification
         */
        {
            const slot = this.newSlot("code", null);
            slot.setSlotType("Number");
        }
        /**
         * @member {String} name - The name of the key.
         * @category Identification
         */
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
        }
        /**
         * @member {SvKeyboard} keyboard - The keyboard this key belongs to.
         * @category Relationship
         */
        {
            const slot = this.newSlot("keyboard", null);
            slot.setSlotType("SvKeyboard");
        }
    }

    /**
     * @description Initializes the KeyboardKey.
     * @returns {KeyboardKey} The initialized KeyboardKey instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setIsDebugging(false)
        return this
    }

    /**
     * @description Handles the key down event.
     * @param {Event} event - The key down event.
     * @returns {boolean} Whether the event should propagate.
     * @category Event Handling
     */
    onKeyDown (event) {
        let shouldPropogate = true
        this.setIsDown(true)
        return shouldPropogate
    }

    /**
     * @description Handles the key up event.
     * @param {Event} event - The key up event.
     * @returns {boolean} Whether the event should propagate.
     * @category Event Handling
     */
    onKeyUp (event) {
        let shouldPropogate = true
        this.setIsDown(false)
        return shouldPropogate
    }

    /**
     * @description Checks if the key is up.
     * @returns {boolean} True if the key is up, false otherwise.
     * @category State
     */
    isUp () {
        return !this.isDown()
    }

    /**
     * @description Checks if this is the only key currently pressed down.
     * @returns {boolean} True if this is the only key down, false otherwise.
     * @category State
     */
    isOnlyKeyDown () {
        return this.isDown() && this.keyboard().currentlyDownKeys().length
    }

    /**
     * @description Checks if the key is alphabetical.
     * @param {Event} event - The keyboard event.
     * @returns {boolean} True if the key is alphabetical, false otherwise.
     * @category Identification
     */
    isAlphabetical (event) {
        const c = this.code()
        return c >= 65 && c <= 90
    }
    
}.initThisClass());