"use strict";

/*

    BMThemeState

    Replaces BMStyle

*/

(class BMThemeState extends BMStorableNode {
    
    initPrototypeSlots () {

        const styleNames = [
            "color", 
            "backgroundColor", 
            "opacity", 

            "fontFamily",
            "fontWeight",
            "fontSize",
            "lineHeight",
            "letterSpacing",

            "paddingLeft", 
            "paddingRight", 
            "paddingTop", 
            "paddingBottom",

            "borderLeft", 
            "borderRight", 
            "borderTop", 
            "borderBottom",
            "borderRadius"
        ];

        this.newSlot("styleNames", styleNames);
        this.newSlot("borderStyleNames", styleNames.select(name => name.beginsWith("border"))); // cached for efficiency
        this.newSlot("nonBorderStyleNames", styleNames.select(name => !name.beginsWith("border"))); // cached for efficiency
        this.newSlot("styleCacheMap", null);

        /*
        {
            const slot = this.newSlot("color", "")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setLabel("color")
        }
        */

        styleNames.forEach(styleName => {
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

        this.setStyleCacheMap(null) // null is used to indicate cache needs to be built when accessed
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        //this.setSubtitle("ThemeState")
        this.setSubnodeClasses([BMStringField])
        //this.setupSubnodes()

        //this._didChangeThemeNote = this.newNoteNamed("didChangeTheme")
    }

    /*
    scheduleDidInit () {
        console.log(this.debugTypeId() + " scheduleDidInit")
        //debugger;
        super.scheduleDidInit()
    }
    */

    didInit () {
        if (this.hasDoneInit()) {
            // hack to skip if already called from ThemeClass setupAsDefault 
            console.log(this.typeId() + " didInit - already called so skipping")
            return
        }
        //debugger;
        assert(!this.hasDoneInit())
        //console.log(this.typeId() + " didInit setupSubnodes: ", this.subnodes().map(sn => sn.typeId()))
        super.didInit()
        this.setupSubnodes()
    }

    /*
    setupInspectorFromSlots() {
        this.thisPrototype().forEachSlot(slot => {
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
        return this.styleNames()
    }

    setupSubnodes () {
        const subnodeClass = this.subnodeClasses().first()
        this.subnodes() // needed? is this it trigger first access?
        this.subnodeNames().forEach(name => {
            const subnode = this.subnodeWithTitleIfAbsentInsertProto(name, subnodeClass)
            subnode.setKey(name) 
            subnode.setTarget(this)
            subnode.setValueMethod(name)
        })
    }

    // --- style cache ---

    clearStyleCache () {
        this.setStyleCacheMap(null)
        console.log(" clearStyleCache")
        return this
    }

    getCachedStyleValueNamed (name) {
        return this.getStyleCacheMap().at(name)
    }

    getStyleCacheMap () {
        if (!this.styleCacheMap()) {
            this.setStyleCacheMap(this.computeStyleCacheMap())
        }
        return this.styleCacheMap()
    }

    computeStyleCacheMap () {
        const map = new Map()
        this.styleNames().forEach(name => { 
            const v = this.getStyleValueNamed(name)
            map.set(name, v)
        })
        return map
    }

    // --- applying styles ---

    themeClass () {
        return this.parentNode()
    }

    parentThemeState () {
        return this.themeClass().subnodeBefore(this)
    }


    getStyleValueNamed (name) {
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

        if (v == null) {
            const parent = this.parentThemeState()
            if (parent) {
                return parent.getStyleValueNamed(name)
            }
        }
        
        return v
    }

    // --- apply styles ---

    applyStyleNamesToView (styleNames, aView) {
        const lockedSet = aView.lockedStyleAttributeSet ? aView.lockedStyleAttributeSet() : null;
        
        styleNames.forEach(name => { 
            const isLocked = lockedSet ? lockedSet.has(name) : false;
            if (!isLocked) {
                const v = this.getCachedStyleValueNamed(name)
                //if (aView.type() === "HeaderTile" && name === "fontSize") {
                    //console.log( aView.type() + " style " + name + " set to " + v)
                //}
                aView.performIfResponding(aView.setterNameForSlot(name), v)
            } else {
                console.log("style " + name + " locked on view " + aView.type())
            }
        })
        return this
    }

    applyToView (aView) {
        this.applyStyleNamesToView(this.styleNames(), aView)
        return this
    }

    // --- apply style subsets ---

    applyNonBorderStylesToView (aView) {
        this.applyStyleNamesToView(this.nonBorderStyleNames(), aView)
        return this
    }

    applyBorderStylesToView (aView) {
        this.applyStyleNamesToView(this.borderStyleNames(), aView)
        return this
    }

    // --- changes ---
    
    onDidEdit () {
        console.log(this.typeId() + " onDidEdit")
        this.setStyleCacheMap(null)
        debugger;
        return false
    }

    didUpdateSlot (aSlot, oldValue, newValue) {
        if (this.hasDoneInit()) {
            if (aSlot.name() !== "styleCacheMap") { // hack
                DocumentBody.shared().resyncAllViews() // this will apply any new styles
                //this.scheduleMethod("clearStyleCache") 
                this.scheduleCacheClears()
            }
        }
        return super.didUpdateSlot(aSlot, oldValue, newValue) 
    }

    scheduleCacheClears () {
        this.parentNode().subnodes().forEach(sn => sn.scheduleMethod("clearStyleCache"))
    }
    
    didReorderParentSubnodes () {
        this.scheduleMethod("clearStyleCache")
    }

}.initThisClass());


