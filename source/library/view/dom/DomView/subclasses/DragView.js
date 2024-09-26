/**
 * @module library.view.dom.DomView.subclasses.DragView
 */

"use strict";

/**
 * @class DragView
 * @extends StyledDomView
 * @classdesc A view to globally drag and drop another view or data.
 *
 * Dragging Protocol
 *
 * Messages sent to the Item 
 *     - onDragItemBegin
 *     - onDragItemCancelled
 *     - onDragItemDropped   
 *
 * Messages sent to Source 
 *     - onDragSourceBegin
 *     - onDragSourceHover
 *     - onDragSourceCancelled // dropped on a view that doesn't accept it
 *     - onDragSourceDropped
 *     - onDragSourceEnd
 *
 *     // using these messages avoids a bunch of conditions in the receiver 
 *     // the source is repsonsible for completing the drag operation
 *     // the DragView will set it's destination slot before calling these
 *     
 *     - onDragSourceMoveToDestination 
 *     - onDragSourceCopyToDestination
 *     - onDragSourceLinkToDestination
 *     
 *     - onDragSourceMoveToSelf
 *     - onDragSourceCopyToSelf
 *     - onDragSourceLinkToSelf
 *     
 * Messages sent to Destination or Hover target 
 *     - acceptsDropHover
 *     - onDragDestinationEnter // not sent if destination === source
 *     - onDragDestinationHover
 *     - onDragDestinationExit
 *     - acceptsDropHoverComplete
 *     - onDragDestinationDropped
 *     - onDragDestinationEnd
 *
 * Messages sent by Destination to item
 *     - onDragRequestRemove() // return true if approved
 *
 * Notifications sent
 *     - onDragViewOpen
 *     - onDragViewClose
 *
 * Example use (from within a view to be dragged):
 *
 * onLongPressComplete (longPressGesture) {
 *     const dv = DragView.clone().setItem(this).setSource(this.column())
 *     dv.openWithEvent(longPressGesture.currentEvent()) // TODO: eliminate this step?
 * } 
 */
(class DragView extends StyledDomView {
    
    initPrototypeSlots () {
        // the view that will be dragged when operation is complete
        //this.newSlot("item", null)

        /**
         * @member {Array} items - The set of views that will be dragged
         */
        {
            const slot = this.newSlot("items", []);
            slot.setSlotType("Array");
        }

        /**
         * @member {Object} info - A place for the source to store any extra info about the drag operation, such as the indexes of the items
         */
        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {DomView} source - The view which is the owner of the view being dragged that implements the source protocol
         */
        {
            const slot = this.newSlot("source", null);
            slot.setSlotType("DomView"); // TODO: make this a protocol
        }

        /**
         * @member {DomView} destination - The view on which the item is dropped
         */
        {
            const slot = this.newSlot("destination", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {Set} validOperations - The set of valid drag operations
         */
        {
            const slot = this.newSlot("validOperations", new Set(["move", "copy", "link", "delete"]));
            slot.setSlotType("Set");
        }

        /**
         * @member {Array} hoverViews - A list of views that self is currently hovering over
         */
        {
            const slot = this.newSlot("hoverViews", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Point} dragStartPos - Start position in screen coordinates 
         */
        {
            const slot = this.newSlot("dragStartPos", null);
            slot.setSlotType("Point");
        }

        /**
         * @member {String} dragOperation - The drag operation type: move, copy, link, delete
         */
        {
            const slot = this.newSlot("dragOperation", "move")
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
        }

        /**
         * @member {Number} slideBackPeriod - The duration of the slide back animation in seconds
         */
        {
            const slot = this.newSlot("slideBackPeriod", 0.2);
            slot.setSlotType("Number");
        }

        /**
         * @member {Boolean} isClosed - Indicates whether the DragView is closed
         */
        {
            const slot = this.newSlot("isClosed", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Validates the drag operation when it's updated
     * @private
     */
    didUpdateSlotDragOperation () {
        assert(this.validOperations().has(this.dragOperation()));
    }

    /**
     * @description Initializes the DragView
     * @returns {DragView} The initialized DragView instance
     */
    init () {
        super.init();
        this.setHoverViews([]);

        this.setDisplay("flex");
        this.setPosition("absolute");
        this.turnOffUserSelect();
        this.setOverflow("hidden");
        this.setMinWidthPx(10);
        this.setMinHeightPx(10);
        this.setWidth("fit-content");
        this.setMinHeight("fit-content");
        this.setOpacity(0.9);
        this.setInfo({});

        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Checks if the current operation is a copy operation
     * @returns {Boolean} True if it's a copy operation, false otherwise
     */
    isCopyOp () {
        return this.dragOperation() === "copy";
    }

    /**
     * @description Checks if the current operation is a move operation
     * @returns {Boolean} True if it's a move operation, false otherwise
     */
    isMoveOp () {
        return this.dragOperation() === "move";
    }

    /**
     * @description Checks if the current operation is a link operation
     * @returns {Boolean} True if it's a link operation, false otherwise
     */
    isLinkOp () {
        return this.dragOperation() === "link";
    }

    /**
     * @description Checks if the current operation is a delete operation
     * @returns {Boolean} True if it's a delete operation, false otherwise
     */
    isDeleteOp () {
        return this.dragOperation() === "delete";
    }

    /**
     * @description Sets a single item to be dragged
     * @param {DomView} aView - The view to be dragged
     * @returns {DragView} The DragView instance
     */
    setItem (aView) {
        this.setItems([aView]);
        return this;
    }

    /**
     * @description Gets the first item in the items array
     * @returns {DomView} The first item
     */
    item () {
        return this.items().first();
    }

    /**
     * @description Sets up the view for dragging
     * @returns {DragView} The DragView instance
     */
    setupView () {
        if (this.items().length === 1) {
            this.setupSingleItemView();
        } else {
            this.setupMultiItemView();
        }
        this.setZIndex(10);
        return this;
    }

    /**
     * @description Sets up the view for dragging multiple items
     * @private
     */
    setupMultiItemView () {
        const parentView = this.items().first().parentView()

        // copy parent frame
        const f = parentView.frameInDocument()
        this.setFrameInDocument(f)
        this.setBackgroundColor("transparent")

        // duplicate item subviews
        this.items().forEach(sv => {
            const dup = sv.htmlDuplicateView()
            this.addSubview(dup)
            assert(dup.hasFixedFrame())
        })

        const ff = this.fixedFrameFittingSubviews()
        const nf = parentView.convertFrameToDocument(ff)
        this.setFrameInDocument(nf)

        // make subviews inline-block
        this.subviews().forEach(sv => {
            sv.setDisplay("inline-block")
            sv.setPosition("relative")
            sv.setTop(null)
            sv.setLeft(null)
            sv.setBorder(null)
            sv.setFloat("left")
        })
        
        this.setDisplay("block")
        this.setWhiteSpace("normal")
        this.setOverflow("hidden")
        this.setWidth(null)
        this.setHeight(null)

        this.setWidth("fit-content")
        this.setHeight("fit-content")
        this.setMinAndMaxWidth(null)
        this.setMinAndMaxHeight(null)
    }

    /**
     * @description Sets up the view for dragging a single item
     * @private
     */
    setupSingleItemView () {
        const aView = this.item()
        this.setFrameInDocument(aView.frameInDocument())
        this.setInnerHtml(aView.innerHtml())
        this.setOverflow("visible")
    }

    /**
     * @description Checks if the DragView has a pan gesture
     * @returns {Boolean} True if it has a pan gesture, false otherwise
     */
    hasPan () {
        return !Type.isNull(this.defaultPanGesture())
    }

    /**
     * @description Opens the DragView with a given event
     * @param {Event} event - The event that triggered the opening
     * @returns {DragView} The DragView instance
     */
    openWithEvent (event) {
        const pan = this.addDefaultPanGesture()
        pan.setShouldRemoveOnComplete(true)
        pan.setMinDistToBegin(0)
        pan.onDown(event)
        pan.attemptBegin()

        this.setTransition("all 0s, transform 0.1s, box-shadow 0.1s")
        this.open()
        
        return this
    }

    /**
     * @description Checks if the DragView accepts pan gestures
     * @returns {Boolean} Always returns true
     */
    acceptsPan () {
        return true
    }

    /**
     * @description Opens the DragView
     * @returns {DragView} The DragView instance
     */
    open () {        
        this.setupView()
        DocumentBody.shared().addSubview(this)
        this.orderFront()
        this.onBegin()
        this.postNoteNamed("onDragViewOpen")
        return this
    }

    /**
     * @description Handles the beginning of the drag operation
     * @private
     */
    onBegin () {
        this.sendProtocolMessage(this.source(), "onDragSourceBegin")
    }
    
    /**
     * @description Handles the beginning of a pan gesture
     * @param {PanGesture} aGesture - The pan gesture
     * @private
     */
    onPanBegin (aGesture) {
        this.debugLog("onPanBegin")
        this.setDragStartPos(this.item().positionInDocument())

        this.addTimeout(() => {
            this.addPanStyle()
        })

        this.onPanMove(aGesture)
    }

    /**
     * @description Updates the position of the DragView
     * @private
     */
    updatePosition () {
        const newPosition = this.dragStartPos().add(this.defaultPanGesture().diffPos()) 
        this.setLeftPx(newPosition.x())
        this.setTopPx(newPosition.y())
    }

    /**
     * @description Handles the movement during a pan gesture
     * @param {PanGesture} aGesture - The pan gesture
     * @private
     */
    onPanMove (aGesture) {
        this.updatePosition()
        
        this.addTimeout(() => { 
            this.hoverOverViews()
        })
    }

    /**
     * @description Handles the cancellation of a pan gesture
     * @param {PanGesture} aGesture - The pan gesture
     * @private
     */
    onPanCancelled (aGesture) {
        const destFrame = this.source().dropCompleteDocumentFrame()

        const completionCallback = () => { 
            this.sendProtocolMessage(this.source(), "onDragSourceCancelled")
            this.sendProtocolMessage(this.source(), "onDragSourceEnd")
            this.close() 
        }

        this.animateToDocumentFrame(destFrame, this.slideBackPeriod(), completionCallback)
        this.removePanStyle()
    }

    /**
     * @description Finds the first view that accepts the drop
     * @returns {DomView|null} The first accepting drop target or null if none found
     * @private
     */
    firstAcceptingDropTarget () {
        return this.hoverViews().detect((v) => {
            return v.acceptsDropHoverComplete && v.acceptsDropHoverComplete(this)
        })
    }

    /**
     * @description Determines the current drag operation based on keyboard state
     * @returns {String} The current drag operation
     * @private
     */
    currentOperation () {
        const keyboard = BMKeyboard.shared()

        if (keyboard.alternateKey().isDown()) {
            return "copy"
        }

        if (keyboard.alternateKey().isDown()) {
            return "link"
        }

        return "move"
    }

    /**
     * @description Handles the completion of a pan gesture
     * @param {PanGesture} aGesture - The pan gesture
     * @private
     */
    onPanComplete (aGesture) {
        this.debugLog("onPanComplete")

        const destView = this.firstAcceptingDropTarget()
        
        if (!destView) {
            this.onPanCancelled(aGesture)
            return;
        }

        const isSource = (destView === this.source())

        this.setDestination(destView)

        if (destView) {
            const completionCallback = () => {
                this.sendProtocolAction(destView, "Dropped")

                this.sendProtocolMessage(this.source(), "onDragSourceEnd")
                if (destView !== this.source()) {
                    this.sendProtocolMessage(destView, "onDragDestinationEnd")
                }

                this.close()
            }
            const destFrame = destView.dropCompleteDocumentFrame()
            this.animateToDocumentFrame(destFrame, this.slideBackPeriod(), completionCallback)
            this.removePanStyle()
            this.hoverViews().remove(destView)
        } else {
            this.close()
        }
    }

    /**
     * @description Gets the views under the current pan position
     * @returns {Array} An array of views under the current pan position
     * @private
     */
    viewsUnderDefaultPan () {
        return DocumentBody.shared().viewsUnderPoint(this.dropPoint())
    }

    /**
     * @description Gets the current drop point
     * @returns {Point} The current drop point
     * @private
     */

    dropPoint () {
        return this.defaultPanGesture().currentPosition()
    }

    /**
     * @description Gets the new hover views.
     * @returns {Array} The new hover views.
     * @private
     */
    newHoverViews () {
        //console.log("dropPoint: " + this.dropPoint().asString())
        return this.viewsUnderDefaultPan().select(v => v.acceptsDropHover && v.acceptsDropHover(this))
    }

    /**
     * @description Updates the hover views.
     * @returns {DragView} The current instance.
     */
    hoverOverViews () {
        const oldViews = this.hoverViews()
        const newViews = this.newHoverViews()

        // if new view was not in old one's, we must be entering it
        const enteringViews = newViews.select(v => !oldViews.contains(v))

        // if new view was in old one's, we're still hovering
        const hoveringViews = newViews.select(v => oldViews.contains(v))

        // if old view isn't in new ones, we must have exited it
        const exitingViews = oldViews.select(v => !newViews.contains(v))
 
        // onDragSourceEnter onDragDestinationEnter 
        enteringViews.forEach(aView => this.sendProtocolAction(aView, "Enter"))

        // onDragSourceHover onDragDestinationHover
        hoveringViews.forEach(aView => this.sendProtocolAction(aView, "Hover"))

        // onDragSourceExit onDragDestinationExit 
        exitingViews.forEach(aView =>  this.sendProtocolAction(aView, "Exit")) 

        this.setHoverViews(newViews)
        return this
    }

    /**
     * @description Exits all hover views.
     */
    exitAllHovers () {
        this.hoverViews().forEach((aView) => { this.sendProtocolAction(aView, "Exit") })
        this.setHoverViews([])
    }

    // drop hover protocol

    /**
     * @description Sends a protocol action to a view.
     * @param {DomView} aView - The view to send the action to.
     * @param {string} action - The action to send.
     */
    sendProtocolAction (aView, action) {
        // onDragSourceHover & onDragDestinationHover
        const isSource = aView === this.source()
        const methodName = "onDrag" + (isSource ? "Source" : "Destination") + action
        //this.debugLog(aView.node().title() + " " + methodName)
        this.sendProtocolMessage(aView, methodName)
    }

    /**
     * @description Sends a protocol message to a receiver.
     * @param {DomView} receiver - The receiver of the message.
     * @param {string} methodName - The method name to call.
     */
    sendProtocolMessage (receiver, methodName) {
        if (!methodName.contains("Hover") && this.isDebugging()) {

            let msg = receiver.typeId() + " " + methodName 

            if (methodName.contains("Dropped")) {
                msg += " " + this.dragOperation()
            }
    
            if (!receiver[methodName]) {
                msg += " <<<<<<<<<<<<<< NOT FOUND "
            }

            this.debugLog(msg)
        }

        if (receiver[methodName]) {
            // this fails on onDragDestinationEnd method triggered by onMouseUpCapture
            receiver[methodName].call(receiver, this)
        }
    }
    
    // close

    /**
     * @description Closes the DragView.
     * @returns {DragView} The current instance.
     */ 
    close () {
        this.debugLog("close")
        this.postNoteNamed("onDragViewClose")
        // handle calling this out of seqence?

        this.exitAllHovers()
        // TODO: animate move to end location before removing

        this.removePanStyle()
        DocumentBody.shared().removeSubview(this)
        assert(Type.isNullOrUndefined(this.element().parentNode)) // sanity check
        this.setItems([])
        this.setIsClosed(true)


        return this
    }

    // --- drag style ---

    /**
     * @description Adds a pan style to the DragView.
     * @returns {DragView} The current instance.
     */
    addPanStyle () {
        const s = "0px 0px 10px 10px rgba(0, 0, 0, 0.5)"
        const r = 1.05 // 1.1 * (1/Math.sqrt(this.items().length))
        this.setTransform("scale(" + r + ")")
        if (this.subviews().length) {
            this.subviews().forEach(v => v.setBoxShadow(s))
        } else {
            this.setBoxShadow(s)
        }
        return this
    }

    /**
     * @description Removes the pan style from the DragView.
     * @returns {DragView} The current instance.
     */
    removePanStyle () {
        const s = "none"
        this.setTransform("scale(1)")
        if (this.subviews().length) {
            this.subviews().forEach(v => v.setBoxShadow(s))
        } else {
            this.setBoxShadow(s)
        }
        return this
    }

}.initThisClass());
