"use strict";

/*

    BMImageResources

*/

(class BMImageResources extends BMResourceGroup {
    
    init () {
        super.init();
        this.setTitle("Images");
        this.setSubnodeClasses([BMURLImage]);
        return this
    }

    setup () {
        super.setup();
        this.setResourceClasses([BMURLImage]);
        this.setSubnodeClasses([BMURLImage]);
        return this;
    }

}.initThisClass());
