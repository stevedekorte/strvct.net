"use strict"

/*

    BMThemeState

    Replaces BMStyle

*/

window.BMThemeState = class BMThemeState extends BMStorableNode {
    
    static standardStateNames () {
        return [
            "unselected", 
            "selected", 
            "active", 
            "disabled"
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
    }

    didInit () {
        //console.log(this.typeId() + " subnodes: ", this.subnodes())
        this.setupSubnodes()
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
            try {
                if (v !== null) {
                    aView.performIfResponding(aView.setterNameForSlot(name), v)
                    //const setter = aView[aView.setterNameForSlot(name)]
                    //aView[aView.setterNameForSlot(name)].apply(aView, [v])
                }
            } catch (e) {
                console.warn("error appling style '" + name + "' " + e.message)
            }
        })
		
        return this
    }
    
}.initThisClass()


