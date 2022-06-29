"use strict";

/*

    DragView
    
    A view to globally drag and drop another view or data.

    Dragging Protocol

        Messages sent to the Item 
            
            - onDragItemBegin
            - onDragItemCancelled
            - onDragItemDropped   

        Messages sent to Source 
            
            - onDragSourceBegin
            - onDragSourceHover
            - onDragSourceCancelled // dropped on a view that doesn't accept it
            - onDragSourceDropped
            - onDragSourceEnd

            // using these messages avoids a bunch of conditions in the receiver 
            // the source is repsonsible for completing the drag operation
            // the DragView will set it's destination slot before calling these
            
            - onDragSourceMoveToDestination 
            - onDragSourceCopyToDestination
            - onDragSourceLinkToDestination
            
            - onDragSourceMoveToSelf
            - onDragSourceCopyToSelf
            - onDragSourceLinkToSelf
        
            
        Messages sent to Destination or Hover target 
            
            - acceptsDropHover
            - onDragDestinationEnter // not sent if destination === source
            - onDragDestinationHover
            - onDragDestinationExit
            - acceptsDropHoverComplete
            - onDragDestinationDropped
            - onDragDestinationEnd

        Messages sent by Destination to item

            - onDragRequestRemove() // return true if approved

        Notifications sent

            - onDragViewOpen
            - onDragViewClose

    Example use (from within a view to be dragged):

    onLongPressComplete (longPressGesture) {
        const dv = DragView.clone().setItem(this).setSource(this.column())
        dv.openWithEvent(longPressGesture.currentEvent()) // TODO: eliminate this step?
    } 

*/

(class DragView extends DomStyledView {
    
    initPrototype () {
        // the view that will be dragged when operation is complete
        //this.newSlot("item", null)

        // the set of views that will be dragged
        this.newSlot("items", [])

        // a place for the source to store any extra info about the drag operation,
        // such as the indexes of the items
        this.newSlot("info", null)

        // the view which is the owner of the view being dragged that implements the source protocol
        this.newSlot("source", null)

        // the view on which the item is dropped
        this.newSlot("destination", null)

        this.newSlot("validOperations", new Set(["move", "copy", "link", "delete"]))

        // a list of views that self is currently hovering over
        this.newSlot("hoverViews", null)

        // start position in screen coordinates 
        this.newSlot("dragStartPos", null)

        // the drag operation type: move, copy, link, delete
        this.newSlot("dragOperation", "move").setDoesHookSetter(true)

        this.newSlot("slideBackPeriod", 0.2) // seconds
        this.newSlot("isClosed", false) 
    }

    didUpdateSlotDragOperation () {
        assert(this.validOperations().has(this.dragOperation()))
    }

    init () {
        super.init()
        this.setHoverViews([])

        this.setDisplay("flex")
        this.setPosition("absolute")
        this.turnOffUserSelect()
        this.setOverflow("hidden")
        this.setMinWidthPx(10)
        this.setMinHeightPx(10)
        this.setWidth("fit-content")
        this.setMinHeight("fit-content")
        this.setOpacity(0.9)
        this.setInfo({})

        this.setIsDebugging(true)
        return this
    }

    /*
    prepareToRetire () {
        super.prepareToRetire()
        console.log(this.debugTypeId() + " prepareToRetire() isClosed: " + this.isClosed())
        //debugger;
        return this
    }
    */

    // operation type helpers

    isCopyOp () {
        return this.dragOperation() === "copy"
    }

    isMoveOp () {
        return this.dragOperation() === "move"
    }

    isLinkOp () {
        return this.dragOperation() === "link"
    }

    isDeleteOp () {
        return this.dragOperation() === "delete"
    }

    // ----

    setItems (viewArray) {
        this._items.forEach(v => v.viewRelease())
        this._items = viewArray
        this._items.forEach(v => v.viewRetain())
        //console.log(this.type() + " setItems(" + JSON.stringify(viewArray.map(v => v.debugTypeId())) + ")")
        return this
    }

    setItem (aView) {
        this.setItems([aView])
        return this
    }

    item () {
        return this.items().first()
    }

    // ----

    setupView () {
        if (this.items().length === 1) {
            this.setupSingleItemView()
        } else {
            this.setupMultiItemView()
        }
        this.setZIndex(10)
        return this
    }

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
            //console.log("item dup subview frameInDocument: " + dup.frameInDocument().asString())
            //console.log("item dup subview frameInParentView: " + dup.frameInParentView().asString())
        })

        const ff = this.fixedFrameFittingSubviews()
        const nf = parentView.convertFrameToDocument(ff)
        this.setFrameInDocument(nf)
        //this.setFrameInDocument(this.fixedFrameFittingSubviewsInDocument())
        //this.setBorder("1px dashed yellow")

        // make subviews inline-block
        this.subviews().forEach(sv => {
            sv.setDisplay("inline-block")
            sv.setPosition("relative")
            sv.setTop(null)
            sv.setLeft(null)
            sv.setBorder(null)
            sv.setFloat("left")
            /*
            sv.decrementFixedWidth()
            sv.decrementFixedHeight()
            sv.decrementFixedWidth()
            sv.decrementFixedHeight()
            sv.setMinAndMaxWidth(150)
            sv.setBorder("1px dashed blue")
            */
            //sv.setMinAndMaxHeight(30)
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
        /*
        let maxWidth = this.items().map(v => v.frameInDocument().width()).maxValue()
        let minX = this.items().map(v => v.frameInDocument().left()).minValue()
        let minY = this.items().map(v => v.frameInDocument().top()).minValue()
        //let maxY = this.items().map(v => v.frameInDocument().bottom()).maxValue()

        //this.setMinAndMaxHeight(maxY - minY)
        let offset = minY - f.top()
        this.setTopPx(minY)

        // initial positions
        let y = 0
        this.items().map((item) => {
            const h = item.frameInDocument().height()
            const v = item.htmlDuplicateView()
            const vf = item.frameInParentView()
            v.setPosition("absolute")
            v.setLeftPx(vf.x())
            v.setTopPx(vf.y() - offset)
            v._targetTop = y
            y += h
            v.setTransition("top 0.2s")
            this.addSubview(v)
        })
        this.setMinAndMaxHeight(y)
        this.setOverflow("visible")

        this.addTimeout(() => {
            this.subviews().forEach(v => v.setTopPx(v._targetTop))
        }, 1)
        */

        /*
        // target positions
        let y = 0
        this.items().map((item) => {
            const h = item.frameInDocument().height()
            const v = item.htmlDuplicateView()
            const vf = item.frameInParentView()
            v.setPosition("absolute")
            v.setTopPx(y)
            y += h
            //this.addSubview(v)
        })
        this.setMinAndMaxHeight(y)
        */

    }

    setupSingleItemView () {
        const aView = this.item()
        this.setFrameInDocument(aView.frameInDocument())
        this.setInnerHtml(aView.innerHtml())
        //const clonedElement = aView.element().cloneNode(true);
        this.setOverflow("visible")
    }

    // --- 

    hasPan () {
        return !Type.isNull(this.defaultPanGesture())
    }

    openWithEvent (event) {
        // TODO: this is a hack, find a way to init pan without this
        // setup the Pan Gesture to already be started

        const pan = this.addDefaultPanGesture()
        pan.setShouldRemoveOnComplete(true)
        pan.setMinDistToBegin(0)
        pan.onDown(event)
        pan.attemptBegin()

        this.setTransition("all 0s, transform 0.1s, box-shadow 0.1s")
        this.open()
        
        return this
    }

    acceptsPan () {
        return true
    }

    // --------------------------

    open () {        
        this.setupView()
        DocumentBody.shared().addSubview(this)
        this.orderFront()
        this.onBegin()
        this.postNoteNamed("onDragViewOpen")
        return this
    }

    onBegin () {
        this.sendProtocolMessage(this.source(), "onDragSourceBegin")
    }
    
    // --- panning ---

    onPanBegin (aGesture) {
        this.debugLog("onPanBegin")
        this.setDragStartPos(this.item().positionInDocument())

        // animate the start of the drag

        this.addTimeout(() => {
            this.addPanStyle()
        })

        this.onPanMove(aGesture)
    }

    updatePosition () {
        const newPosition = this.dragStartPos().add(this.defaultPanGesture().diffPos()) 
        this.setLeftPx(newPosition.x())
        this.setTopPx(newPosition.y())
    }

    onPanMove (aGesture) {
        this.updatePosition()
        
        this.addTimeout(() => { 
            this.hoverOverViews()
        })
    }

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

    firstAcceptingDropTarget () {
        return this.hoverViews().detect((v) => {
            return v.acceptsDropHoverComplete && v.acceptsDropHoverComplete(this)
        })
    }

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

    onPanComplete (aGesture) {
        this.debugLog("onPanComplete")

        //this.setDragOperation(this.currentOperation())

        const destView = this.firstAcceptingDropTarget()
        
        if (!destView) {
            this.onPanCancelled(aGesture)
            return;
        }

        const isSource = (destView === this.source())

        this.setDestination(destView)

        if (destView) {
            const completionCallback = () => {
                this.sendProtocolAction(destView, "Dropped") // onDragSourceDropped onDragDestinationDropped

                this.sendProtocolMessage(this.source(), "onDragSourceEnd")
                if (destView !== this.source()) {
                    this.sendProtocolMessage(destView, "onDragDestinationEnd")
                }

                this.close()
            }
            const destFrame = destView.dropCompleteDocumentFrame()
            this.animateToDocumentFrame(destFrame, this.slideBackPeriod(), completionCallback)
            this.removePanStyle()
            this.hoverViews().remove(destView) // so no exit hover message will be sent to it
        } else {
            this.close()
        }
    }

    // --- hovering behaviors ---

    viewsUnderDefaultPan () {
        return DocumentBody.shared().viewsUnderPoint(this.dropPoint())
    }

    dropPoint () {
        return this.defaultPanGesture().currentPosition()
    }

    newHoverViews () {
        //console.log("dropPoint: " + this.dropPoint().asString())
        return this.viewsUnderDefaultPan().select(v => v.acceptsDropHover && v.acceptsDropHover(this))
    }

    hoverOverViews () {
        const oldViews = this.hoverViews()
        const newViews = this.newHoverViews()

        // if new view was not in old one's, we must be entering it
        const enteringViews = newViews.select(v => !oldViews.contains(v))

        // if new view was in old one's, we're still hovering
        const hoveringViews = newViews.select(v => oldViews.contains(v))

        // if old view isn't in new ones, we must have exited it
        const exitingViews = oldViews.select( v => !newViews.contains(v))
 
        // onDragSourceEnter onDragDestinationEnter 
        enteringViews.forEach(aView => this.sendProtocolAction(aView, "Enter"))

        // onDragSourceHover onDragDestinationHover
        hoveringViews.forEach(aView => this.sendProtocolAction(aView, "Hover"))

        // onDragSourceExit onDragDestinationExit 
        exitingViews.forEach(aView =>  this.sendProtocolAction(aView, "Exit")) 

        this.setHoverViews(newViews)
        return this
    }

    exitAllHovers () {
        this.hoverViews().forEach((aView) => { this.sendProtocolAction(aView, "Exit") })
        this.setHoverViews([])
    }

    // drop hover protocol

    sendProtocolAction (aView, action) {
        // onDragSourceHover & onDragDestinationHover
        const isSource = aView === this.source()
        const methodName = "onDrag" + (isSource ? "Source" : "Destination") + action
        //this.debugLog(aView.node().title() + " " + methodName)
        this.sendProtocolMessage(aView, methodName)
    }

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
            assert(!receiver.isObjectRetired()) // TODO: temp sanity check
            receiver[methodName].apply(receiver, [this])
        }
    }
    
    // close

    close () {
        this.debugLog("close")
        this.postNoteNamed("onDragViewClose")
        // handle calling this out of seqence?

        this.exitAllHovers()
        // TODO: animate move to end location before removing

        this.removePanStyle()
        DocumentBody.shared().removeSubview(this)
        this.setItems([])
        this.setIsClosed(true)

        return this
    }

    // --- drag style ---

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
