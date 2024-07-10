"use strict";

/*
    App 
    
    A shared instance that represents the application. 

    Handles:
    - starting up persistence system
    - setting up user interface, if any

    For your application, create a subclass if needed.

    NOTES

    Originally planned to have a shared instance of App that would be the root of the object graph,
    so we'd load the store and then call run on the App instance loaded from it.

    But that felt difficult so instead we create an instance now, and ask it to load the object pool the store.

*/

(class App extends TitledNode {
    
    static initClass () {
        this.setIsSingleton(true);
    }

    static shared () {
        return super.shared();
    }
    
    // --- shared ---

    static sharedContext () {
        // We override sharedContext so all subclasses use the same shared value
        // and anyone can call App.shared() to access it
        return App;
    }

    // --- store ---
    // we open store from app class since we might want to load app instance from store

    static loadAndRunShared () {
      //  debugger;
        const app = this.shared();
        app.setStore(this.defaultStore());
        app.store().setName(this.type()); // name of the database
        app.loadFromStore();
        return app;
    }

    async loadFromStore () {
        const clearFirst = false;

        if (clearFirst) {
            await this.clearStore();
            this.scheduleMethod("justOpen"); // is this needed to wait for tx to commit?
        } else {
            await this.justOpen();
        }
    }

    async clearStore () {
        console.log(">>>>>>>>>>>>>>>> clearing db <<<<<<<<<<<<<<<");
        await this.store().promiseDeleteAll();
        console.log(">>>>>>>>>>>>>>>> cleared db  <<<<<<<<<<<<<<<");
    }

    async asyncLogTimeToRun (block, label) {
        const start = performance.now();
        await block();
        const end = performance.now();
        const time = end - start;
        console.log(" --- " + label + " " + Math.round(time/100)/10 + "s --- ");
    }

    async justOpen () {
        try {
            await this.asyncLogTimeToRun(async () => { 
                await this.store().promiseOpen(); 
            }, "store open");

            await this.asyncLogTimeToRun(async () => { 
                this.store().rootOrIfAbsentFromClosure(() => {
                    return this.thisClass().rootNodeProto().clone();
                });
            }, "store read");

            await this.asyncLogTimeToRun(async () => { 

            await this.run();
        }, "app run");

        } catch (error) {
            console.warn("ERROR: ", error);
            debugger;
            //ResourceLoaderPanel.shared().setError(errorMessage)
        }
    }

    static rootNodeProto () {
        return BMStorableNode;
    }

    // ------

    initPrototypeSlots () {

        {
            const slot = this.newSlot("store", null);
        }

        {
            const slot = this.newSlot("name", "App");
        }

        {
            const slot = this.newSlot("version", [0, 0]);
        }

        {
            const slot = this.newSlot("hasDoneAppInit", false);
        }

        {
            const slot = this.newSlot("rootView", null);
        }

        {
            const slot = this.newSlot("didInitPromise", null);
        }
    }
  
    initPrototype () {
        this.setIsDebugging(true);
    }

    init () {
        this.setDidInitPromise(Promise.clone()); // here in case there are multiple Apps?
    }

    title () {
        return this.name();
    }
    
    // run and setup sequence in order of which methods are called
    // 1. setup NodeStore

    isBrowserCompatible () {
        // subclasses can override to do their own checks
        return true;
    }

    async run () {
        /*
        if (true || !this.isBrowserCompatible()) {
            const message = "Sorry, this app requires a Chrome, FireFox, or Brave browser.";
            bootLoadingView.setErrorMessage(message);
            //ResourceLoaderPanel.shared().setError(message);
            throw new Error(message);
            return this;
        }
        */
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
        //debugger;
        SyncScheduler.shared().pause();
        BMNotificationCenter.shared().pause();

        //this.debugLog("Launching " + this.fullVersionString());
        //debugger;

        await this.asyncLogTimeToRun(async () => { 
            await this.setupModel();
        }, "setupModel");

        await this.asyncLogTimeToRun(async () => { 
            await this.setupUi();
        }, "setupUi");

        await this.asyncLogTimeToRun(async () => { 
            await this.appDidInit();
        }, "appDidInit");

        SyncScheduler.shared().resume();
        BMNotificationCenter.shared().resume();

        setTimeout(() => {
            console.log("All synchronous operations completed");
            this.afterFirstRender();
          }, 2);
        //debugger;
    }

    async setupModel () {
        // for subclasses to override
    }

    async setupUi () {
        this.setupDocTheme();
        //this.addTimeout( () => this.showClasses(), 1)
    }

    hideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(true);
        }
        return this;
    }

    unhideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(false);
        }
        return this;
    }

    showClasses () {
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    async appDidInit () {
        this.setHasDoneAppInit(true);
        //debugger;
        this.postNoteNamed("appDidInit");

        if (this.runTests) {
		    this.runTests();
        }

        //Documentation.shared().show()
        //this.registerServiceWorker() // not working yet

        bootLoadingView.setTitle("");

        document.body.style.display = "flex";
        //ResourceManager.shared().markPageLoadTime();
        //document.title = this.name() + " (" + ResourceManager.shared().loadTimeDescription() + ")";
        //debugger;
        bootLoadingView.close();
        this.unhideRootView();
        this.afterAppUiDidInit();
    }

    afterAppUiDidInit () {
        const searchParams = WebBrowserWindow.shared().pageUrl().searchParams;
        if (searchParams.keys().length !== 0) {
            this.handleSearchParams(searchParams);
        }
        this.didInitPromise().callResolveFunc(this);
    }

    handleSearchParams (searchParams) {
        // for subclasses to implement
        return this
    }

    afterFirstRender () {
        //debugger;
        ResourceManager.shared().markPageLoadTime();
        document.title = this.name() + " (" + ResourceManager.shared().loadTimeDescription() + ")";
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
