"use strict"

/*

    BMThemeAttribute

*/

window.BMThemeAttribute = class BMThemeAttribute extends BMStringField {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setShouldStore(true)
        //this.setShouldStoreSubnodes(true)
        this.setNodeMinWidth(200)
        this.setKey("Untitled " + this.thisClass().visibleClassName())
    }

}.initThisClass()

/* 
notes on Scroll bars theme options
::-webkit-scrollbar { width: 10px; } 
::-webkit-scrollbar-track { background: #666; } 
::-webkit-scrollbar-thumb { background-color: #f1f1f1; outline: 1px solid slategrey; } 
::-webkit-scrollbar-thumb:hover { background: #b1b1b1; }
*/
