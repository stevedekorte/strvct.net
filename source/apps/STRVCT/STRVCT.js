"use strict"

/*
    
    STRVCT


*/

window.STRVCT = class STRVCT extends App {
    
    initPrototype () {
        // model
        this.newSlot("settings", null)
        this.newSlot("resources", null)
        this.newSlot("dataStore", null)

        // view
        this.newSlot("browser", null)
    }

    init () {
        super.init()
        console.log(this.type() + " init <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
        this.setName("STRVCTapp")
        this.setVersion([0, 0, 0, 0])
        return this
    } 

    setup () {
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
        //console.log("App.setupModel rooObject.subnodes = ", root.subnodes().map(sn => sn.title()).join(",") )
        //root.removeAllSubnodes()

        const myLists = this.defaultStore().rootSubnodeWithTitleForProto("Notes", BMMenuNode);
        this.addLinkSubnode(myLists)

        //const prototypes = this.defaultStore().rootSubnodeWithTitleForProto("Prototypes", BMMenuNode);
        const prototypes = this.defaultStore().rootSubnodeWithTitleForProto("Prototypes", BMPrototypesNode);
        prototypes.setTitle("Prototypes")
        prototypes.setNodeCanReorderSubnodes(true)
        this.addLinkSubnode(prototypes)

        this.setupSettings()
        return this
    }

    setupSettings () {
        // settings
        this.setSettings(BMStorableNode.clone().setTitle("Settings").setSubtitle(null).setNodeMinWidth(250))
        this.addSubnode(this.settings())

        // resources
        this.setResources(BMResources.shared())
        this.settings().addSubnode(this.resources())
        
        // data store
        this.setDataStore(BMDataStore.clone())
        this.settings().addSubnode(this.dataStore())
    }

    // --- setup views ---
    
    setupViews () {
        this.setupBrowser()
        //this.setupShelf()
    }

    isBrowserCompatible () {
        /*
        if (WebBrowserWindow.shared().agentIsSafari()) {
            return false
        }
        */
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

        window.ResourceLoaderPanel.shared().stop() 
    }

    // themes

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


