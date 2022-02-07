"use strict";

/*
    
    BMFontRowView
    
*/

(class BMFontRowView extends BrowserTitledRow {
    
    initPrototype () {

    }

    init () {
        super.init()
        return this
    }
    
    updateSubviews () {
        super.updateSubviews()
	
        const node = this.node()

        if (node) {
            const name = node.name()
            this.titleView().setFontFamily(name)
        }

        return this
    }

    
}.initThisClass());
