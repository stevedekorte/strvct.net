"use strict";

/*

    BMThemeState

    Replaces BMStyle

*/

(class BMThemeState extends BMThemeFolder {
    
    static styleNames () {
        return [
            "color", // start with ["#000", "#111", "#222", "#333", "#444", .. to #fff by X
            "backgroundColor", 
            "opacity", // 0 to 1 by 0.1

            "fontFamily",
            //"font-variant", // normal, small-caps
            //"fontStyle", // normal, italic, oblique
            "fontWeight", // normal, bold, lighter, bolder, 100-900 by 100
            "fontSize", // 3px to 50px by 1px

            "lineHeight", // 0.8em to 3em by 0.1em
            "letterSpacing", // 0.1 em to 2em by 0.1em

            "paddingLeft", // 0px to 100px by 1px
            "paddingRight", 
            "paddingTop", 
            "paddingBottom",

            // for border we need to support 
            // left, right, top, bottom
            // border-style
            // border-width
            // border-radius
            "borderLeft", // 0px to 100px by 1px 
            "borderRight", 
            "borderTop", 
            "borderBottom",
            "borderRadius"
        ];
    }

    static validColors () {
        return ["inherit", "#000", "#111", "rgb(25, 25, 25)", "#222", "#333", "#444", "#555", "#666", "#777", "#888", "#999", "#aaa", "#bbb", "#ccc", "#ddd", "#fff"]
    }

    initPrototypeSlots () {
        const styleNames = this.thisClass().styleNames()
        this.newSlot("styleNames", styleNames);
        this.newSlot("borderStyleNames", styleNames.select(name => name.beginsWith("border"))); // cached for efficiency
        this.newSlot("nonBorderStyleNames", styleNames.select(name => !name.beginsWith("border"))); // cached for efficiency
        this.newSlot("styleCacheMap", null);

        const styleSlots = []
        this.newSlot("styleSlots", styleSlots)

        {
            const slot = this.newSlot("color", "")
            //slot.setComment("style")
            slot.setLabel("color")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setValidValues(this.thisClass().validColors())
            styleSlots.push(slot)
        }

        {
            const slot = this.newSlot("backgroundColor", "")
            slot.setLabel("background color")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setValidValues(this.thisClass().validColors())
            styleSlots.push(slot)
        }

        {
            const slot = this.newSlot("opacity", "1")
            slot.setLabel("opacity")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setValidValues(["inherit", "0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"])
            styleSlots.push(slot)
        }

        {
            const slot = this.newSlot("fontFamily", "")
            slot.setLabel("font family")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            styleSlots.push(slot)
        }


        /*
        // weight and style don't work with some good fonts like
        // helvetica as it uses a different font for each,
        // so hold off on these until we have a UI to manage this stuff
        
        {
            const slot = this.newSlot("fontWeight", "")
            slot.setLabel("font weight")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setValidValues(["inherit", "normal", "bold"])
            styleSlots.push(slot)
        }

        {
            const slot = this.newSlot("fontStyle", "")
            slot.setLabel("font style")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setValidValues(["inherit", "normal", "italic", "oblique"])
            styleSlots.push(slot)
        }
        */

        {
            const slot = this.newSlot("fontSize", "")
            slot.setLabel("font size")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            const fontSizes = ["inherit"]
            for (let i = 6; i < 41; i ++) {
                fontSizes.push(i + "px")
            }
            slot.setValidValues(fontSizes)
            styleSlots.push(slot)
        }


        

        /*
        styleNames.forEach(styleName => {
            const slot = this.newSlot(styleName, "")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            //slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel(styleName)
            //slot.setInspectorPath("Key")
        })
        */
    }

    init () {
        super.init()

        this.setStyleCacheMap(null) // null is used to indicate cache needs to be built when accessed
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false) 
        
        this.setSubtitle("state")
        //this.setSubnodeClasses([BMStringField])
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
        this[key.asSetter()].apply(this, [value])
        //this.firstSubnodeWithTitle(key).setValue(value)
        return this
    }

    syncFromViewStyle () {
        return this
    }

    /*
    subnodeNames () {
        return this.styleNames() // faster
    }
    */

    // prepareForAccess
    prepareForFirstAccess () {
        if (this.subnodes().length) {
            this.subnodes().forEach(field => {
                if (field.pickSubnodesMatchingValue) {
                    field.pickSubnodesMatchingValue() 
                }
            })
        }
    }

    setupSubnodes () {
        // need to do this here because the fonts typically aren't loaded until after this prototype is initialized
        this.thisPrototype().slotNamed("fontFamily").setValidValues(BMResources.shared().fonts().allFontNames())    

        this.removeAllSubnodes()
        this.styleSlots().forEach(slot => {
            const name = slot.name()
            const field = slot.newInspectorField()
            field.setTarget(this)
            //field.setValue(this[name].apply(this))
            field.setNodeCanEditTitle(false)
            //field.getValueFromTarget()
            this.addSubnode(field)
        })
    }

    /*
    setupSubnodes () {
        const subnodeClass = this.subnodeClasses().first()
        this.subnodes() // needed? is this it trigger first access?
        this.subnodeNames().forEach(name => {
            const subnode = this.subnodeWithTitleIfAbsentInsertProto(name, subnodeClass)
            subnode.setKey(name) 
            subnode.setTarget(this)
            subnode.setValueMethod(name)
            subnode.setKeyIsEditable(false)
        })

        {
            const title = "Font Family"
            //const options = BMResources.shared().fonts().newFontOptions()
            const options = this.subnodeWithTitleIfAbsentInsertProto(title, BMOptionsNode)
            options.setNodeSubtitleIsChildrenSummary(true)
            options.setTitle(title)
            options.setNodeCanEditTitle(false)
            options.setOptionsSource(BMResources.shared().fonts())
            options.setOptionsSourceMethod("allFontNames")
            options.subnodes().forEach(option => {
                option.setNodeCanEditTitle(false)
            })
        }
    }
    */

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

        let v = null

        if (getterMethod) {
            v = getterMethod.apply(this)
            if (v === "") { 
                v = null
            }
        } else {
            const errorMsg = "missing getter method: " + this.type() + "." + name + "()"
            console.warn(errorMsg)
            //throw new Error(errorMsg)
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
                this.scheduleCacheClears()
            }
        }
        return super.didUpdateSlot(aSlot, oldValue, newValue) 
    }

    scheduleCacheClears () {
        // need to clear our sibling caches as there is inheritance between states,
        // so our change may invalidate attributes of states that inherit from us
        this.parentNode().subnodes().forEach(sn => sn.scheduleMethod("clearStyleCache"))
    }
    
    didReorderParentSubnodes () {
        this.scheduleMethod("clearStyleCache")
    }

    styleMap () {
        const map = new Map()
        const title = this.title()
        this.styleNames().forEach(name => { 
            //const v = this.getCachedStyleValueNamed(name)
            const v = this.getStyleValueNamed(name)
            map.set(title + ". " + name, v)
            // these look like: disabled.backgroundColor: "black"
        })
        return map
    }

}.initThisClass());


