"use strict";

/*

    BMViewStyles

    NOTE:::::::::::::::::::::::::::::::::::::::::::::


    This is deprecated. 

    See BMThemeState.applyToView(aView) instead


    NOTE:::::::::::::::::::::::::::::::::::::::::::::

    Represents the set of styles for a NodeView, e.g. selected, unselected.

    The basic idea is that both View and Nodes can own styles.
    Views will use their own style (or the style of some parent such as a tile using a column rowStyle),
    unless their node specifies a style, which overrides the view's own style.

    See StyledDomView and Tile to understand how Views lookup/access/change their style state.

    TODO: 
        - can we make view styles nodes? recursion?
        - should there be a inheritance ordering of styles? e.g.
            disabled <- unselected <- selected <-(inherits from)- focused


    tileStyles: 
    
    Because tiles need to be able to use the background and select colors of their columns, 
    Tile colors are looked up in:
    
        Tile.lookedUpStyles

    which asks the node, then itself, then the columns for tileStyles()
    and uses the first non-null result .

*/


(class BMViewStyles extends ProtoClass {
    
    initPrototypeSlots () {
        this.newSlot("name", "")

        this.newSlot("disabled", null)
        this.newSlot("unselected", null)
        this.newSlot("selected", null) // aka focused
        this.newSlot("active", null) // should this be called "active" or "focused"?
        //this.newSlot("error", null)
        //this.newSlot("hover", null)
        this.newSlot("isMutable", true)
    }

    init () {
        debugger;
        super.init()
        this.setDisabled(BMViewStyle.clone())
        this.setSelected(BMViewStyle.clone())
        this.setUnselected(BMViewStyle.clone())
        this.setActive(BMViewStyle.clone())
        //this.setHover(BMViewStyle.clone())
        return this
    }

    states () {
        return [this.unselected(), this.selected()]
    }

    isEmpty () {
        return this.states().detect(state => !state.isEmpty()) === null
    }

    sharedBlackOnWhiteStyle () {
        debugger;

        if (!BMViewStyles._sharedBlackOnWhiteStyle) {
            const vs = BMViewStyles.clone()
            vs.setToBlackOnWhite()
            vs.setIsMutable(false)
            vs.setName("BlackOnWhite")
            BMViewStyles._sharedBlackOnWhiteStyle = vs
        }
        return BMViewStyles._sharedBlackOnWhiteStyle
    }

    sharedWhiteOnBlackStyle () {
        debugger;

        //return this.sharedBlackOnWhiteStyle()
        if (!BMViewStyles._sharedWhiteOnBlackStyle) {
            BMViewStyles._sharedWhiteOnBlackStyle = BMViewStyles.clone().setToWhiteOnBlack().setIsMutable(false).setName("WhiteOnBlack")
        }
        return BMViewStyles._sharedWhiteOnBlackStyle
    }

    setToBlackOnWhite () {
        debugger;

        assert(this.isMutable())
        this.unselected().setColor("black")
        this.unselected().setBackgroundColor("white")
        this.unselected().setBorderBottom("1px solid #ddd") 

        this.selected().setColor("black")
        this.selected().setBackgroundColor("#eee")
        this.selected().setBorderBottom("1px solid rgba(255, 255, 255, 0.1)") // "1px solid #ddd"

        /*
        this.disabled().setColor("black")
        this.disabled().setBackgroundColor("#eee")
        this.disabled().setBorderColor("transparent")
        */

        return this
    }

    setToWhiteOnBlack () {
        //debugger;

        assert(this.isMutable())
        this.unselected().setColor("#ccc")
        this.unselected().setBackgroundColor("#191919")
        this.unselected().setBorderBottom("none") 

        this.selected().setColor("white")
        this.selected().setBackgroundColor("#333") // change for column?
        this.selected().setBorderBottom("none")

        this.active().setColor("white")
        this.active().setBackgroundColor("#444") // change for column?
        this.active().setBorderBottom("none")

        /*
        this.disabled().setColor("#aaa")
        this.disabled().setBackgroundColor("black")
        this.disabled().setBorderColor("transparent")
        */
        return this
    }
    
    /*
    setToGrayOnTransparent () {        
        assert(this.isMutable())
        this.unselected().setColor("#aaa")
        this.unselected().setBackgroundColor("transparent")
        
        this.selected().setColor("white")
        this.selected().setBackgroundColor("transparent")        
        return this
    }
    */
    
    copyFrom (styles, copyDict) {
        debugger;
        assert(this.isMutable())
        this.selected().copyFrom(styles.selected(), copyDict)
        this.unselected().copyFrom(styles.unselected(), copyDict)
        return this
    }
    
    setBackgroundColor (c) {
        debugger;
        this.selected().setBackgroundColor(c)
        this.unselected().setBackgroundColor(c)
        return this        
    }
    
    setColor (c) {
        debugger;
        this.selected().setColor(c)
        this.unselected().setColor(c)
        return this        
    }
    
}.initThisClass());
