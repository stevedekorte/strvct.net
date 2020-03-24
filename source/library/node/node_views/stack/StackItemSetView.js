"use strict"

/*
    
    StackItemSetView
    
*/

window.StackItemSetView = class StackItemSetView extends NodeView {
    
        
    initPrototype () {
        /*
        this.newSlot("rows", null)
        this.newSlot("allowsCursorNavigation", true)
        this.newSlot("defaultRowStyles", null)
        this.newSlot("rowStyles", null)
        this.newSlot("rowPlaceHolder", null)
        this.newSlot("hasPausedSync", false)
        */
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setFlexDirection("column")
        this.setPosition("relative")
        this.setMinAndMaxWidth("100%")
        this.setMinAndMaxHeight("100%")
        this.setOverflow("hidden")
        this.setWebkitOverflowScrolling("regular")
        this.setMsOverflowStyle("none")
        this.setUserSelect("none")

        /*
        //this.setIsDebugging(true)
        this.setIsRegisteredForKeyboard(true)
        //this.styles().selected().setBorderLeft("1px solid rgba(0, 0, 0, 0.15)")
        //this.styles().unselected().setBorderLeft("1px solid rgba(0, 0, 0, 0.15)")
        this.applyStyles()
        //this.setIsRegisteredForClicks(true) // use tap gesture instead
        this.setAcceptsFirstResponder(true)

        this.setUserSelect("none")
        this.addGestureRecognizer(PinchGestureRecognizer.clone()) // for pinch open to add row
        this.addGestureRecognizer(TapGestureRecognizer.clone()) // for pinch open to add row

        this.setRowStyles(BMViewStyles.clone().setToWhiteOnBlack())
        //this.rowStyles().selected().setBackgroundColor("red")

        this.setIsRegisteredForBrowserDrop(true)
        */

        return this
    }

    stackView () {
        const scrollView = this.parentView()
        const navView = scrollView.parentView()
        const stackView = navView.parentView()
        return stackView
    }

    syncOrientation () {
        const d = this.stackView().direction()
        if (d === "right") {
            this.makeOrientationRight()
        } else if (d === "down") {
            this.makeOrientationDown() 
        }
        return this
    }

    makeOrientationRight () {
        this.setFlexDirection("column")
        //this.setFlexBasis("300px")
        //this.setMinAndMaxWidth("300px")
        //this.setMinAndMaxHeight(null)
    }

    makeOrientationDown () {
        this.setFlexDirection("row")
        //this.setMinAndMaxWidth(null)
        //this.setMinAndMaxHeight("50px")   
        //this.setFlexBasis("300px")
  
    }

    syncFromNode () {
        this.syncOrientation()
        super.syncFromNode()
        return this
    }

    subviewProtoForSubnode (aSubnode) {
        /*
        let proto = aSubnode.nodeRowViewClass()
		
        if (!proto) {
            proto = BrowserTitledRow
        }
				
        return proto      
        */
        return StackItemView      
    }

    
    tappedStackItemView (itemView) {
        this.subviews().forEach(sv => {
            if (sv === itemView) {
                sv.select()
            } else {
                sv.unselect()
            }
        })
    
        return false
    }
    
    
}.initThisClass()
