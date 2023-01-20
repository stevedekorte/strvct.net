"use strict";

/*
    DomView

    Base view class. Wraps a dom element. 
    This is wrapped instead of a category or subclass of Element/etc because:
      - The DOM doesn't play nicely with such extensions.
      - Keep open possibility of being ability swap out DOM as a render/event layer 
    
    TODO: add class variable validPropertyValues[propertyName] -> validValueSet and check css values if available?

*/

(class ElementDomView extends ProtoClass {

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

    static documentBodyView () {
        return DocumentBody.shared()
    }
    
    initPrototypeSlots () {
        this.newSlot("elementClassName", "")
        this.newSlot("elementType", "div")
        this.newSlot("element", null)
    }

    init () {
        super.init()
        this.setupElement()
        return this
    }

    // retiring

    gestureRecognizerListeners () {
        const results = this.gestureRecognizers().map(gr => gr.allEventListeners()).flat()
        results.forEach(result => {
            assert(result.thisClass().isKindOf(EventListener))
        })
        return results
    }

    allEventListeners () {
        const results = [this.eventListeners(), this.gestureRecognizerListeners()].flat()
        /*
        results.forEach(result => {
            assert(result.thisClass().isKindOf(EventListener))
        })
        */
        return results
    }

    fullActiveEventListenerCount () {
        return this.allEventListeners().filter(v => v.isListening()).length
    }

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

    prepareToRetire () {
        //debugger;
        console.log(this.typeId() + " prepareToRetire")
        assert(!this.hasParentView())

        // if view has no parent at the end of event loop, 
        // our policy is to retire the view

        this.setIsRegisteredForVisibility(false) // this one isn't a listener
        
        this.retireSubviewTree()

        // do this after removing subviews, just in case events where added by those changes
        this.removeAllGestureRecognizers()
        this.removeAllListeners()
        this.cancelAllTimeouts()

        //this.assertEventListenerCountsMatch()

        /*
        if (this.externalFullActiveEventListenerCount()) {
            console.warn(this.typeId() + " was unable to remove the following event listeners:")
            EventListener.showActiveForOwner(this)
            debugger
        }
        */

        //assert(!EventListener.activeOwners().has(this))

        SyncScheduler.shared().unscheduleTarget(this)

        //if (this.isFirstResponder()) {
        //    this.blur() / is this needed?
        //}

        this.detachFromElement()

        super.prepareToRetire() // call on super
        return this
    }

    detachFromElement () {
        const e = this.element()
        //e.style.transition = "all 0s" // probably not needed
        if (e) {
            e.setDomView(null)
            this._element = null
        }
        e.removeAllChildren()
    }

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

    setElementId (aString) {
        this.setAttribute("id", aString)
        return this
    }

    elementId () {
        return this.getAttribute("id")
    }

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
            

            this._element = e
            e.setDomView(this)
            /*
            if (e) {
                // use timer as focus listener can't be set up yet - why not?
                this.addTimeout(() => { this.setIsRegisteredForFocus(true); }, 0) 
            }
            */
        }
        return this
    }

    hasElement () {
        return !Type.isNullOrUndefined(this.element())
    }

    createElement () {
        const e = document.createElement(this.elementType())
        return e
    }

    setupElement () {
        const e = this.createElement()
        this.setElement(e)
        this.setElementId(this.debugTypeId())
        //this.setupElementClassName()
        return this
    }

    escapedElementId () {
        const id = this.elementId()
        const escapedId = id.replace(/[^a-z|\d]/gi, '\\$&');
        return escapedId
    }

    setupElementClassName () {
        const e = this.element()
        const ancestorNames = this.thisClass().ancestorClassesIncludingSelf().map(obj => obj.type())
        ancestorNames.forEach(name => e.classList.add(name))
        return this
    }

    insertElementClassName (aName) {
        const e = this.element()
        e.classList.add(aName)
        return this
    }

    removeElementClassName (aName) {
        const e = this.element()
        e.classList.remove(aName)
        return this
    }

    setElementClassNames (names) {
        this.setElementClassName(names.join(" "))
        return this
    }
  
    // --- element class name ---

    setElementClassName (aName) {
        if (this._elementClassName !== aName) {
            this._elementClassName = aName
            if (this.element()) {
                this.setAttribute("class", aName);
            }
        }
        return this
    }

    elementClassName () {
        if (this.element()) {
            const className = this.getAttribute("class");
            this._elementClassName = className
            return className
        }
        return this._elementClassName
    }

    loremIpsum (maxWordCount) {
        this.setInnerHtml("".loremIpsum(10, 40))
        return this
    }

    // --- editing - abstracted from content editable for use in non text views ---

    setIsEditable (aBool) {
        // subclasses can override for non text editing behaviors e.g. a checkbox, toggle switch, etc
        this.setContentEditable(aBool)
        return this
    }

    isEditable () {
        return this.isContentEditable()
    }

    // --- content editing ---

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

    isContentEditable () { 
        // there's a separate method for contentEditable() that just accesses element attribute
        //const v = window.getComputedStyle(this.element(), null).getPropertyValue("contentEditable");
        const s = this.getAttribute("contentEditable")
        if (s === "inherit" && this.parentView()) {
            return this.parentView().isContentEditable()
        }
        const aBool = (s === "true" || s === true)
        return aBool
    }

    contentEditable () {
        return this.getAttribute("contentEditable") === "true"
    }



}.initThisClass());
