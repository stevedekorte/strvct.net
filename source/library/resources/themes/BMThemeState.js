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
        const values = ["inherit"]
        for (let i = 0; i < 0.51; i += 0.01) {
            const s = (i + "").slice(0, 4)
            values.push(s + "em")
        }
        return values
    }

    static validLineHeightValues () {
        const values = ["inherit"]
        for (let i = 1; i < 3; i += 0.1) {
            const s = (i + "").slice(0, 3)
            values.push(s + "em")
        }
        return values
    }

    static validColors () {
        return ["inherit", "", "transparent", "white", "black", "#000", "#111", "rgb(25, 25, 25)", "#222", "#333", "#444", "#555", "#666", "#777", "#888", "#999", "#aaa", "#bbb", "#ccc", "#ddd", "#fff"]
    }

    static validPaddingValues () {
        const values = ["inherit"]
        for (let i = 0; i < 41; i ++) {
            values.push(i + "px")
        }
        return values
    }

    static validBorderWidthValues () {
        const values = ["inherit"]
        for (let i = 0; i < 10; i ++) {
            values.push(i + "px")
        }
        return values
    }

    static validBorderStyleValues () {
        return ["inherit", "none", "dotted", "dashed", "solid", /*"groove", "inset"*/]
    }

    static validFontSizes () {
        const values = ["inherit"]
        for (let i = 6; i < 80; i ++) {
            values.push(i + "px")
        }
        return values
    }

    initPrototypeSlots () {
        const styleSlots = [];

        {
            const slot = this.newSlot("styleSlots", styleSlots);
            slot.setSlotType("Array");
        }

        // -----------------

        const addSlot = (name, path, label, values) => {
            const slot = this.newSlot(name, "")
            slot.setInspectorPath(path)
            slot.setLabel(label)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("duplicate")
            slot.setSlotType("String")

            //slot.setValidValues(values)
            
            if (values) {
                const initValue = values.first();
                //console.log("BMThemeState setting " + JSON.stringify([name, path, label]) + " to initValue '" + initValue + "'");
                slot.setInitValue(initValue) // first value is typically "inherit"
                slot.setValidValues(values)
            }
            
            styleSlots.push(slot)
        }

        // --- colors ---

        addSlot("color", "colors", "color", this.thisClass().validColors())
        addSlot("backgroundColor", "colors", "background", this.thisClass().validColors())
        addSlot("opacity", "colors", "opacity", ["inherit", "0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0", ""])

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

        // --- margin ---

        {
            const margins = this.thisClass().validPaddingValues()
            addSlot("marginLeft", "margin", "left", margins)
            addSlot("marginRight", "margin", "right", margins)
            addSlot("marginTop", "margin", "top", margins)
            addSlot("marginBottom", "margin", "bottom", margins)
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

        /*
            We want to apply:
            - border and margin to Tile
            - padding and others to TileContentView
        */

        //this.newSlot("paddingStyleSlots", styleSlots.select(slot => slot.name().beginsWith("padding"))); // cached for efficiency
        {
            const slot = this.newSlot("borderStyleSlots", styleSlots.select(slot => slot.name().beginsWith("border") || slot.name().beginsWith("margin"))); // cached for efficiency
            slot.setSlotType("Array");
        }

        {
            const slot = this.newSlot("nonBorderStyleSlots", styleSlots.select(slot => !(slot.name().beginsWith("border") || slot.name().beginsWith("margin")))); // cached for efficiency
            slot.setSlotType("Array");
        }
        
        {
            const slot = this.newSlot("styleCacheMap", null);
            slot.setSlotType("Map");
        }
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
        this.setNodeCanAddSubnode(false)
        this.setSubtitle("state")

        //this.setSubnodeClasses([BMStringField])
        //this._didChangeThemeNote = this.newNoteNamed("didChangeTheme")
    }

    finalInit () {
        super.finalInit();
        if (!this.hasSubnodes()) {
            this.setupSubnodes()
        }
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
                if (field.pickLeafSubnodesMatchingValue) {
                    field.pickLeafSubnodesMatchingValue() 
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
        this.thisPrototype().slotNamed("fontFamily").setValidValuesClosure((instance) => { 
            //debugger;
            return BMResources.shared().fonts().allFontNames() 
        })

        this.addSubnodeFieldsForSlots(this.styleSlots())
    }

    // --- style cache ---

    clearStyleCache () {
        this.setStyleCacheMap(null)
        //console.log("clearStyleCache")
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
        return this.themeStates().parentNode()
    }

    parentThemeClass () {
        return this.themeClass().parentThemeClass()
    }

    themeStates () {
        return this.parentNode()
    }

    parentThemeState () {
        return this.themeStates().subnodeBefore(this)
    }

    /*
       See notes at top of this file for explaination of lookup order.
    */
    
    getStyleValueNamed (name, depth = 1) {
        assert(depth < 20)

        const getterMethod = this[name]

        /*
            const themeClassName = this.themeClass().title()
            const stateName = this.title()
            const spacer = "-".repeat(depth)
            console.log(" " + spacer + " " + themeClassName + "/" + stateName + ".getStyleValueNamed('" + name + "')")
            //debugger
        */
        
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

        // lookup in ThemeClass's parent
        if (v === null) {
            const parent = this.parentThemeClass() // parent theme class eg: Default -(child)-> Tile -(child)-> TextTile
            assert(parent !== this.themeClass())
            if (parent) {
                const stateName = this.title()
                const state = parent.stateWithName(stateName)
                v = state.getStyleValueNamed(name, depth+1) // will recurse through themeClass parents
            }
        }

        // lookup in ThemeState's parent
        if (v === null) {
            const parent = this.parentThemeState()// parent theme state eg: active -(child)-> selected -(child)-> unselected
            assert(parent !== this)
            if (parent) {
                v = parent.getStyleValueNamed(name, depth+1) // will recurse through themeStates and each state will recurse themeClass parents
            }
        }

        if (v) {
            //console.log("found: '" + v + "'")
        }

        return v
    }

    // --- apply style  ---

    applyToView (aView) {
        this.applyStyleSlotsToView(this.styleSlots(), aView)
        return this
    }

    applyNonBorderStylesToView (aView) {
        //debugger
        this.applyStyleSlotsToView(this.nonBorderStyleSlots(), aView)
        return this
    }

    applyBorderStylesToView (aView) {
        this.applyStyleSlotsToView(this.borderStyleSlots(), aView)
        return this
    }

    // --- apply styles slots ---

    applyStyleSlotsToView (styleSlots, aView) {
        const lockedSet = aView.lockedStyleAttributeSet ? aView.lockedStyleAttributeSet() : null;
        //console.log("applyStyleSlotsToView ", aView.debugTypeId())
        styleSlots.forEach(slot => { 
            const name = slot.name()
            const isLocked = lockedSet ? lockedSet.has(name) : false;
            if (!isLocked) {
                const v = this.getCachedStyleValueNamed(name)
                /*
                if (v) {
                    const themeClassName = this.themeClass().title()
                    const stateName = this.title()
                    console.log(themeClassName + " / " + stateName + " '" + v + "' -> " + aView.type())// + "/" + aView.node())
                }
                */
                aView.performIfResponding(aView.setterNameForSlot(name), v)
            } else {
                console.log("style " + name + " locked on view " + aView.type())
            }
        })
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

    // --- helpers ---

    attributeNamed (name) {
        return this.firstSubnodeWithTitle(name)
    }

    // --- defaults ----

    setupAsDefault () {
        const title = this.title()
        const methodName = "setupAsDefault" + this.title().capitalized() + "State"
        this[methodName].call(this)
        return this
    }

    setupAsDefaultActiveState () {
        //this.setColor("white")
        //this.setBackgroundColor("#333")
        this.setThemeAttribute("color", "white");
        this.setThemeAttribute("backgroundColor", "#333");
        //this.setThemeAttribute("fontWeight", "normal");
      }
    
      setupAsDefaultUnselectedState () {
        this.setThemeAttribute("color", "#bbb");
        this.setThemeAttribute("backgroundColor", "transparent");
        //this.setThemeAttribute("fontWeight", "normal");
      }
    
      setupAsDefaultSelectedState () {
        this.setThemeAttribute("color", "white");
        this.setThemeAttribute("backgroundColor", "#222");
        //this.setThemeAttribute("fontWeight", "normal");
      }
    
      setupAsDefaultDisabledState () {
        this.setThemeAttribute("color", "#ccc");
        //this.setThemeAttribute("backgroundColor", "transparent");
        //this.setThemeAttribute("fontWeight", "normal");

        this.setThemeAttribute("paddingLeft", "22px");
        this.setThemeAttribute("paddingRight", "22px");
        this.setThemeAttribute("paddingTop", "8px");
        this.setThemeAttribute("paddingBottom", "8px");
      }

}.initThisClass());


