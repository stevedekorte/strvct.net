/**
 * @module library.view.dom.Attributes
 */

/**
 * @class CssAnimation
 * @extends ProtoClass
 * @classdesc Encapsulation of CSS animation rule and animation control properties on a view.
 * It will also start an animationListener on the target view, 
 * which will send a onAnimationStart, and onAnimationEnd messages to the view.
 *
 * It works by composing a CSS animation rule and inserting it into the document's first style sheet.
 * The rule name is a hash of the rule content, and the CssAnimation class keeps a set of names
 * it's already registered, so it doesn't register them again.
 *
 * Example use:
 *      
 *     CssAnimation.clone().setPropertyName("right").setTargetValue("10px").setView(aView).start()
 */
"use strict";

(class CssAnimation extends ProtoClass {

    /**
     * @static
     * @description Inserts a rule for the given CSS animation
     * @param {CssAnimation} cssAnimation - The CSS animation object
     * @returns {CssAnimation} - The CssAnimation class
     * @category Animation
     */
    static insertRuleForAnimation (cssAnimation) {
        const name = cssAnimation.ruleName()
        const rules = this.insertedRuleNamesSet()
        if (!rules.has(name)) { // name is a hash of rule, so this should be safe
            const css = window.document.styleSheets[0];
            css.insertRule(cssAnimation.composedRule(), css.cssRules.length); // is this allowed or will some security nonsense block it?
            rules.add(name)
        }
        return this
    }

    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.newClassSlot("insertedRuleNamesSet", new Set())
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {DomView} view
         * @category View
         */
        {
            const slot = this.newSlot("view", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {String} propertyName
         * @category Animation
         */
        {
            const slot = this.newSlot("propertyName", "");
            slot.setSlotType("String");
        }
        /**
         * @member {String} startValue
         * @category Animation
         */
        {
            const slot = this.newSlot("startValue", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} targetValue
         * @category Animation
         */
        {
            const slot = this.newSlot("targetValue", 0);
            slot.setSlotType("String");
        }

        // animation name is computed from hash of animation css rule string
        /**
         * @member {Number} duration - seconds
         * @category Animation
         */
        {
            const slot = this.newSlot("duration", 1);
            slot.setComment("seconds");
            slot.setSlotType("Number");
        }
        /**
         * @member {String} timingFunction
         * @category Animation
         */
        {
            const slot = this.newSlot("timingFunction", "ease");
            slot.setSlotType("String");
        }
        /**
         * @member {Number} iterationCount - animation-iteration-count
         * @category Animation
         */
        {
            const slot = this.newSlot("iterationCount", 1) // animation-iteration-count
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} delay - animation-delay
         * @category Animation
         */
        {
            const slot = this.newSlot("delay", 0); // animation-delay
            slot.setSlotType("Number");
        }
        /**
         * @member {String} direction - animation-direction (normal or alternate)
         * @category Animation
         */
        {
            const slot = this.newSlot("direction", "normal"); // animation-direction (normal or alternate)
            slot.setSlotType("String");
        }
        /**
         * @member {String} fillMode - animation-fill-mode (none|forwards|backwards|both|initial|inherit)
         * @category Animation
         */
        {
            const slot = this.newSlot("fillMode", "forwards");  // animation-fill-mode (none|forwards|backwards|both|initial|inherit)
            slot.setSlotType("String");
        }
        /**
         * @member {String} playState - animation-play-state (paused|running|initial|inherit)
         * @category Animation
         */
        {
            const slot = this.newSlot("playState", "running");  // animation-play-state (paused|running|initial|inherit)
            slot.setSlotType("String");
        }
        /**
         * @member {Array} animationPropertyNames
         * @category Animation
         */
        {
            const slot = this.newSlot("animationPropertyNames", [
                "animation-name",
                "animation-duration",
                "animation-timing-function",
                "animation-delay",
                "animation-iteration-count",
                "animation-direction",
                "animation-fill-mode",
                "animation-play-state"
            ]);
            slot.setSlotType("Array");
        }
        /**
         * @member {Object} propertySlotsDict
         * @category Animation
         */
        {
            const slot = this.newSlot("propertySlotsDict", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        this.propertySlotsDict(); // cache it on the prototype
    }

    /**
     * @description Initializes the instance
     * @category Initialization
     */
    init () {
        super.init();
    }

    /**
     * @description Inserts the rule
     * @category Animation
     */
    insertRule () {
        assert(this.isValidRule());
        this.thisClass().insertRuleForAnimation(this);
    }

    /**
     * @description Composes the rule
     * @returns {string} The composed rule
     * @category Animation
     */
    composedRule () {
        return "@keyframes " + this.name() + " { " + this.ruleContent() + "}";
    }

    /**
     * @description Gets the name of the animation
     * @returns {string} The name of the animation
     * @category Animation
     */
    name () {
        return "animation" + this.ruleContent().hashCode();
    }

    /**
     * @description Gets the content of the rule
     * @returns {string} The content of the rule
     * @category Animation
     */
    ruleContent () {
        const k = this.propertyName();
        let s = "";
        if (!Type.isNullOrUndefined(this.startValue())) {
            s += " from {" + k + ": " + this.startValue() + "; }\n";
        }
        s += "to {" + k + ": " + this.targetValue() + "; }";
        s += "";
        return s;
    }

    /**
     * @description Checks if the rule is valid
     * @returns {boolean} True if the rule is valid, false otherwise
     * @category Validation
     */
    isValidRule () {
        return !Type.isNullOrUndefined(this.startValue()) && Type.isNullOrUndefined(this.targetValue());
    }

    /**
     * @description Gets the property slots dictionary
     * @returns {Object} The property slots dictionary
     * @category Animation
     */
    propertySlotsDict () {
        if (!this._propertySlotsDict) {
            const dict = {};
            this.animationPropertyNames().forEach(k => dict[k] = this.slotNameForPropertyName(k));
            this._propertySlotsDict = dict;
        }
        return this._propertySlotsDict;
    }

    /**
     * @description Gets the slot name for a given property name
     * @param {string} k - The property name
     * @returns {string} The slot name
     * @category Utility
     */
    slotNameForPropertyName (k) {
        const parts = k.split("-");
        parts.removeFirst();
        const result = parts.map(p => p.capitalized()).join("").uncapitalized();
        //console.log("slotNameForPropertyName('" + k + "') -> '" + result + "'");
        return result;
    }

    /**
     * @description Applies the animation to a view
     * @param {DomView} aView - The view to apply the animation to
     * @category Animation
     */
    applyToView (aView) { 
        const dict = this.propertySlotsDict();
        const e = this.view().element();
        Reflect.ownKeys(dict).forEach(attributeName => {
            const slotName = dict[attributeName];
            const value = this[slotName].apply(this);
            e.setAttribute(attributeName, value);
        })
    }

    /**
     * @description Starts the animation
     * @returns {CssAnimation} The CssAnimation instance
     * @category Animation
     */
    start () {
        this.insertRule();
        const v = this.view();
        v.animationListener().setIsListening(true);
        this.applyToView(v);
        return this;
    }

    /**
     * @description Called when the animation is completed
     * @category Animation
     */
    didComplete () {
    }

}.initThisClass());