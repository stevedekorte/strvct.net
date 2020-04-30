"use strict"

/*
    
    StrvctApp


*/

window.StrvctApp = class StrvctApp extends App {
    

    initPrototype () {
        // model
        this.newSlot("rootNode", null)
        this.newSlot("notes", null)
        this.newSlot("prototypes", null)
        this.newSlot("settings", null)
        this.newSlot("resources", null)
        this.newSlot("dataStore", null)

        // view
        this.newSlot("browser", null)
        this.newSlot("stackView", null)
    }

    init () {
        super.init()
        this.setName("StrvctApp")
        this.setVersion([0, 0, 0, 0])
        this.setNodeCanReorderSubnodes(true)
        this.addAction("add")
        return this
    } 

    setup () {
        this.setRootNode(BMNode.clone().setTitle("root"))
        this.rootNode().addSubnode(this)

        this.setupTheme()
        this.setupModel()

        const v = StackView.clone() //.setDirection("down")
        this.setStackView(v)
        v.setNode(this.rootNode())
        this.documentBodyView().addSubview(v)
        this.appDidInit()
    }

    setup_old () { // called by App.run
        super.setup()        
        this.setupTheme()
        this.setupModel()
        this.setupViews()
        this.appDidInit()
        return this
    }

    // --- setup model ---

    setupModel () {     
        const root = this.defaultStore().rootObject()
        root.setNodeMinWidth(150)
        //console.log("App.setupModel rooObject.subnodes = ", root.subnodes().map(sn => sn.title()).join(",") )
        //root.removeAllSubnodes()

        const notes = this.subnodeWithTitleIfAbsentInsertProto("Notes", BMFolderNode)
        //notes.subnodes().forEach(sn => sn.setCanDelete(true))
        //notes.orderFirst()
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

        this.addSettingNameAndClass("Resources", BMResources)
        this.addSettingNameAndClass("Storage", BMDataStore)
        this.addSettingNameAndClass("Resources", BMResources)
        this.addSettingNameAndClass("Blobs", BMBlobs)

    }

    addSettingNameAndClass (aName, aClass) {
        const subnode = this.settings().subnodeWithTitleIfAbsentInsertProto(aName, aClass)
        this.settings().removeOtherSubnodeWithSameTitle(subnode)
        const slot = this.thisPrototype().ownSlotNamed(aName)
        if (slot) {
            slot.onInstanceSetValue(subnode) // or should we dynamically get these from the subnodes?
        }
        return subnode
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
        //console.log("App setupBrowser")
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
        //this.setupVectorTheme()
    }

    setupNormalTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        //doc.setFontFamily("Sans-Serif")
        doc.setFontFamily("Helvetica")
        doc.setFontWeight("bold")
        //doc.setFontFamily("Helvetica Neue")
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
