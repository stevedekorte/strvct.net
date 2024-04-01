"use strict";

/*
    App 
    
    A shared instance that represents the application. 

    Handles:
    - starting up persistence system
    - setting up user interface, if any

    For your application, create a subclass if needed.

*/

(class App extends TitledNode {
    
    static initClass () {
        this.setIsSingleton(true)
        return this
    }
    
    // --- shared ---
    // We override sharedContext so all subclasses use the same shared value
    // and anyone can call App.shared() to access it

    static sharedContext () {
        return App
    }

    // --- store ---
    // we open store from app class since we might want to load app instance from store

    static async loadAndRunShared () {
        //debugger;
        const store = this.defaultStore();
        store.setName(this.type()); // name of the database
        const clearFirst = false;

        if (clearFirst) {
            console.log(">>>>>>>>>>>>>>>> clearing db <<<<<<<<<<<<<<<")
            await store.promiseDeleteAll();
            console.log(">>>>>>>>>>>>>>>> cleared db <<<<<<<<<<<<<<<")
            //debugger
            store.close();
            this.scheduleMethod("justOpen");
        } else {
            this.justOpen();
        }
    }

    static async justOpen () {
        const store = this.defaultStore();
        try {
            await store.promiseOpen();
            this.onPoolOpenSuccess(this.defaultStore()) ;
        } catch (error) {
            console.warn("ERROR: ", error);
            debugger;
            //ResourceLoaderPanel.shared().setError(errorMessage)
        }
    }

    static promiseDeleteDefaultStore () {
        return this.defaultStore().promiseDeleteAll()
    }

    static onPoolOpenSuccess (aPool) {
        const store = this.defaultStore()

        //console.log(this.type() + " onPoolOpenSuccess store count: ", store.count())
        store.rootOrIfAbsentFromClosure(() => {
            //debugger
            return this.rootNodeProto().clone()
        }) // create the root object
        //const app = this.defaultStore().rootObject().subnodeWithTitleIfAbsentInsertProto(this.type(), this)
        this.launchAppAfterOpen()
    }

    static launchAppAfterOpen () {
        const app = this.clone()
        this.setShared(app)
        app.run()
    }

    static rootNodeProto () {
        return BMStorableNode
    }

    // ------

    initPrototypeSlots () {
        this.newSlot("name", "App")
        this.newSlot("version", [0, 0])
        this.newSlot("hasDoneAppInit", false)
        this.newSlot("rootView", null)
    }

    init () {
        super.init()
        //console.log(ProtoClass.subclassesDescription())
        this.setIsDebugging(true)
    }

    title () {
        return this.name()
    }
    
    // run and setup sequence in order of which methods are called
    // 1. setup NodeStore

    isBrowserCompatible () {
        // subclasses can override to do their own checks
        return true
    }

    async run () {
        if (!this.isBrowserCompatible()) {
            ResourceLoaderPanel.shared().setError("Sorry, this app only works on<br>Chrome, FireFox, and Brave browsers.")
            return this
        }

       await this.setup()
    }

    /*
    showBrowserCompatibilityPanel () {
        console.log("showing panel")
        const panel = PanelView.clone()
        this.documentBodyView().addSubview(panel)
        panel.setTitle("Sorry, this app only works on<br>Chrome, FireFox, and Brave browsers.")
        panel.orderFront()
        panel.setZIndex(100)
        console.log("showed panel")
    }
    */

    // 2. setup

    async setup () {
        this.debugLog("Launching " + this.fullVersionString())
        await this.setupModel()
        await this.setupUi()
        this.appDidInit()
        return this
    }

    async setupModel () {
        // for subclasses to override
        return this
    }

    async setupUi () {
        this.setupDocTheme()
        //this.addTimeout( () => this.showClasses(), 1)
        return this        
    }

    hideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(true);
        }
        return this
    }

    unhideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(false);
        }
        return this
    }

    appDidInit () {
        this.setHasDoneAppInit(true)
        this.postNoteNamed("appDidInit")

        if (this.runTests) {
		    this.runTests()
        }

        //Documentation.shared().show()
        //this.registerServiceWorker() // not working yet
        this.waitForFontsToLoad();
    }

    showClasses () {
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    // --- fonts ---

    waitForFontsToLoad () {
        bootLoadingView.setTitle("Initializing...")
        //this.onAllFontsLoaded()

        // NOTES: we really only want to wait for the font's currently displayed to be loaded.
        // What's the best way to do that?
        const done = BMResources.shared().fonts().hasLoadedAllFonts();
        if (done) {
            this.onAllFontsLoaded()
            return;
        }
        //this.debugLog("not done loading fonts");

        setTimeout(() => {
            bootLoadingView.setTitle(bootLoadingView.title() + ".")
            this.waitForFontsToLoad()
        }, 10);
        
    }

    onAllFontsLoaded () {
        bootLoadingView.setTitle("onAllFontsLoaded")

        document.body.style.display = "flex";
        ResourceManager.shared().markPageLoadTime();
        document.title = this.name() + " (" + ResourceManager.shared().loadTimeDescription() + ")";
        //this.debugLog("done loading fonts! " + JSON.stringify(BMResources.shared().fonts().allFontNames()));
        //this.afterAppDidInit()
        
        bootLoadingView.close()
        this.unhideRootView()
        this.afterAppUiDidInit()
    }

    afterAppUiDidInit () {
        const searchParams = WebBrowserWindow.shared().pageUrl().searchParams
        if (searchParams.keys().length !== 0) {
            this.handleSearchParams(searchParams)
        }
    }

    handleSearchParams (searchParams) {
        // for subclasses to implement
        return this
    }
        
    // -- window and document ---

    mainWindow () {
        return WebBrowserWindow.shared()
    }

    documentBodyView () {
        return this.mainWindow().documentBody()
    }

    setName (aString) {
        this._name = aString
        this.setTitle(aString)
        //this.mainWindow().setTitle(aString)
        return this
    }
    
    // --- version ---

    versionsString () {
        return this.version().join(".")
    }

    fullVersionString () {
        return "Application '" + this.name() + "' version " + this.versionsString();
    }

    // --- themes - temporary, until ThemesResources is ready

    setupDocTheme () {
        const doc = DocumentBody.shared()
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")
        this.setupNormalDocTheme()
        //this.setupVectorTheme()
        //this.setupBlenderProTheme()
    }

    setupNormalDocTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        //doc.setFontFamily("BarlowCondensed");
        doc.setFontFamily("EB Garamond");
        doc.setFontWeight("Medium");
        //doc.setFontWeight("bold")
        //doc.setFontFamily("Helvetica Neue")
        //doc.setFontFamily("Helvetica LT W01 Condensed")
        //doc.setFontFamily("San Francisco Display")
        //doc.setFontFamily("PublicSans Light")
        //doc.setFontFamily("OpenSans Regular")
        doc.setFontSizeAndLineHeight("16px")
   }

   /*
    setupNormalDocTheme () {
        //const doc = DocumentBody.shared()
        const doc = this.documentBodyView()
        doc.setBackgroundColor("#191919")
        doc.setFontFamily("Helvetica")
        doc.setFontSizeAndLineHeight("15px")
        doc.setLetterSpacing("0.05em")
   }
   */

}.initThisClass());
