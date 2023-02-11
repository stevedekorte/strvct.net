"use strict";

/*

    BMTheme

*/

(class BMTheme extends BMStorableNode {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        //this.setSubtitle("Theme")
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeLevel])
        this.setNodeCanReorderSubnodes(true)
        //this.setupSubnodes()
    }

    /*
    didLoadFromStore () {
        super.didLoadFromStore()
        this.setupSubnodes()
    }

    setupSubnodes () {
        const nodeViewClasses = DomView.descendantClasses()

        nodeViewClasses = nodeViewClasses.select((nodeViewClass) => {
            return nodeViewClass.hasOwnProperty("styles")
        }).select((nodeViewClass) => { return !nodeViewClass.styles().isEmpty() })

        //console.log("nodeViewClasses:", nodeViewClasses)
        const themeClasses = nodeViewClasses.map((childProto) => {
            return BMThemeFolder.clone().setTitle(childProto.type());
        })

        this.copySubnodes(themeClasses);
        return this
    }
    */

   atPath (aPath) {
       debugger;
   }

    setupAsDefault () {
        this.setTitle("DefaultTheme")
        const defaultThemeClass = BMThemeClass.clone().setupAsDefault()
        this.addSubnode(defaultThemeClass)
        return this
   }

}.initThisClass());
