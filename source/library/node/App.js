"use strict";

/**
 * @module library.node
 */

/**
 * @class App
 * @extends TitledNode
 * @classdesc A shared instance that represents the application. 
 *
 * Handles:
 * - starting up persistence system
 * - setting up user interface, if any
 *
 * For your application, create a subclass if needed.
 *
 * NOTES
 *
 * Originally planned to have a shared instance of App that would be the root of the object graph,
 * so we'd load the store and then call run on the App instance loaded from it.
 *
 * But that felt difficult so instead we create an instance now, and ask it to load the object pool the store.
 */
(class App extends TitledNode {
    
    /**
     * @static
     * @description Initializes the class
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @static
     * @description Returns the shared instance of the class
     * @returns {App} The shared instance
     */
    static shared () {
        return super.shared();
    }
    
    /**
     * @static
     * @description Returns the shared context
     * @returns {App} The shared context
     */
    static sharedContext () {
        // We override sharedContext so all subclasses use the same shared value
        // and anyone can call App.shared() to access it
        return App;
    }

    /**
     * @static
     * @description Loads and runs the shared instance
     * @returns {App} The shared instance
     */
    static loadAndRunShared () {
        const app = this.shared();
        app.setStore(this.defaultStore());
        app.store().setName(this.type()); // name of the database
        app.loadFromStore();
        return app;
    }

    /**
     * @description Loads the app from the store
     */
    async loadFromStore () {
        const clearFirst = false;

        if (clearFirst) {
            await this.clearStore();
            this.scheduleMethod("justOpen"); // is this needed to wait for tx to commit?
        } else {
            await this.justOpen();
        }
    }

    /**
     * @description Clears the store
     */
    async clearStore () {
        console.log(">>>>>>>>>>>>>>>> clearing db <<<<<<<<<<<<<<<");
        await this.store().promiseDeleteAll();
        console.log(">>>>>>>>>>>>>>>> cleared db  <<<<<<<<<<<<<<<");
    }

    /**
     * @description Logs the time taken to run a block of code
     * @param {Function} block - The block of code to run
     * @param {string} label - The label for the log
     */
    async asyncLogTimeToRun (block, label) {
        const start = performance.now();
        await block();
        const end = performance.now();
        const time = end - start;
        console.log(" --- " + label + " " + Math.round(time/100)/10 + "s --- ");
    }

    /**
     * @description Opens the store and runs the app
     */
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
        }
    }

    /**
     * @static
     * @description Returns the root node prototype
     * @returns {BMStorableNode} The root node prototype
     */
    static rootNodeProto () {
        return BMStorableNode;
    }

    /**
     * @description Initializes the prototype slots
     */
    initPrototypeSlots () {
        /**
         * @member {PersistentObjectPool} store
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("PersistentObjectPool");
        }

        /**
         * @member {String} name
         */
        {
            const slot = this.newSlot("name", "App");
            slot.setSlotType("String");
        }

        /**
         * @member {Array} version
         */
        {
            const slot = this.newSlot("version", [0, 0]);
            slot.setSlotType("Array");
        }

        /**
         * @member {Boolean} hasDoneAppInit
         */
        {
            const slot = this.newSlot("hasDoneAppInit", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {DomView} rootView
         */
        {
            const slot = this.newSlot("rootView", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {Promise} didInitPromise
         */
        {
            const slot = this.newSlot("didInitPromise", null);
            slot.setSlotType("Promise");
        }
    }
  
    /**
     * @description Initializes the prototype
     */
    initPrototype () {
        this.setIsDebugging(true);
    }

    /**
     * @description Initializes the instance
     */
    init () {
        this.setDidInitPromise(Promise.clone());
    }

    /**
     * @description Returns the title of the app
     * @returns {string} The title
     */
    title () {
        return this.name();
    }
    
    /**
     * @description Checks if the browser is compatible
     * @returns {boolean} True if compatible, false otherwise
     */
    isBrowserCompatible () {
        return true;
    }

    /**
     * @description Runs the app
     */
    async run () {
        await this.setup()
    }

    /**
     * @description Sets up the app
     */
    async setup () {
        SyncScheduler.shared().pause();
        BMNotificationCenter.shared().pause();

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
    }

    /**
     * @description Sets up the model
     */
    async setupModel () {
        // for subclasses to override
    }

    /**
     * @description Sets up the UI
     */
    async setupUi () {
        this.setupDocTheme();
    }

    /**
     * @description Hides the root view
     * @returns {App} The app instance
     */
    hideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(true);
        }
        return this;
    }

    /**
     * @description Unhides the root view
     * @returns {App} The app instance
     */
    unhideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(false);
        }
        return this;
    }

    /**
     * @description Shows the classes
     */
    showClasses () {
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    /**
     * @description Called when the app has finished initializing
     */
    async appDidInit () {
        this.setHasDoneAppInit(true);
        this.postNoteNamed("appDidInit");

        if (this.runTests) {
		    this.runTests();
        }

        bootLoadingView.setTitle("");

        document.body.style.display = "flex";
        bootLoadingView.close();
        this.unhideRootView();
        this.afterAppUiDidInit();
    }

    /**
     * @description Called after the app UI has initialized
     */
    afterAppUiDidInit () {
        const searchParams = WebBrowserWindow.shared().pageUrl().searchParams;
        if (searchParams.keys().length !== 0) {
            this.handleSearchParams(searchParams);
        }
        this.didInitPromise().callResolveFunc(this);
    }

    /**
     * @description Handles search parameters
     * @param {URLSearchParams} searchParams - The search parameters
     * @returns {App} The app instance
     */
    handleSearchParams (searchParams) {
        // for subclasses to implement
        return this
    }

    /**
     * @description Called after the first render
     */
    afterFirstRender () {
        ResourceManager.shared().markPageLoadTime();
        document.title = this.name() + " (" + ResourceManager.shared().loadTimeDescription() + ")";
    }
        
    /**
     * @description Returns the main window
     * @returns {WebBrowserWindow} The main window
     */
    mainWindow () {
        return WebBrowserWindow.shared()
    }

    /**
     * @description Returns the document body view
     * @returns {DomView} The document body view
     */
    documentBodyView () {
        return this.mainWindow().documentBody()
    }

    /**
     * @description Sets the name of the app
     * @param {string} aString - The new name
     * @returns {App} The app instance
     */
    setName (aString) {
        this._name = aString
        this.setTitle(aString)
        return this
    }
    
    /**
     * @description Returns the version string
     * @returns {string} The version string
     */
    versionsString () {
        return this.version().join(".")
    }

    /**
     * @description Returns the full version string
     * @returns {string} The full version string
     */
    fullVersionString () {
        return "Application '" + this.name() + "' version " + this.versionsString();
    }

    /**
     * @description Sets up the document theme
     */
    setupDocTheme () {
        const doc = DocumentBody.shared()
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")
        this.setupNormalDocTheme()
    }

    /**
     * @description Sets up the normal document theme
     */
    setupNormalDocTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        doc.setFontFamily("EB Garamond");
        doc.setFontWeight("Medium");
        doc.setFontSizeAndLineHeight("16px")
   }

}.initThisClass());