/**
 * @module library.view.events.devices
 */

/**
 * @class BMKeyboard
 * @extends Device
 * @classdesc Keyboard
 *
 * Global shared instance that tracks current keyboard state.
 * Registers for capture key events on document.body.
 *
 * MacOS/iOS note:
 *
 *     These Mac keys use different names in JS events:
 *     CommandLeft -> MetaLeft
 *     CommandRight -> MetaRight
 *     Option/Alt -> Alternate
 *     Control -> Control
 *     Function -> [not seen by JS either as key event or modifier]
 *
 * Browser Issues:
 *
 *     Key combinations intercepted by browser:
 *
 *         OSX:
 *             meta-n (new window)
 *             meta-m (minimize window)
 *             meta-w (close window)
 *             meta-t (new tab)
 *
 *             but we can intercept:
 *             meta-o
 *
 *
 * Notes:
 *
 *     Newer JS browser APIs might have better ways to do
 *     key code to name mappings. TODO: look into whether this is well supported across browsers.
 */

"use strict";

(class BMKeyboard extends Device {

    /**
     * @static
     * @description Initializes the class
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots
     */
    initPrototypeSlots () {
        /**
         * @member {Map} codeToKeysMap
         * @description Dictionary of KeyboardKey objects
         */
        {
            const slot = this.newSlot("codeToKeysMap", null); 
            slot.setComment("dictionary of KeyboardKey objects");
            slot.setSlotType("Map");
        }
        /**
         * @member {KeyboardListener} keyboardListener
         */
        {
            const slot = this.newSlot("keyboardListener", null);
            slot.setSlotType("KeyboardListener");
        }
        /**
         * @member {Array} allModifierKeys
         */
        {
            const slot = this.newSlot("allModifierKeys", null);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Initializes the keyboard
     * @returns {BMKeyboard} The keyboard instance
     */
    init () {
        super.init();
        this.setupCodeToKeys();
        this.startListening();
        this.setIsDebugging(false);
        this.setAllModifierKeys(this.allModifierNames().map(kn => this.keyForName(kn)));
        return this;
    }

    /**
     * @description Starts listening for keyboard events
     * @returns {BMKeyboard} The keyboard instance
     */
    startListening () {
        const listener = KeyboardListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this)
        this.setKeyboardListener(listener)
        this.keyboardListener().setIsListening(true)
        return this
    }

    /**
     * @description Sets up the code to keys map
     * @returns {BMKeyboard} The keyboard instance
     */
    setupCodeToKeys () {
        const map = new Map();
        this.keyCodesToNamesMap().forEachKV((code, name) => {
            //const name = c2k[code];
            const key = KeyboardKey.clone().setName(name).setCode(code).setKeyboard(this);
            assert(Type.isNumber(code));
            map.set(Number(code), key);
        });
        this.setCodeToKeysMap(map);
        return this;
    }

    /**
     * @description Gets the key for a given code
     * @param {number} aCode - The key code
     * @returns {KeyboardKey} The keyboard key
     */
    keyForCode (aCode) {
        return this.codeToKeysMap().get(aCode);
    }

    /**
     * @description Gets the key for a given name
     * @param {string} aName - The key name
     * @returns {KeyboardKey} The keyboard key
     */
    keyForName (aName) {
        const code = this.keyCodeForName(aName);
        return this.keyForCode(code);
    }

    /**
     * @description Gets the name for a given key code
     * @param {number} aCode - The key code
     * @returns {string|null} The key name
     */
    nameForKeyCode (aCode) {
        const key = this.keyForCode(aCode);
        if (key) {
            return key.name();
        }
        return null;
    }

    /**
     * @description Gets the inverted key codes to names map
     * @returns {Map} The inverted map
     */
    k2c () {
        if (!this._k2c) {
            this._k2c = this.keyCodesToNamesMap().inverted();
        }
        return this._k2c
    }

    /**
     * @description Gets the key code for a given name
     * @param {string} aName - The key name
     * @returns {number} The key code
     */
    keyCodeForName (aName) {
        return this.k2c().get(aName);
    }
    
    /**
     * @description Checks if the event is just a modifier key
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event is just a modifier key
     */
    eventIsJustModifierKey (event) {
        const name = this.nameForKeyCode(event.keyCode)
        return this.allModifierNames().contains(name)
    }

    /**
     * @description Gets the key codes to names map
     * @returns {Map} The key codes to names map
     */
    keyCodesToNamesMap () {
        return new Map([
            [8, "Backspace"],
            [9, "Tab"],
            [13, "Enter"],
            [16, "Shift"],
            [17, "Control"],
            [18, "Alternate"],
            [19, "PauseBreak"],
            [20, "Capslock"],
            [27, "Escape"],
            [32, "Space"],
            [33, "PageUp"],
            [34, "PageDown"],
            [35, "End"],
            [36, "Home"],
            [37, "LeftArrow"],
            [38, "UpArrow"],
            [39, "RightArrow"],
            [40, "DownArrow"],
            [45, "Insert"],
            [46, "Delete"],
            [48, "0"],
            [49, "1"],
            [50, "2"],
            [51, "3"],
            [52, "4"],
            [53, "5"],
            [54, "6"],
            [55, "7"],
            [56, "8"],
            [57, "9"],
            [65, "a"],
            [66, "b"],
            [67, "c"],
            [68, "d"],
            [69, "e"],
            [70, "f"],
            [71, "g"],
            [72, "h"],
            [73, "i"],
            [74, "j"],
            [75, "k"],
            [76, "l"],
            [77, "m"],
            [78, "n"],
            [79, "o"],
            [80, "p"],
            [81, "q"],
            [82, "r"],
            [83, "s"],
            [84, "t"],
            [85, "u"],
            [86, "v"],
            [87, "w"],
            [88, "x"],
            [89, "y"],
            [90, "z"],
            [91, "MetaLeft"],
            [92, "RightWindow"],
            [93, "MetaRight"],
            [96, "NumberPad0"],
            [97, "NumberPad1"],
            [98, "NumberPad2"],
            [99, "NumberPad3"],
            [100, "NumberPad4"],
            [101, "NumberPad5"],
            [102, "NumberPad6"],
            [103, "NumberPad7"],
            [104, "NumberPad8"],
            [105, "NumberPad9"],
            [106, "Multiply"],
            [107, "Plus"],
            [109, "Minus"],
            [110, "DecimalPoint"],
            [111, "Divide"],
            [112, "Function1"],
            [113, "Function2"],
            [114, "Function3"],
            [115, "Function4"],
            [116, "Function5"],
            [117, "Function6"],
            [118, "Function7"],
            [119, "Function8"],
            [120, "Function9"],
            [121, "Function10"],
            [122, "Function11"],
            [123, "Function12"],
            [144, "NumberLock"],
            [145, "ScrollLock"],
            [186, "Semicolon"],
            [187, "EqualsSign"],
            [188, "Comma"],
            [189, "Dash"],
            [190, "Period"],
            [191, "ForwardSlash"],
            [192, "GraveAccent"],
            [219, "OpenBracket"],
            [220, "Backslash"],
            [221, "CloseBracket"],
            [222, "SingleQuote"]
          ]);
    }

    /*
    shiftChangingKeysDict () {
        // Based on a Macbook Pro keyboard. 
        // Not sure if this is platform specific.

        return {
            "\`": ["Tilda", "~"],
            "1": ["ExclaimationPoint", "!"],
            "2": ["AtSymbol", "@"],
            "3": ["Hash", "#"],
            "4": ["DollarSign", "$"],
            "5": ["Percent", "%"],
            "6": ["Carot"],
            "7": ["Ampersand", "&"],
            "8": ["Asterisk", "*"],
            "9": ["OpenParenthesis", "("],
            "0": ["CloseParenthesis", ")"],
            "-": ["Underscore", "_"],
            "=": ["Plus", "+"],
            "[": ["OpenCurlyBracket", "{"],
            "]": ["CloseCurlyBracket", "}"],
            "\\": ["Pipe", "|"],
            ";": ["Colon", ":"],
            "'": ["DoubleQuote", "\""],
            ",": ["LessThan", "<"],
            ".": ["GreaterThan", ">"],
            "/": ["QuestionMark", "?"],
        }
    }
    */

    /**
     * @description Gets the shift dictionary
     * @returns {Object} The shift dictionary
     */
    shiftDict () {
        // Based on a Macbook Pro keyboard. 
        // Not sure if this is platform specific.

        return {
            "~": "Tilda",
            "!": "ExclaimationPoint",
            "@": "AtSymbol",
            "#": "Hash",
            "$": "DollarSign",
            "%": "Percent",
            "^": "Carot",
            "&": "Ampersand",
            "*": "Asterisk",
            "(": "OpenParenthesis",
            ")": "CloseParenthesis",
            "_": "Underscore",
            "+": "Plus",
            "{": "OpenCurlyBracket",
            "}": "CloseCurlyBracket",
            "|": "Pipe",
            ":": "Colon",
            "\\": "DoubleQuote",
            "<": "LessThan",
            ">": "GreaterThan",
            "?": "QuestionMark",
        }
    }

    /*
    specialKeyCodes () { 
        return {
            8:  "delete", // "delete" on Apple keyboard
            9:  "tab", 
            13: "enter", 
            16: "shift", 
            17: "control", 
            18: "alt", 
            20: "capsLock", 
            27: "escape", 
            33: "pageUp", 
            34: "pageDown", 
            37: "leftArrow",  
            38: "upArrow",  
            39: "rightArrow", 
            40: "downArrow",  
            46: "delete", 

        }
    }
    */

    // -- events ---

    /**
     * @description Shows the code to keys map
     * @returns {BMKeyboard} The keyboard instance
     */
    showCodeToKeys () {
        const c2k = this.keyCodesToNamesMap();

        //const s = JSON.stringify(c2k, null, 4);

        const lines = c2k.keysArray().map((code) => {
            return "    " + code + ": \"" + this.codeToKeysMap().get(code).name() + "\"";
        })
        const s = "{\n" + lines.join(",\n") + "}\n";
        console.log("c2k:", s);

        /*
        console.log("Keyboard:")
        this.codeToKeysMap().forEachKV((code, key) => {
            console.log("  code: ", code + " key name: ", this.keyForCode(code).name())
        });
        */
        return this;
    }

    /**
     * @description Gets the key for a given event
     * @param {Event} event - The keyboard event
     * @returns {KeyboardKey} The keyboard key
     */
    keyForEvent (event) {
        const code = event.keyCode;
        const key = this.keyForCode(code);
        return key;
    }

    /**
     * @description Handles the key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event should propagate
     */
    onKeyDownCapture (event) {
        //console.log("event.metaKey = ", event.metaKey)
        
        const shouldPropogate = true;
        const key = this.keyForEvent(event);

        if (key) {
            key.onKeyDown(event);

            if (this.isDebugging()) {
                this.debugLog(" " + this.downMethodNameForEvent(event));
            }
        } else {
            console.warn("BMKeyboard.shared() no key found for event ", event);
            debugger;
            this.keyForEvent(event);
        }
            
        return shouldPropogate;
    }

    /**
     * @description Handles the key up event
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event should propagate
     */
    onKeyUpCapture (event) {
        const shouldPropogate = true
        const key = this.keyForEvent(event)
        if (!key) {
            console.log("]]]]]]]]]]] WARNING: missing key for event: ", event)
            return
        }
        key.onKeyUp(event)

        if (this.isDebugging()) {
            this.debugLog(" " + this.upMethodNameForEvent(event))
            //this.debugLog(".onKeyUpCapture " + key.name() + " -> " + this.modsAndKeyNameForEvent(event) + "KeyUp")
        }

        return shouldPropogate
    }
    
    // --- event handling method names ---

    /**
     * @description Gets the down method name for a given event
     * @param {Event} event - The keyboard event
     * @returns {string} The down method name
     */
    downMethodNameForEvent (event) {
        return "on" + this.modsAndKeyNameForEvent(event) + "KeyDown";
    }

    /**
     * @description Gets the up method name for a given event
     * @param {Event} event - The keyboard event
     * @returns {string} The up method name
     */

    upMethodNameForEvent (event) {
        return "on" + this.modsAndKeyNameForEvent(event) + "KeyUp";
    }

    /**
     * @description Checks if the event is an alphabetical key
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event is alphabetical
     */
    eventIsAlphabetical (event) {
        const c = event.keyCode;
        return c >= 65 && c <= 90;
    }

    /**
     * @description Checks if the event is a numeric key
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event is numeric
     */
    eventIsNumeric (event) {
        const c = event.keyCode;
        return c >= 48 && c <= 57;
    }

    /**
     * @description Gets the mods and key name for an event
     * @param {Event} event - The keyboard event
     * @returns {string} The mods and key name
     */
    modsAndKeyNameForEvent (event) {
        // examples: AltB AltShiftB
        // Note that shift is explicit and the B key is always uppercase

        if (Type.isUndefined(event.keyCode)) {
            return ""
        }
        
        const key = this.keyForCode(event.keyCode)
        const isJustModifier = this.eventIsJustModifierKey(event)
        const modifiers = this.modifierNamesForEvent(event)
        const isAlpabetical = this.eventIsAlphabetical(event);
        const isNumeric = this.eventIsNumeric(event);
        let keyName = key ? key.name() : event.code

        
        if (isJustModifier) {
            return keyName
        }

        if (event.shiftKey) {
            // Note: if another modifier besides the shift key is down, 
            // the non-shift version of event.key is use e.g.
            // shift-equals is "Plus"
            // control-shift-equals is "ControlShiftEquals"
            // this follows the Javascript event.key convention

            const shiftName = this.shiftDict()[event.key]
            if (shiftName) {
                keyName = shiftName
            }
        }

        if (isAlpabetical) {
            if (event.shiftKey) {
                keyName = keyName.capitalized()
                modifiers.remove("Shift")
            }
            keyName = "_" + keyName + "_"
        }

        if (isNumeric) {
            keyName = "_" + keyName + "_";
        }

        return modifiers.join("") + keyName
    }

    // --- special ---

    // get key helpers

    /**
     * @description Gets the shift key
     * @returns {KeyboardKey} The shift key
     */
    shiftKey () {
        return this.keyForName("Shift")
    }

    /**
     * @description Gets the control key
     * @returns {KeyboardKey} The control key
     */
    controlKey () {
        return this.keyForName("Control")
    }

    /**
     * @description Gets the alternate key
     * @returns {KeyboardKey} The alternate key
     */
    alternateKey () {
        return this.keyForName("Alternate")
    }

    /**
     * @description Gets the left command key
     * @returns {KeyboardKey} The left command key
     */
    leftCommandKey () {
        return this.keyForName("MetaLeft")
    }

    /**
     * @description Gets the right command key
     * @returns {KeyboardKey} The right command key
     */
    rightCommandKey () {
        return this.keyForName("MetaRight")
    }

    // get key state helpers

    shiftIsDown () {
        return this.shiftKey().isDown()
    }

    /**
     * @description Checks if the command key is down
     * @returns {boolean} True if the command key is down
     */
    commandIsDown () {
        return this.leftCommandKey().isDown() || this.rightCommandKey().isDown()
    }

    /**
     * @description Gets the equals sign key
     * @returns {KeyboardKey} The equals sign key
     */
    equalsSignKey () {
        return this.keyForName("EqualsSign")
    }

    /**
     * @description Gets the minus key
     * @returns {KeyboardKey} The minus key
     */
    minusKey () {
        return this.keyForName("Dash")
    }

    /**
     * @description Gets the plus key
     * @returns {KeyboardKey} The plus key
     */
    plusKey () {
        return this.keyForName("Plus")
    }

    /**
     * @description Checks if the plus key is down
     * @returns {boolean} True if the plus key is down
     */
    plusIsDown () {
        return this.plusKey().isDown()
    }

    /**
     * @description Gets the currently down keys
     * @returns {Array} The currently down keys
     */
    currentlyDownKeys () {
        return this.codeToKeys().valuesArray().select(key => key.isDown());
    }

    /**
     * @description Gets the currently up keys
     * @returns {Array} The currently up keys
     */
    currentlyUpKeys () {
        return this.codeToKeys().valuesArray().select(key => !key.isDown());
    }

    /**
     * @description Checks if there are any keys currently down
     * @returns {boolean} True if there are any keys down
     */
    hasKeysDown () {
        return this.currentlyDownKeys().length !== 0;
    }

    /**
     * @description Gets the names of the currently down keys
     * @returns {Array} The names of the currently down keys
     */
    downKeyNames () {
        return BMKeyboard.shared().currentlyDownKeys().map(k => k.name());
    }

    /**
     * @description Shows the currently down keys
     */
    showDownKeys () {
        this.debugLog(" downKeys: ", this.downKeyNames());
    }

    /**
     * @description Gets all modifier names
     * @returns {Array} The modifier names
     */
    allModifierNames () {
        return [
            "Alternate", 
            "Control", 
            "Meta",
            "MetaLeft", 
            "MetaRight", 
            "Shift", 
        ];
    }

    /**
     * @description Gets the modifier names for an event
     * @param {Event} event - The keyboard event
     * @returns {Array} The modifier names
     */
    modifierNamesForEvent (event) {
        let modifierNames = []

        // event names are ordered alphabetically to avoid ambiguity

        if (event.altKey) {
            modifierNames.push("Alternate")
        } 
        
        if (event.ctrlKey) {
            modifierNames.push("Control")
        }
        
        if (event.metaKey) {
            const n = event.location

            //console.log("event.location = ", event.location)

            if (n === 1) {
                modifierNames.push("MetaLeft")
            } else if (n === 2) {
                modifierNames.push("MetaRight")
            } else {
                modifierNames.push("Meta")
            }
        } 
        
        if (event.shiftKey) {
            modifierNames.push("Shift")
        }

        return modifierNames
    }

    /**
     * @description Shows the event details
     * @param {Event} event - The keyboard event
     */
    showEvent (event) {
        const kb = BMKeyboard.shared()
        console.log("---")
        console.log("BMKeyboard.showEvent():")
        console.log("  code: ", event.keyCode)
        console.log("  name: ", kb.nameForKeyCode(event.keyCode))
        console.log("  is modifier: ", kb.eventIsJustModifierKey(event))
        console.log("  modifierNames: ", kb.modifierNamesForEvent(event))
        console.log("  modsAndKeyName: ", kb.modsAndKeyNameForEvent(event))
        console.log("---")
    }
    
}.initThisClass());
