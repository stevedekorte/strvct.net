"use strict"

/*
    
    StrvctApp


*/

window.StrvctApp = class StrvctApp extends App {
    

    initPrototype () {
        // model
        this.newSlot("notes", null)
        this.newSlot("prototypes", null)
        this.newSlot("settings", null)
        this.newSlot("resources", null)
        this.newSlot("dataStore", null)

        // view
        this.newSlot("browser", null)
    }

    init () {
        super.init()
        //console.log(this.type() + " init <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
        this.setName("StrvctApp")
        this.setVersion([0, 0, 0, 0])
        this.setNodeCanReorderSubnodes(true)
        this.addAction("add")

        return this
    } 

    setup () { // called by App.run
        super.setup()        
        this.setupTheme()
        this.setupModel()
        this.setupViews()
        this.appDidInit()
        this.subnodes().forEach(sn => sn.setCanDelete(true))
        return this
    }

    // --- setup model ---

    setupModel () {     
        const root = this.defaultStore().rootObject()
        root.setNodeMinWidth(150)
        //console.log("App.setupModel rooObject.subnodes = ", root.subnodes().map(sn => sn.title()).join(",") )
        //root.removeAllSubnodes()

        const notes = this.subnodeWithTitleIfAbsentInsertProto("Notes", BMMenuNode)
        this.setNotes(notes)

        const prototypes = this.subnodeWithTitleIfAbsentInsertProto("Prototypes", BMPrototypesNode)
        this.setPrototypes(notes)

        this.setupSettings()
        return this
    }

    setupSettings () {
        // settings
        const settings = this.subnodeWithTitleIfAbsentInsertProto("Settings", BMStorableNode)
        settings.setNodeMinWidth(150)
        this.setSettings(settings)
        //this.removeOtherSubnodeWithSameTitle(settings)

        const resources = settings.subnodeWithTitleIfAbsentInsertProto("Resources", BMResources)
        this.setResources(resources)
        settings.removeOtherSubnodeWithSameTitle(resources)

        // data store
        const dataStore = settings.subnodeWithTitleIfAbsentInsertProto("Storage", BMDataStore)
        this.setDataStore(dataStore)
        settings.removeOtherSubnodeWithSameTitle(dataStore)

    }

    // --- setup views ---
    
    setupViews () {
        this.setupBrowser()
        //this.setupShelf()
    }

    isBrowserCompatible () {
        return true
    }
    
    setupBrowser () {	
        console.log("App setupBrowser")
        this.setBrowser(BrowserView.clone())
    
        this.browser().hideAndFadeIn()
        this.browser().setNode(this)
                
        this.documentBodyView().addSubview(this.browser())
        this.browser().syncFromNodeNow()
        this.browser().syncFromHashPath()
        return this
    }

    appDidInit () {
        super.appDidInit()
        
        // ResourceLoaderPanel can't use notification as it's a boot object
        // what if we added a one-shot observation for it, or would that be more confusing?

    }

    // themes - temporary, until ThemesResources is ready

    setupTheme () {
        this.setupNormalTheme()
    }

    setupNormalTheme () {
        const doc = DocumentBody.shared()
        //doc.setFontFamily("Sans-Serif")
        doc.setFontFamily("Helvetica Neue")
        //doc.setFontFamily("San Francisco Display")
        //doc.setFontFamily("PublicSans Light")
        //doc.setFontFamily("OpenSans Regular")
        doc.setFontSizeAndLineHeight("15px")
    }

    setupVectorTheme () {
        const doc = DocumentBody.shared()
        doc.setFontFamily("Hyperspace Bold")
        doc.setFontSize("12px")
        //doc.setFontSizeAndLineHeight("1.1em")
        doc.setLetterSpacing("0.1em")
        doc.setTextShadow("0px 0px 1px rgba(255,255,255,1)")
        doc.setFontWeight(900)
        doc.setTextTransform("uppercase")
        //DocumentBody.shared().setTextTransform("uppercase")
    }

    setupBlenderProTheme () {
        const doc = DocumentBody.shared()
        doc.setFontFamily("Blender Pro Book")
        doc.setFontSizeAndLineHeight("18px")
    }

    setupLatoTheme () {
        const doc = DocumentBody.shared()
        doc.setFontFamily("Lato Light")
        doc.setFontSizeAndLineHeight("16px")
        doc.setLetterSpacing("0.05em")
        doc.setTextShadow("0px 0px 0.5px rgba(255,255,255,0.7)")
    }

}.initThisClass()


/*

let windowEventCount = 0
window.addEventListener('mouseup', function(event){
    console.log("window mouseup <<<<<<<<<<<<<<<<<<<<")
})

window.addEventListener('mouseleave', function(event){
    console.log("window mouseleave <<<<<<<<<<<<<<<<<<<<")
})

window.addEventListener('mousemove', function(event){
    windowEventCount ++
    console.log("window mousemove <<<<<<<<<<<<<<<<<<<< " + windowEventCount)
})
*/
