"use strict";

/*
    
    HavewordsApp


*/

(class HavewordsApp extends App {
    
    static rootNodeProto () {
        return RootContentNode
    }

    initPrototypeSlots () {

        /*
        {
            const slot = this.newSlot("rootContentNode", null)
            slot.setShouldStoreSlot(false)
            slot.setCanInspect(true)
        }
        */

        // for now, we won't store this object in order to avoid some
        // chicken and egg problems

        this.setShouldStore(false)
        this.setShouldStoreSubnodes(false)

        // view
        this.newSlot("browser", null)
        this.newSlot("services", null)
        this.newSlot("sessions", null)
        this.newSlot("characters", null)
    }

    // ---

    init () {
        super.init()
        this.setupDocTheme();
        this.setName("Havewords.ai")
        this.setVersion([0, 0, 0, 0])
        this.setNodeCanReorderSubnodes(true)
        //this.addNodeAction("add")
        document.title = "...";

        return this
    }

    setup () {
        super.setup()
        this.setupModel()
        BMResources.shared()
        
        const browser = BrowserView.clone()
        this.rootNode().setTitle("root node")
        
        this.rootNode().headerNode().setTitle(this.name());

        browser.setNode(this.rootNode())
        browser.syncFromNode()

        this.setBrowser(browser)
        this.documentBodyView().addSubview(browser)

        //this.addTimeout( () => this.showClasses(), 1)

    }

    showClasses () {
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    // --- setup model ---

    setupModel () {
        const baseNode = this.rootNode().headerNode().breadCrumbsNode()
        baseNode.removeNodeAction("add")
        
        const services = baseNode.subnodeWithTitleIfAbsentInsertProto("Services", HwServices)
        this.setServices(services) // not used yet

        const sessions = baseNode.subnodeWithTitleIfAbsentInsertProto("Sessions", HwSessions)
        this.setSessions(sessions) // not used yet

        const characters = baseNode.subnodeWithTitleIfAbsentInsertProto("Characters", Characters)
        this.setCharacters(characters) // not used yet

        // settings
        //const settings = this.rootNode().subnodeWithTitleIfAbsentInsertProto("Settings", BMSettingsNode)
        //this.setSettings(settings)

        if (false) {
            BMBlobs.shared().promiseOpen().then(() => this.appDidInit())
        } else {
            this.appDidInit()
        }

        return this
    }

    // --- setup views ---

    appDidInit () {
        //this.rootNode().removeFirstSubnodeWithTitle("Themes")
        super.appDidInit()
        this.waitForFontsToLoad();
    }

    waitForFontsToLoad () {
        const done = BMResources.shared().fonts().hasLoadedAllFonts();
        if (done) {
            this.onAllFontsLoaded()
            return;
        }
        console.log("not done loading fonts");
        setTimeout(() => {
            this.waitForFontsToLoad()
        }, 100);
    }

    onAllFontsLoaded () {
        document.body.style.display = "flex";
        ResourceManager.shared().markPageLoadTime();
        document.title = this.name() + " (" + ResourceManager.shared().loadTimeDescription() + ")";
        console.log("done loading fonts!");
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
        doc.setFontFamily("BarlowCondensed");
        doc.setFontWeight("Medium");
        //doc.setFontWeight("bold")
        //doc.setFontFamily("Helvetica Neue")
        //doc.setFontFamily("Helvetica LT W01 Condensed")
        //doc.setFontFamily("San Francisco Display")
        //doc.setFontFamily("PublicSans Light")
        //doc.setFontFamily("OpenSans Regular")
        doc.setFontSizeAndLineHeight("16px")

   }

}.initThisClass());


