"use strict";

/*
    
    BMImageTile
    
*/

(class BMImageTile extends TitledTile {
    
    initPrototypeSlots () {
    }

    initPrototype () {
    }
    
    updateSubviews () {
        super.updateSubviews()
	
        const node = this.node()

        if (node) {
            const name = node.title()
            this.titleView() //.setFontFamily(name)
        }

        return this
    }

    
}.initThisClass());
