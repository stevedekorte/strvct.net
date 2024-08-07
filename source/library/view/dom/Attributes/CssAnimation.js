
"use strict";

/*

    CssAnimation

    Encapsulation of CSS animation rule and animation control properties on a view.
    It will also start an animationListener on the target view, 
    which will send a onAnimationStart, and onAnimationEnd messages to the view.

    It works by composing a CSS animation rule and inserting it into the document's first style sheet.
    The rule name is a hash of the rule content, and the CssAnimation class keeps a set of names
    it's already registered, so it doesn't register them again.

    Example use:
         
        CssAnimation.clone().setPropertyName("right").setTargetValue("10px").setView(aView).start()

    */

(class CssAnimation extends ProtoClass {


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

    static initClass () {
        this.newClassSlot("insertedRuleNamesSet", new Set())
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("view", null);
            slot.setSlotType("DomView");
        }
        {
            const slot = this.newSlot("propertyName", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("startValue", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("targetValue", 0);
            slot.setSlotType("String");
        }

        // animation name is computed from hash of animation css rule string
        {
            const slot = this.newSlot("duration", 1);
            slot.setComment("seconds");
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("timingFunction", "ease");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("iterationCount", 1) // animation-iteration-count
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("delay", 0); // animation-delay
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("direction", "normal"); // animation-direction (normal or alternate)
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("fillMode", "forwards");  // animation-fill-mode (none|forwards|backwards|both|initial|inherit)
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("playState", "running");  // animation-play-state (paused|running|initial|inherit)
            slot.setSlotType("String");
        }
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
        {
            const slot = this.newSlot("propertySlotsDict", null);
            slot.setSlotType("Object");
        }
    }

    initPrototype () {
        this.propertySlotsDict(); // cache it on the prototype
    }

    init () {
        super.init();
    }

    insertRule () {
        assert(this.isValidRule());
        this.thisClass().insertRuleForAnimation(this);
    }

    composedRule () {
        return "@keyframes " + this.name() + " { " + this.ruleContent() + "}";
    }

    name () {
        return "animation" + this.ruleContent().hashCode();
    }

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

    isValidRule () {
        return !Type.isNullOrUndefined(this.startValue()) && Type.isNullOrUndefined(this.targetValue());
    }

    propertySlotsDict () {
        if (!this._propertySlotsDict) {
            const dict = {};
            this.animationPropertyNames().forEach(k => dict[k] = this.slotNameForPropertyName(k));
            this._propertySlotsDict = dict;
        }
        return this._propertySlotsDict;
    }

    slotNameForPropertyName (k) {
        const parts = k.split("-");
        parts.removeFirst();
        const result = parts.map(p => p.capitalized()).join("").uncapitalized();
        //console.log("slotNameForPropertyName('" + k + "') -> '" + result + "'");
        return result;
    }

    applyToView (aView) { 
        const dict = this.propertySlotsDict();
        const e = this.view().element();
        Reflect.ownKeys(dict).forEach(attributeName => {
            const slotName = dict[attributeName];
            const value = this[slotName].apply(this);
            e.setAttribute(attributeName, value);
        })
    }

    start () {
        this.insertRule();
        const v = this.view();
        v.animationListener().setIsListening(true);
        this.applyToView(v);
        return this;
    }

    didComplete () {
    }

}.initThisClass());


