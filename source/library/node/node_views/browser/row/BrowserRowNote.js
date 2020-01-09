"use strict"

/*
    
    BrowserRowNote
    
*/

window.BrowserRowNote = class BrowserRowNote extends TextField {
    
    initPrototype () {
        this.newSlot("noteIconName", null)
    }

    init () {
        super.init()
        return this
    } 


    noteIconName () {
        if (this.node().note() === "&gt;") {
            return "right-gray"
        }
        return null
    }

    didUpdateSlotNoteIconName () {
        const nv = this.noteView()
        const name = this.noteIconName()

        if (name) {
            nv.setMinAndMaxWidth(10)
            nv.setMinAndMaxHeight(10)

            const icon = this.noteSvgIconForName(name)
            nv.setInnerHTML("")
            nv.removeAllSubviews()
            nv.addSubview(icon)
        } else {
            nv.removeAllSubviews()
        }
    }

    noteSvgIconForName (aName) {
        const icon = SvgIconView.clone().setIconName(aName)
        icon.setMinAndMaxWidthAndHeight(10)
        icon.setFillColor("white")
        icon.setStrokeColor("white")
        icon.setOpacity(0.5)
        return icon
    }
    
}.initThisClass()
