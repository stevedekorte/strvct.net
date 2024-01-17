"use strict";

/*
    
    BMFontTile
    
*/

(class BMFontTile extends TitledTile {
    
    initPrototypeSlots () {

    }

    init () {
        super.init();
        return this;
    }
    
    updateSubviews () {
        super.updateSubviews();
	
        const node = this.node();

        if (node) {
            this.titleView().setFontFamily(node.fontFamilyName());
            this.titleView().setFontStyle(node.fontStyle());
            this.titleView().setFontWeight(node.fontWeight());
            this.titleView().setFontStretch(node.fontStretch());
        }

        return this;
    }
    
}.initThisClass());
