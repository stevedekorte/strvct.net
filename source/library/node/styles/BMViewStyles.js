"use strict";

/*

    BMViewStyles

    Represents the set of styles for a NodeView, e.g. selected, unselected.

    The basic idea is that both View and Nodes can own styles.
    Views will use their own style (or the style of some parent such as a tile using a column rowStyle),
    unless their node specifies a style, which overrides the view's own style.

    See StyledDomView and Tile to understand how Views lookup/access/change their style state.

    TODO: can we make view styles nodes? recursion?

    tileStyles: 
    
    Because tiles need to be able to use the background and select colors of their columns,

    Tile colors are looked up in:
    Tile.lookedUpStyles

        which asks the node, then itself, then the columns for tileStyles()
        and uses the first non-null result .

 
*/


(class BMViewStyles extends ProtoClass {
    
    initPrototype () {
        this.newSlot("name", "")
        this.newSlot("unselected", null)
        this.newSlot("selected", null) // aka focused
        this.newSlot("disabled", null)
        //hover: null, 
        //enabled: null,
        //error: null,
        this.newSlot("isMutable", true)
    }

    init () {
        super.init()
        this.setSelected(BMViewStyle.clone())
        this.setUnselected(BMViewStyle.clone())
        this.setDisabled(BMViewStyle.clone())
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
        //return this.sharedBlackOnWhiteStyle()
        if (!BMViewStyles._sharedWhiteOnBlackStyle) {
            BMViewStyles._sharedWhiteOnBlackStyle = BMViewStyles.clone().setToWhiteOnBlack().setIsMutable(false).setName("WhiteOnBlack")
        }
        return BMViewStyles._sharedWhiteOnBlackStyle
    }

    setToBlackOnWhite () {
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
        assert(this.isMutable())
        this.unselected().setColor("#ccc")
        this.unselected().setBackgroundColor("#191919")
        this.unselected().setBorderBottom("none") 

        this.selected().setColor("white")
        this.selected().setBackgroundColor("#333") // change for column?
        this.selected().setBorderBottom("none")

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
        assert(this.isMutable())
        this.selected().copyFrom(styles.selected(), copyDict)
        this.unselected().copyFrom(styles.unselected(), copyDict)
        return this
    }
    
    setBackgroundColor (c) {
        this.selected().setBackgroundColor(c)
        this.unselected().setBackgroundColor(c)
        return this        
    }
    
    setColor (c) {
        this.selected().setColor(c)
        this.unselected().setColor(c)
        return this        
    }
    
}.initThisClass());
