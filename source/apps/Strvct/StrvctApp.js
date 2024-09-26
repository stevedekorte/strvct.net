"use strict";

/**
 * @module apps.STRVCT.StrvctApp
 * @class StrvctApp
 * @extends App
 * @description The main application class for Strvct.
 */

(class StrvctApp extends App {

    /**
     * @static
     * @description Returns the root node prototype.
     * @returns {Node} The root node prototype.
     */
    static rootNodeProto () {
        return RootContentNode
    }

    /**
     * @description Initializes the prototype slots.
     * @returns {StrvctApp} The updated StrvctApp.
     */
    initPrototypeSlots () {

        /*
        // for now, we won't store this object in order to avoid some
        // chicken and egg problems
        {
            const slot = this.newSlot("rootContentNode", null)
            slot.setShouldStoreSlot(false)
            slot.setCanInspect(true)
        }
        */

        /**
         * @member {BrowserView} browser
         * @description The browser view.
         */
        {
            // view
            const slot = this.newSlot("browser", null);
            slot.setSlotType("BrowserView");
        }
    }
  
    /**
     * @description Initializes the prototype.
     * @returns {StrvctApp} The updated StrvctApp.
     */
    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        //this.setNodeCanAddSubnode(true)
    }


    /**
     * @description Initializes the instance.
     * @returns {StrvctApp} The updated StrvctApp.
     */
    init () {
        super.init()
        this.setName("StrvctApp");
        this.setVersion([0, 0, 0, 0]);
        this.setNodeCanReorderSubnodes(true);
        return this
    }

    /**
     * @description Sets up the UI.
     * @returns {Promise<void>} The promise.
     */
    async setupUi () {
        await super.setupUi();
        await this.setupModel();
        BMResources.shared(); // load resources
        
        const browser = BrowserView.clone();
        this.rootNode().setTitle("root node");
        browser.setNode(this.rootNode());
        browser.syncFromNode();

        this.setBrowser(browser);
        this.documentBodyView().addSubview(browser);

        //this.addTimeout( () => this.showClasses(), 1)
    }

    /**
     * @description Shows the classes.
     * @returns {void}
     */
    showClasses () {
        debugger;
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    // --- setup model ---

    /*
    async setupModel () {
        await this.setupModel()
        // settings
        //const settings = this.rootNode().subnodeWithTitleIfAbsentInsertProto("Settings", BMSettingsNode)
        //this.setSettings(settings)
        return this
    }
    */

    // --- setup views ---

    // themes - temporary, until ThemesResources is ready

    /**
     * @description Sets up the document theme.
     * @returns {void}
     */
    setupDocTheme () {
        const doc = DocumentBody.shared()
        doc.setHeight("100%") // trying to fix body not fitting window
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")
        this.setupNormalDocTheme()
        //this.setupVectorTheme()
        //this.setupBlenderProTheme()
    }

    /**
     * @description Sets up the normal document theme.
     * @returns {void}
     */
    setupNormalDocTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        //doc.setFontFamily("Sans-Serif")
        //doc.setFontFamily("Electrolize-Regular")
        doc.setFontFamily("Helvetica")
        //doc.setFontWeight("bold")
        //doc.setFontFamily("Helvetica Neue")
        //doc.setFontFamily("Helvetica LT W01 Condensed")
        //doc.setFontFamily("San Francisco Display")
        //doc.setFontFamily("PublicSans Light")
        //doc.setFontFamily("OpenSans Regular")
        doc.setFontSizeAndLineHeight("16px")
        //doc.setLetterSpacing("0.05em")
        //doc.setTextTransform("uppercase")
        //doc.setBorder("1px dashed #aaa")
   }

    /*
    setupVectorDocTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        doc.setFontFamily("Hyperspace Bold")
        doc.setFontSize("15px")
        doc.setFontWeight("bold")
        //doc.setFontSizeAndLineHeight("1.1em")
        doc.setLetterSpacing("0.1em")
        doc.setTextShadow("0px 0px 1px rgba(255,255,255,1)")
        doc.setFontWeight(900)
        //doc.setTextTransform("uppercase")
        //DocumentBody.shared().setTextTransform("uppercase")
    }

    setupBlenderProDocTheme () {
        const doc = DocumentBody.shared()
        doc.setFontFamily("Blender Pro Book")
        doc.setFontSizeAndLineHeight("18px")
    }

    setupLatoDocTheme () {
        const doc = DocumentBody.shared()
        doc.setFontFamily("Lato Light")
        doc.setFontSizeAndLineHeight("16px")
        doc.setLetterSpacing("0.05em")
        doc.setTextShadow("0px 0px 0.5px rgba(255,255,255,0.7)")
    }
    */

}.initThisClass());


