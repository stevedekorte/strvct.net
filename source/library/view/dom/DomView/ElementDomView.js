"use strict";

/**
 * @module library.view.dom.DomView
 */

/**
 * @class ElementDomView
 * @extends ProtoClass
 * @classdesc Base view class. Wraps a dom element. 
 * This is wrapped instead of a category or subclass of Element/etc because:
 *   - The DOM doesn't play nicely with such extensions.
 *   - Keep open possibility of being ability swap out DOM as a render/event layer 
 * 
 * TODO: add class variable validPropertyValues[propertyName] -> validValueSet and check css values if available?
 */
(class ElementDomView extends ProtoClass {

    /*
    static initClass () {
        this.newClassSlot("viewsWithoutParents", new Set()) // track these so we can retire them, but not during drag & drop 
        this.newClassSlot("isPausingRetires", false) // when true, retireQueue is paused
    }

    static pauseRetires () {
        this.setIsPausingRetires(true)
    }

    static unpauseRetires () {
        this.setIsPausingRetires(false)
    }

    static retireParentlessViews () {
        debugger;
        const parentless = this.viewsWithoutParents()

        while (parentless.size) { // do this effective "pop" loop, so it's ok to delete items inside a prepareToRetire
            if (this.isPausingRetires()) {
                console.log("retireParentlessViews  isPausingRetires")
                return
            }

            const view = parentless.pop();
            view.prepareToRetire()
            parentless.delete(view)
        }
    }
    */

    /**
     * @static
     * @returns {DocumentBody} The shared instance of DocumentBody
     */
    static documentBodyView () {
        return DocumentBody.shared()
    }
    
    initPrototypeSlots () {
        /**
         * @property {string} elementClassName
         */
        {
            const slot = this.newSlot("elementClassName", "");
            slot.setSlotType("String");
        }
        /**
         * @property {string} elementType
         */
        {
            const slot = this.newSlot("elementType", "div");
            slot.setSlotType("String");
        }
        /**
         * @property {Element} element
         */
        {
            const slot = this.newSlot("element", null);
            slot.setSlotType("Element");
        }
        /**
         * @property {boolean} usesSmoothScrolling
         */
        {
            const slot = this.newSlot("usesSmoothScrolling", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the ElementDomView
     * @returns {ElementDomView} The initialized instance
     */
    init () {
        super.init()
        this.setupElement()
        return this
    }

    // retiring

    /**
     * @description Gets all gesture recognizer listeners
     * @returns {Array} Array of event listeners
     */
    gestureRecognizerListeners () {
        const results = this.gestureRecognizers().map(gr => gr.allEventListeners()).flat();
        /*
        results.forEach(result => {
            assert(result.thisClass().isKindOf(EventListener));
        });
        */
        return results;
    }

    /**
     * @description Gets all event listeners
     * @returns {Array} Array of all event listeners
     */
    allEventListeners () {
        const results = [this.eventListeners(), this.gestureRecognizerListeners()].flat();
        /*
        results.forEach(result => {
            assert(result.thisClass().isKindOf(EventListener))
        })
        */
        return results;
    }

    /**
     * @description Gets the count of all active event listeners
     * @returns {number} Count of active event listeners
     */
    fullActiveEventListenerCount () {
        return this.allEventListeners().filter(v => v.isListening()).length;
    }

    /**
     * @description Gets the count of all external active event listeners
     * @returns {number} Count of external active event listeners
     */
    externalFullActiveEventListenerCount () {
        return EventListener.activeListenersForOwner(this).length;
    }

    /*
    assertEventListenerCountsMatch () {
        let internal = this.fullActiveEventListenerCount()
        if (isNaN(internal)) {
            debugger;
            this.fullActiveEventListenerCount()
        }
        let external = this.externalFullActiveEventListenerCount()
        if (internal !== external) {
            console.log(this.typeId() + " internal: " + internal + " ", this.allEventListeners().filter(v => v.isListening()).map(v => v.fullMethodName()) )
            console.log(this.typeId() + " external: " + external + " ", EventListener.activeListenersForOwner(this).map(v => v.fullMethodName()))
            this.fullActiveEventListenerCount();
            EventListener.activeListenersForOwner(this);
            debugger;
        }
        //assert(internal === external)
    }
    */

    /**
     * @description Prepares the view for retirement
     * @returns {ElementDomView} The current instance
     */
    prepareToRetire () {
        //debugger;
        console.log(this.typeId() + " prepareToRetire");
        assert(!this.hasParentView());

        // if view has no parent at the end of event loop, 
        // our policy is to retire the view

        this.setIsRegisteredForVisibility(false); // this one isn't a listener
        
        this.retireSubviewTree();

        // do this after removing subviews, just in case events where added by those changes
        this.removeAllGestureRecognizers();
        this.removeAllListeners();
        this.cancelAllTimeouts();

        //this.assertEventListenerCountsMatch();

        /*
        if (this.externalFullActiveEventListenerCount()) {
            console.warn(this.typeId() + " was unable to remove the following event listeners:");
            EventListener.showActiveForOwner(this);
            debugger;
        }
        */

        //assert(!EventListener.activeOwners().has(this));

        SyncScheduler.shared().unscheduleTarget(this);

        //if (this.isFirstResponder()) {
        //    this.blur(); / is this needed?
        //}

        this.detachFromElement();

        super.prepareToRetire(); // call on super
        return this;
    }

    /**
     * @description Detaches the view from its element
     */
    detachFromElement () {
        const e = this.element();
        //e.style.transition = "all 0s" // probably not needed
        if (e) {
            e.setDomView(null);
            this._element = null;
        }
        e.removeAllChildren();
    }

    /**
     * @description Retires the subview tree
     */
    retireSubviewTree () {
        // this should be called by:
        //   scheduleRetireIfReady() -> prepareToRetire()
        // will this cause a SyncAction loop issue as this will result in adding:
        //   scheduleMethod("retireIfReady")
        // on subviews, so we do it in a way that avoids this.

        this.subviews().forEach(sv => {
            sv.setParentView(null)
            sv.prepareToRetire()
        })
    }

    // --- element ---

    /**
     * @description Sets the element ID
     * @param {string} aString - The ID to set
     * @returns {ElementDomView} The current instance
     */
    setElementId (aString) {
        this.setAttribute("id", aString)
        return this
    }

    /**
     * @description Gets the element ID
     * @returns {string} The element ID
     */
    elementId () {
        return this.getAttribute("id")
    }

    /**
     * @description Sets the element
     * @param {Element} e - The element to set
     * @returns {ElementDomView} The current instance
     */
    setElement (e) {
        if (e === this._element) {
            console.warn("attempt to set to same element")
        } else {
            if (Type.isNullOrUndefined(e)) {
                console.warn(this.debugTypeId() + " setElement null")
                debugger;
            }
            
            //assert(!this._element) // element shouldn't change, if only to avoid dealing with listener issues
            
            if (this._element) {
                this.removeAllListeners()
            }
            
            const oldValue = this._element
            this._element = e
            e.setDomView(this)

            this.didUpdateSlotElement(oldValue, e)
            
            /*
            if (e) {
                // use timer as focus listener can't be set up yet - why not?
                this.addTimeout(() => { this.setIsRegisteredForFocus(true); }, 0) 
            }
            */
        }
        return this
    }

    /**
     * @description Called when the element slot is updated
     * @param {Element} e - The old element value
     * @returns {ElementDomView} The current instance
     */
    didUpdateSlotElement (e) {
        // for subclasses to override
        return this
    }

    /**
     * @description Checks if the view has an element
     * @returns {boolean} True if the view has an element, false otherwise
     */
    hasElement () {
        return !Type.isNullOrUndefined(this.element())
    }

    /**
     * @description Creates a new element
     * @returns {Element} The created element
     */
    createElement () {
        const e = document.createElement(this.elementType())
        return e
    }

    /**
     * @description Sets up the element
     * @returns {ElementDomView} The current instance
     */
    setupElement () {
        const e = this.createElement()
        this.setElement(e)
        this.setElementId(this.debugTypeId())
        //this.setupElementClassName()
        return this
    }

    /**
     * @description Gets the escaped element ID
     * @returns {string} The escaped element ID
     */
    escapedElementId () {
        const id = this.elementId()
        const escapedId = id.replace(/[^a-z|\d]/gi, '\\$&');
        return escapedId
    }

    /**
     * @description Sets up the element class name
     * @returns {ElementDomView} The current instance
     */
    setupElementClassName () {
        const e = this.element()
        const ancestorNames = this.thisClass().ancestorClassesIncludingSelf().map(obj => obj.type())
        ancestorNames.forEach(name => e.classList.add(name))
        return this
    }

    /**
     * @description Inserts a class name to the element
     * @param {string} aName - The class name to insert
     * @returns {ElementDomView} The current instance
     */
    insertElementClassName (aName) {
        const e = this.element()
        e.classList.add(aName)
        return this
    }

    /**
     * @description Removes a class name from the element
     * @param {string} aName - The class name to remove
     * @returns {ElementDomView} The current instance
     */
    removeElementClassName (aName) {
        const e = this.element()
        e.classList.remove(aName)
        return this
    }

    /**
     * @description Sets multiple class names for the element
     * @param {Array} names - Array of class names
     * @returns {ElementDomView} The current instance
     */
    setElementClassNames (names) {
        this.setElementClassName(names.join(" "))
        return this
    }
  
    // --- element class name ---

    /**
     * @description Sets the element class name
     * @param {string} aName - The class name to set
     * @returns {ElementDomView} The current instance
     */
    setElementClassName (aName) {
        if (this._elementClassName !== aName) {
            this._elementClassName = aName
            if (this.element()) {
                this.setAttribute("class", aName);
            }
        }
        return this
    }

    /**
     * @description Gets the element class name
     * @returns {string} The element class name
     */
    elementClassName () {
        if (this.element()) {
            const className = this.getAttribute("class");
            this._elementClassName = className
            return className
        }
        return this._elementClassName
    }

    /**
     * @description Sets lorem ipsum text
     * @param {number} maxWordCount - Maximum word count
     * @returns {ElementDomView} The current instance
     */
    loremIpsum (maxWordCount) {
        this.setInnerHtml("".loremIpsum(10, 40))
        return this
    }

    // --- editing - abstracted from content editable for use in non text views ---

    /**
     * @description Sets whether the view is editable
     * @param {boolean} aBool - True to make editable, false otherwise
     * @returns {ElementDomView} The current instance
     */
    setIsEditable (aBool) {
        // subclasses can override for non text editing behaviors e.g. a checkbox, toggle switch, etc
        this.setContentEditable(aBool)
        return this
    }

    /**
     * @description Checks if the view is editable
     * @returns {boolean} True if editable, false otherwise
     */
    isEditable () {
        return this.isContentEditable()
    }

    // --- content editing ---

    /**
     * @description Sets whether the content is editable
     * @param {boolean} aBool - True to make content editable, false otherwise
     * @returns {ElementDomView} The current instance
     */
    setContentEditable (aBool) {
        //console.log(this.elementClassName() + " setContentEditable(" + aBool + ")")
        if (aBool) {
            this.makeCursorText()
        } else {
            this.makeCursorDefault() // is this correct?
        }

        this.setAttribute("contentEditable", aBool ? "true" : "false")

        /*
        if (this.showsHaloWhenEditable()) {
            this.setBoxShadow(aBool ? "0px 0px 5px #ddd" : "none")
        }
        */

        this.setCssProperty("outline", "none")

        this.setIsRegisteredForKeyboard(aBool)

        if (aBool) {
            this.turnOnUserSelect()
        } else {
            this.setUserSelect("auto")
        }

        this.setIsRegisteredForClipboard(aBool) // so we receive onPaste events from clipboard

        return this
    }

    /**
     * @description Checks if the content is editable
     * @returns {boolean} True if content is editable, false otherwise
     */
    isContentEditable () { 
        // there's a separate method for contentEditable() that just accesses element attribute
        //const v = window.getComputedStyle(this.element(), null).getPropertyValue("contentEditable");
        const s = this.getAttribute("contentEditable");
        if (s === "inherit" && this.parentView()) {
            return this.parentView().isContentEditable();
        }
        const aBool = (s === "true" || s === true);
        return aBool;
    }

    /**
     * @description Gets the contentEditable attribute value
     * @returns {boolean} True if contentEditable is "true", false otherwise
     */
    contentEditable () {
        return this.getAttribute("contentEditable") === "true";
    }


}.initThisClass());