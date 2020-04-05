"use strict"

/*
    
    StatsApp


*/

window.StatsApp = class StatsApp extends App {
    

    initPrototype () {
        // model
        this.newSlot("stats", null)

        this.newSlot("settings", null)
        this.newSlot("resources", null)
        this.newSlot("dataStore", null)
        this.newSlot("cache", null)

        // view
        this.newSlot("stackView", null)
    }

    init () {
        super.init()
        this.setName("StatsApp")
        this.setVersion([0, 0, 0, 0])
        this.setNodeCanReorderSubnodes(true)
        this.addAction("add")
        return this
    } 

    setup () {
        this.setupTheme()
        this.setupModel()

        const v = StackView.clone()
        //v.setDirection("down")
        v.setNode(this)
        this.setStackView(v)
        this.documentBodyView().addSubview(v)
        this.appDidInit()
    }

    // --- setup model ---

    setupModel () {     
        const root = this.defaultStore().rootObject()
        root.setNodeMinWidth(150)

        const stats = this.subnodeWithTitleIfAbsentInsertProto("DataSources", BMFolderNode)
        this.setStats(stats)

        const kinsa = stats.subnodeWithTitleIfAbsentInsertProto("Kinsa", Kinsa)
        stats.removeSubnodesWithTitle("Foursquare")
        const foursquare = stats.subnodeWithTitleIfAbsentInsertProto("Foursquare", Foursquare)
        //stats.removeSubnodesWithTitle("Foursquare")
        
        const safegraph = stats.subnodeWithTitleIfAbsentInsertProto("SafeGraph", BMFolderNode)
        const usafacts = stats.subnodeWithTitleIfAbsentInsertProto("USA Facts", BMFolderNode)
        // https://usafactsstatic.blob.core.windows.net/public/data/covid-19/covid_confirmed_usafacts.csv

        this.setupSettings()
        return this
    }

    setupSettings () {
        // settings
        const settings = this.subnodeWithTitleIfAbsentInsertProto("Settings", BMStorableNode)
        settings.setNodeMinWidth(150)
        this.setSettings(settings)

        {
            const resources = settings.subnodeWithTitleIfAbsentInsertProto("Resources", BMResources)
            this.setResources(resources)
            settings.removeOtherSubnodeWithSameTitle(resources)
        }

        {
            const dataStore = settings.subnodeWithTitleIfAbsentInsertProto("Storage", BMDataStore)
            this.setDataStore(dataStore)
            settings.removeOtherSubnodeWithSameTitle(dataStore)
        }

        {
            const cache = settings.subnodeWithTitleIfAbsentInsertProto("Cache", BMCache)
            this.setCache(cache)
            settings.removeOtherSubnodeWithSameTitle(cache)
        }

        settings.subnodes().forEach(node => node.setCanDelete(true))

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
        //this.removeAllSubnodes()
        
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
        //doc.setFontFamily("Sans-Serif")
        doc.setFontFamily("Helvetica")
        //doc.setBackgroundColor("white")
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
