"use strict";

/*

    BMThemeState

    Replaces BMStyle

*/

(class BMThemeState extends BMStorableNode {
    
    static standardStateNames () {
        return [
            "unselected", 
            "selected", 
            //"active", 
            //"disabled"
        ]
    }

    static styleNames () {
        return  [
            "color", 
            "backgroundColor", 
            "opacity", 

            "fontFamily",
            "fontWeight",
            "fontSize",
            "lineHeight",
            "letterSpacing",

            "borderLeft", 
            "borderRight", 
            "borderTop", 
            "borderBottom",

            "borderWidth", 
            "borderColor", 
            "borderRadius",
        ]
    }

    initPrototype () {
        /*
        {
            const slot = this.newSlot("color", "")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setLabel("color")
        }
        */

        this.thisClass().styleNames().forEach(styleName => {
            const slot = this.newSlot(styleName, "")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            //slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel(styleName)
            //slot.setInspectorPath("Key")
        })
    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        //this.setSubtitle("ThemeState")
        this.setNodeMinWidth(200)
        this.setSubnodeClasses([BMStringField])
        //this.setupSubnodes()

        //this._didChangeThemeNote = BMNotificationCenter.shared().newNote().setSender(this).setName("didChangeTheme")
    }

    didInit () {
        if (this.hasDoneInit()) {
            return
        }

        //console.log(this.typeId() + " subnodes: ", this.subnodes())
        super.didInit()
        this.setupSubnodes()
    }

    /*
        setupInspectorFromSlots() {
        const slots = this.thisPrototype().allSlots()
        slots.ownForEachKV((name, slot) => {
            const field = slot.newInspectorField()
            if (field) {
                field.setTarget(this)
                let node = this.nodeInspector().createNodePath(slot.inspectorPath())
                node.addSubnode(field)
            }
        })
        return this
    }    
    */

    setThemeAttribute (key, value) {
        this.firstSubnodeWithTitle(key).setValue(value)
        return this
    }

    syncFromViewStyle () {
  
        return this
    }

    subnodeNames () {
        return this.thisClass().styleNames()
    }

    setupSubnodes () {
        const subnodeClass = this.subnodeClasses().first()
        this.subnodes()
        this.subnodeNames().forEach(name => {
            const subnode = this.subnodeWithTitleIfAbsentInsertProto(name, subnodeClass)
            subnode.setKey(name) //.setValue("")
            subnode.setTarget(this)
            subnode.setValueMethod(name)
        })
    }

    styleNames () {
        return this.thisClass().styleNames()
    }

    applyToView (aView) {		
        this.styleNames().forEach( (name) => { 
            const getterMethod = this[name]
            if (!getterMethod) {
                const errorMsg = "missing getter method: " + this.type() + "." + name + "()"
                console.warn(errorMsg)
                throw new Error(errorMsg)
            }
            let v = getterMethod.apply(this)
            if (v === "") { 
                v = null
            }
            //try {
                if (v !== null) {
                    const isLocked = aView.lockedStyleAttributeSet().has(name)
                    //console.log("apply style to " + aView.type())
                    if (aView.type() === "BrowserRowTitle") {
                        //console.log("ready")
                    }
                    if (!isLocked) {
                        aView.performIfResponding(aView.setterNameForSlot(name), v)
                    }
                    //const setter = aView[aView.setterNameForSlot(name)]
                    //aView[aView.setterNameForSlot(name)].apply(aView, [v])
                }
                /*
            } catch (e) {
                console.warn("error appling style '" + name + "' " + e.message)
            }
            */
        })
		
        return this
    }
    
    onDidEdit () {
        console.log(this.typeId() + " onDidEdit")
        return false
    }

    didUpdateSlot (aSlot, oldValue, newValue) {
        if (this.hasDoneInit()) {
            DocumentBody.shared().resyncAllViews()
        }
        return super.didUpdateSlot(aSlot, oldValue, newValue) 
    }
    
}.initThisClass());


