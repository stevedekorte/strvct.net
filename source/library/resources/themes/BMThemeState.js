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
            "letterSpacing" // 0.1 em to 2em by 0.1em

            /*
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
            */
        ];
    }

    static validLetterSpacingValues () {
        const values = []
        for (let i = 0; i < 0.51; i += 0.01) {
            const s = (i + "").slice(0, 4)
            values.push(s + "em")
        }
        return values
    }

    static validLineHeightValues () {
        const values = []
        for (let i = 1; i < 3; i += 0.1) {
            const s = (i + "").slice(0, 3)
            values.push(s + "em")
        }
        return values
    }

    static validColors () {
        return ["#000", "#111", "rgb(25, 25, 25)", "#222", "#333", "#444", "#555", "#666", "#777", "#888", "#999", "#aaa", "#bbb", "#ccc", "#ddd", "#fff"]
    }

    static validPaddingValues () {
        const values = []
        for (let i = 0; i < 41; i ++) {
            values.push(i + "px")
        }
        return values
    }

    static validBorderWidthValues () {
        const values = []
        for (let i = 0; i < 10; i ++) {
            values.push(i + "px")
        }
        return values
    }

    static validBorderStyleValues () {
    return ["none", "dotted", "dashed", "solid", /*"groove", "inset"*/]
    }

    static validFontSizes () {
        const values = []
        for (let i = 6; i < 41; i ++) {
            values.push(i + "px")
        }
        return values
    }

    initPrototypeSlots () {
        const styleSlots = []
        this.newSlot("styleSlots", styleSlots)

        // -----------------

        const addSlot = (name, path, label, values) => {
            const slot = this.newSlot(name, "")
            slot.setInspectorPath(path)
            slot.setLabel(label)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")
            slot.setValidValues(values)
            styleSlots.push(slot)
        }

        // --- colors ---

        addSlot("color", "colors", "color", this.thisClass().validColors())
        addSlot("backgroundColor", "colors", "background", this.thisClass().validColors())
        addSlot("opacity", "colors", "opacity", ["inherit", "0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"])

        // --- font ---

        addSlot("fontFamily", "font", "family", null)
        addSlot("fontSize", "font", "size", this.thisClass().validFontSizes())

        // weight and style don't work with some good fonts like
        // helvetica as it uses a different font for each,
        // so hold off on these until we have a UI to manage this stuff
        //addSlot("fontWeight", "font", "weight", ["inherit", "normal", "bold"])
        //addSlot("fontStyle", "font", "style", ["inherit", "normal", "italic", "oblique"])

        addSlot("letterSpacing", "font", "letter spacing", this.thisClass().validLetterSpacingValues())
        addSlot("lineHeight", "font", "line height", this.thisClass().validLineHeightValues())


        // --- padding ---

        {
            const paddings = this.thisClass().validPaddingValues()
            addSlot("paddingLeft", "padding", "left", paddings)
            addSlot("paddingRight", "padding", "right", paddings)
            addSlot("paddingTop", "padding", "top", paddings)
            addSlot("paddingBottom", "padding", "bottom", paddings)
        }

        // --- border ---
        
        {
            const styles = this.thisClass().validBorderStyleValues()
            addSlot("borderLeftStyle", "border/left", "style", styles)
            addSlot("borderRightStyle", "border/right", "style", styles)
            addSlot("borderTopStyle", "border/top", "style", styles)
            addSlot("borderBottomStyle", "border/bottom", "style", styles)

            const widths = this.thisClass().validBorderWidthValues()
            addSlot("borderLeftWidth", "border/left", "width", widths)
            addSlot("borderRightWidth", "border/right", "width", widths)
            addSlot("borderTopWidth", "border/top", "width", widths)
            addSlot("borderBottomWidth", "border/bottom", "width", widths)

            const colors = this.thisClass().validColors()
            addSlot("borderLeftColor", "border/left", "color", colors)
            addSlot("borderRightColor", "border/right", "color", colors)
            addSlot("borderTopColor", "border/top", "color", colors)
            addSlot("borderBottomColor", "border/bottom", "color", colors)

            const radii = this.thisClass().validBorderWidthValues()
            addSlot("borderLeftRadius", "border/left", "radius", radii)
            addSlot("borderRightRadius", "border/right", "radius", radii)
            addSlot("borderTopRadius", "border/top", "radius", radii)
            addSlot("borderBottomRadius", "border/bottom", "radius", radii)
        }

        // ---------------------

        this.newSlot("borderStyleSlots", styleSlots.select(slot => slot.name().beginsWith("border"))); // cached for efficiency
        this.newSlot("nonBorderStyleSlots", styleSlots.select(slot => !slot.name().beginsWith("border"))); // cached for efficiency
        this.newSlot("styleCacheMap", null);
    }

    init () {
        super.init()
        this.setStyleCacheMap(null) // null is used to indicate cache needs to be built when accessed
        this.setShouldStore(true)
      //  debugger;
        this.setShouldStoreSubnodes(false) 

        let slot = this.thisPrototype().slotNamed("subnodes")
        if (slot.shouldStoreSlotOnInstance(this)) {
            debugger;
            let b = slot.shouldStoreSlotOnInstance(this)
            assert(!b)
        }
        this.removeAction("add")
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

    setThemeAttribute (key, value) {
        this[key.asSetter()].apply(this, [value])
        //this.firstSubnodeWithTitle(key).setValue(value)
        return this
    }

    syncFromViewStyle () {
        return this
    }

    // prepareForAccess
    prepareForFirstAccess () {
        const fields = this.getFields()
        if (fields.length) {
            fields.forEach(field => {
                if (field.pickSubnodesMatchingValue) {
                    field.pickSubnodesMatchingValue() 
                }
            })
        }
    }

    getFields () {
        return this.selectSubnodesRecursively(sn => {
            return sn.thisClass().isKindOf(BMField)
        })
    }

    setupSubnodes () {
        this.removeAllSubnodes()

        // need this because the fonts typically aren't loaded until after this prototype is initialized
        this.thisPrototype().slotNamed("fontFamily").setValidValuesClosure(() => { 
            //debugger;
            return BMResources.shared().fonts().allFontNames() 
        })   

        this.styleSlots().forEach(slot => {
            const name = slot.name()

            const field = slot.newInspectorField()
            field.setShouldStore(false)
            field.setShouldStoreSubnodes(false) 

            field.setTarget(this)
            field.setNodeCanEditTitle(false)
            field.setNodeCanReorderSubnodes(false)
            field.setSummaryFormat("key value")
            field.setHasNewlineAferSummary(true)
            field.removeAction("add")
            field.setCanDelete(false)

            //debugger
            const pathNodes = this.createNodePath(slot.inspectorPath())
            pathNodes.forEach(node => {
                if (node !== this) {
                    node.setNodeSubtitleIsChildrenSummary(true)
                    node.setHasNewlineAferSummary(true)
                    if (node !== pathNodes.last()) {
                        node.setHasNewLineSeparator(true)
                    }
                }
            })

            /*
            const node = pathNodes.last()
            if (node !== this) {
                node.setNodeSubtitleIsChildrenSummary(true)
            }
            */

            pathNodes.last().addSubnode(field)
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
        this.styleSlots().forEach(slot => { 
            const name = slot.name()
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
            if (v === "" || v === "inherit") { 
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

    applyStyleSlotsToView (styleSlots, aView) {
        const lockedSet = aView.lockedStyleAttributeSet ? aView.lockedStyleAttributeSet() : null;
        //console.log("applyStyleSlotsToView ", aView.debugTypeId())
        styleSlots.forEach(slot => { 
            const name = slot.name()
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
        this.applyStyleSlotsToView(this.styleSlots(), aView)
        return this
    }

    // --- apply style subsets ---

    applyNonBorderStylesToView (aView) {
        this.applyStyleSlotsToView(this.nonBorderStyleSlots(), aView)
        return this
    }

    applyBorderStylesToView (aView) {
        this.applyStyleSlotsToView(this.borderStyleSlots(), aView)
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
        this.styleSlots().forEach(slot => { 
            const name = slot.name()
            //const v = this.getCachedStyleValueNamed(name)
            const v = this.getStyleValueNamed(name)
            map.set(title + ". " + name, v)
            // these look like: disabled.backgroundColor: "black"
        })
        return map
    }

}.initThisClass());


