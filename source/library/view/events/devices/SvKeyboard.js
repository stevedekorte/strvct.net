/**
 * @module library.view.events.devices
 */

/**
 * @class SvKeyboard
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
 *
 */

"use strict";

(class SvKeyboard extends Device {

    /**
     * @category Initialization
     * @static
     * @description Initializes the class
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @category Initialization
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
     * @category Initialization
     * @description Initializes the keyboard
     * @returns {SvKeyboard} The keyboard instance
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
     * @category Event Handling
     * @description Starts listening for keyboard events
     * @returns {SvKeyboard} The keyboard instance
     */
    startListening () {
        const listener = KeyboardListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this);
        this.setKeyboardListener(listener);
        this.keyboardListener().setIsListening(true);
        return this;
    }

    /**
     * @category Initialization
     * @description Sets up the code to keys map
     * @returns {SvKeyboard} The keyboard instance
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
     * @category Key Lookup
     * @description Gets the key for a given code
     * @param {number} aCode - The key code
     * @returns {KeyboardKey} The keyboard key
     */
    keyForCode (aCode) {
        return this.codeToKeysMap().get(aCode);
    }

    /**
     * @category Key Lookup
     * @description Gets the key for a given name
     * @param {string} aName - The key name
     * @returns {KeyboardKey} The keyboard key
     */
    keyForName (aName) {
        const code = this.keyCodeForName(aName);
        return this.keyForCode(code);
    }

    /**
     * @category Key Lookup
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
     * @category Key Mapping
     * @description Gets the inverted key codes to names map
     * @returns {Map} The inverted map
     */
    k2c () {
        if (!this._k2c) {
            this._k2c = this.keyCodesToNamesMap().inverted();
        }
        return this._k2c;
    }

    /**
     * @category Key Lookup
     * @description Gets the key code for a given name
     * @param {string} aName - The key name
     * @returns {number} The key code
     */
    keyCodeForName (aName) {
        return this.k2c().get(aName);
    }

    /**
     * @category Event Handling
     * @description Checks if the event is just a modifier key
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event is just a modifier key
     */
    eventIsJustModifierKey (event) {
        const name = this.nameForKeyCode(event.keyCode);
        return this.allModifierNames().contains(name);
    }

    /**
     * @category Key Mapping
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

    /**
     * @category Key Mapping
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
        };
    }

    /**
     * @category Debugging
     * @description Shows the code to keys map
     * @returns {SvKeyboard} The keyboard instance
     */
    showCodeToKeys () {
        const c2k = this.keyCodesToNamesMap();

        //const s = JSON.stringify(c2k, null, 4);

        const lines = c2k.keysArray().map((code) => {
            return "    " + code + ": \"" + this.codeToKeysMap().get(code).name() + "\"";
        });
        const s = "{\n" + lines.join(",\n") + "}\n";
        console.log(this.logPrefix(), "c2k:", s);

        /*
        console.log(this.logPrefix(), "Keyboard:")
        this.codeToKeysMap().forEachKV((code, key) => {
            console.log(this.logPrefix(), "  code: ", code + " key name: ", this.keyForCode(code).name())
        });
        */
        return this;
    }

    /**
     * @category Event Handling
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
     * @category Event Handling
     * @description Handles the key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event should propagate
     */
    onKeyDownCapture (event) {
        //console.log(this.logPrefix(), "event.metaKey = ", event.metaKey)

        const shouldPropogate = true;
        const key = this.keyForEvent(event);

        if (key) {
            key.onKeyDown(event);

            if (this.isDebugging()) {
                this.logDebug(" " + this.downMethodNameForEvent(event));
            }
        } else {
            console.warn("SvKeyboard.shared() no key found for event ", event);

            //this.keyForEvent(event);
        }

        return shouldPropogate;
    }

    /**
     * @category Event Handling
     * @description Handles the key up event
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event should propagate
     */
    onKeyUpCapture (event) {
        const shouldPropogate = true;
        const key = this.keyForEvent(event);
        if (!key) {
            console.log(this.logPrefix(), "]]]]]]]]]]] WARNING: missing key for event: ", event);
            return;
        }
        key.onKeyUp(event);

        if (this.isDebugging()) {
            this.logDebug(" " + this.upMethodNameForEvent(event));
            this.logDebug(".onKeyUpCapture " + key.name() + " -> " + this.modsAndKeyNameForEvent(event) + "KeyUp");
        }

        return shouldPropogate;
    }

    /**
     * @category Event Handling
     * @description Gets the down method name for a given event
     * @param {Event} event - The keyboard event
     * @returns {string} The down method name
     */
    downMethodNameForEvent (event) {
        return "on" + this.modsAndKeyNameForEvent(event) + "KeyDown";
    }

    /**
     * @category Event Handling
     * @description Gets the up method name for a given event
     * @param {Event} event - The keyboard event
     * @returns {string} The up method name
     */
    upMethodNameForEvent (event) {
        return "on" + this.modsAndKeyNameForEvent(event) + "KeyUp";
    }

    /**
     * @category Key State
     * @description Checks if the event is an alphabetical key
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event is alphabetical
     */
    eventIsAlphabetical (event) {
        const c = event.keyCode;
        return c >= 65 && c <= 90;
    }

    /**
     * @category Key State
     * @description Checks if the event is a numeric key
     * @param {Event} event - The keyboard event
     * @returns {boolean} True if the event is numeric
     */
    eventIsNumeric (event) {
        const c = event.keyCode;
        return c >= 48 && c <= 57;
    }

    /**
     * @category Event Handling
     * @description Gets the mods and key name for an event
     * @param {Event} event - The keyboard event
     * @returns {string} The mods and key name
     */
    modsAndKeyNameForEvent (event) {
        /*
            Examples: Alt_b Alt_B, AltShift_1
            Note: shift is explicit if the key is not alphabetical.

            Control_c - typical copy command on Windows
            MetaLeft_c/MetaRight_c - typical copy command on MacOS

            Control_v - typical paste command on Windows
            MetaLeft_v/MetaRight_v - typical paste command on MacOS
        */

        if (Type.isUndefined(event.keyCode)) {
            return "";
        }

        const key = this.keyForCode(event.keyCode);
        const isJustModifier = this.eventIsJustModifierKey(event);
        const modifiers = this.modifierNamesForEvent(event); // may include Shift
        const isAlpabetical = this.eventIsAlphabetical(event);;
        const isNumeric = this.eventIsNumeric(event);
        let keyName = key ? key.name() : event.code;


        if (isJustModifier) {
            return keyName;
        }

        if (event.shiftKey) {
            // Note: if another modifier besides the shift key is down,
            // the non-shift version of event.key is used. For example:
            // shift-equals is "Plus"
            // control-shift-equals is "ControlShiftEquals"
            // this follows the Javascript event.key convention

            const shiftName = this.shiftDict()[event.key];
            if (shiftName) {
                keyName = shiftName;
            }
        }

        if (isAlpabetical) {
            if (event.shiftKey) {
                keyName = keyName.capitalized();
                modifiers.remove("Shift");
            }
            keyName = "_" + keyName + "_";
        }

        if (isNumeric) {
            keyName = "_" + keyName + "_";
        }

        if (modifiers.includes("MetaLeft")) {
            // no-op
        }

        return modifiers.join("") + keyName; // examples: "Control_1_", "MetaLeft_c_"
    }

    /**
     * @category Special Keys
     * @description Gets the shift key
     * @returns {KeyboardKey} The shift key
     */
    shiftKey () {
        return this.keyForName("Shift");
    }

    /**
     * @category Special Keys
     * @description Gets the control key
     * @returns {KeyboardKey} The control key
     */
    controlKey () {
        return this.keyForName("Control");
    }

    /**
     * @category Special Keys
     * @description Gets the alternate key
     * @returns {KeyboardKey} The alternate key
     */
    alternateKey () {
        return this.keyForName("Alternate");
    }

    /**
     * @category Special Keys
     * @description Gets the left command key
     * @returns {KeyboardKey} The left command key
     */
    leftCommandKey () {
        return this.keyForName("MetaLeft");
    }

    /**
     * @category Special Keys
     * @description Gets the right command key
     * @returns {KeyboardKey} The right command key
     */
    rightCommandKey () {
        return this.keyForName("MetaRight");
    }

    /**
     * @category Key State
     * @description Checks if the shift key is down
     * @returns {boolean} True if the shift key is down
     */
    shiftIsDown () {
        return this.shiftKey().isDown();
    }

    /**
     * @category Key State
     * @description Checks if the command key is down
     * @returns {boolean} True if the command key is down
     */
    commandIsDown () {
        return this.leftCommandKey().isDown() || this.rightCommandKey().isDown();
    }

    /**
     * @category Special Keys
     * @description Gets the equals sign key
     * @returns {KeyboardKey} The equals sign key
     */
    equalsSignKey () {
        return this.keyForName("EqualsSign");
    }

    /**
     * @category Special Keys
     * @description Gets the minus key
     * @returns {KeyboardKey} The minus key
     */
    minusKey () {
        return this.keyForName("Dash");
    }

    /**
     * @category Special Keys
     * @description Gets the plus key
     * @returns {KeyboardKey} The plus key
     */
    plusKey () {
        return this.keyForName("Plus");
    }

    /**
     * @category Key State
     * @description Checks if the plus key is down
     * @returns {boolean} True if the plus key is down
     */
    plusIsDown () {
        return this.plusKey().isDown();
    }

    /**
     * @category Key State
     * @description Gets the currently down keys
     * @returns {Array} The currently down keys
     */
    currentlyDownKeys () {
        return this.codeToKeys().valuesArray().select(key => key.isDown());
    }

    /**
     * @category Key State
     * @description Gets the currently up keys
     * @returns {Array} The currently up keys
     */
    currentlyUpKeys () {
        return this.codeToKeys().valuesArray().select(key => !key.isDown());
    }

    /**
     * @category Key State
     * @description Checks if there are any keys currently down
     * @returns {boolean} True if there are any keys down
     */
    hasKeysDown () {
        return this.currentlyDownKeys().length !== 0;
    }

    /**
     * @category Key State
     * @description Gets the names of the currently down keys
     * @returns {Array} The names of the currently down keys
     */
    downKeyNames () {
        return SvKeyboard.shared().currentlyDownKeys().map(k => k.name());
    }

    /**
     * @category Debugging
     * @description Shows the currently down keys
     */
    showDownKeys () {
        this.logDebug(" downKeys: ", this.downKeyNames());
    }

    /**
     * @category Key Mapping
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
     * @category Event Handling
     * @description Gets the modifier names for an event
     * @param {Event} event - The keyboard event
     * @returns {Array} The modifier names
     */
    modifierNamesForEvent (event) {
        let modifierNames = [];

        // event names are ordered alphabetically to avoid ambiguity

        if (event.altKey) {
            modifierNames.push("Alternate");
        }

        if (event.ctrlKey) {
            modifierNames.push("Control");
        }

        if (event.metaKey) {
            const n = event.location;

            //console.log(this.logPrefix(), "event.location = ", event.location)

            if (n === 1) {
                modifierNames.push("MetaLeft");
            } else if (n === 2) {
                modifierNames.push("MetaRight");
            } else {
                modifierNames.push("Meta");
            }
        }

        if (event.shiftKey) {
            modifierNames.push("Shift");
        }

        return modifierNames;
    }

    /**
     * @category Debugging
     * @description Shows the event details
     * @param {Event} event - The keyboard event
     */
    showEvent (event) {
        const kb = SvKeyboard.shared();
        console.log(this.logPrefix(), "---");
        console.log(this.logPrefix(), "SvKeyboard.showEvent():");
        console.log(this.logPrefix(), "  code: ", event.keyCode);
        console.log(this.logPrefix(), "  name: ", kb.nameForKeyCode(event.keyCode));
        console.log(this.logPrefix(), "  is modifier: ", kb.eventIsJustModifierKey(event));
        console.log(this.logPrefix(), "  modifierNames: ", kb.modifierNamesForEvent(event));
        console.log(this.logPrefix(), "  modsAndKeyName: ", kb.modsAndKeyNameForEvent(event));
        console.log(this.logPrefix(), "---");
    }

}.initThisClass());
