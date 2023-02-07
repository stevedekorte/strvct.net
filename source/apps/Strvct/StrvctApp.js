"use strict";

/*
    
    StrvctApp


*/

(class StrvctApp extends App {
    
    initPrototypeSlots () {
        // model meta data
        //this.newSlot("settings", null).setShouldStore(false)
        //this.newSlot("resources", null)
        //this.newSlot("prototypes", null)

        // model data
        //this.newSlot("notes", null)

        // view
        this.newSlot("browser", null)
    }

    // ---

    init () {
        super.init()
        this.setName("StrvctApp")
        this.setVersion([0, 0, 0, 0])
        this.setNodeCanReorderSubnodes(true)
        this.addAction("add")
        return this
    } 

    setup () {
        super.setup()
        this.setupModel()

        const browser = BrowserView.clone()
        this.rootNode().setTitle("root node")
        browser.setBreadCrumbsNode(this.rootNode())
        this.setBrowser(browser)
        this.documentBodyView().addSubview(browser)
        this.appDidInit()

        //this.addTimeout( () => this.showClasses(), 1)
    }

    showClasses () {
        debugger;
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    // --- setup model ---

    setupModel () {        
        const notes = this.rootNode().subnodeWithTitleIfAbsentInsertProto("Notes", BMFolderNode)
        //notes.subnodes().forEach(sn => sn.setCanDelete(true))
        //notes.orderFirst()
        //this.setNotes(notes)

        const prototypes = this.rootNode().subnodeWithTitleIfAbsentInsertProto("Prototypes", BMPrototypesNode)
        //this.setPrototypes(prototypes)

        // settings
        const settings = this.rootNode().subnodeWithTitleIfAbsentInsertProto("Settings", BMSettingsNode)
        //this.setSettings(settings)
        //debugger;
        return this
    }

    // --- setup views ---

    appDidInit () {
        super.appDidInit()
        this.rootNode().removeFirstSubnodeWithTitle("Themes")
    }

    // themes - temporary, until ThemesResources is ready

    setupDocTheme () {
        const doc = DocumentBody.shared()
        doc.setHeight("100%") // trying to fix body not fitting window
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")
        this.setupNormalDocTheme()
        //this.setupVectorTheme()
        //this.setupBlenderProTheme()
    }

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