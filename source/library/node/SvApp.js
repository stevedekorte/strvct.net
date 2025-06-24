"use strict";

/**
 * @module library.node
 */

/**
 * @class SvApp
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
 * Originally planned to have a shared instance of SvApp that would be the root of the object graph,
 * so we'd load the store and then call run on the SvApp instance loaded from it.
 *
 * But that felt difficult so instead we create an instance now, and ask it to load the object pool the store.
 */
(class SvApp extends TitledNode {
    
    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @static
     * @description Returns the shared instance of the class
     * @returns {SvApp} The shared instance
     * @category Instance Management
     */
    static shared () {
        return super.shared(); // See sharedContext - this ensures only one app instance is returned, even for subclasses
    }
    
    /**
     * @static
     * @description Returns the shared context
     * @returns {SvApp} The shared context
     * @category Instance Management
     */
    static sharedContext () {
        // We override sharedContext so all subclasses use the same shared value
        // and anyone can call SvApp.shared() to access it
        return SvApp;
    }

    /**
     * @static
     * @description Loads and runs the shared instance
     * @returns {SvApp} The shared instance
     * @category Initialization
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
     * @category Initialization
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
     * @category Data Management
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
     * @category Utility
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
     * @category Initialization
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
     * @returns {SvStorableNode} The root node prototype
     * @category Data Management
     */
    static rootNodeProto () {
        return SvStorableNode;
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {PersistentObjectPool} store
         * @category Data Management
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("PersistentObjectPool");
        }

        /**
         * @member {String} name
         * @category Metadata
         */
        {
            const slot = this.newSlot("name", "App");
            slot.setSlotType("String");
        }

        /**
         * @member {Array} version
         * @category Metadata
         */
        {
            const slot = this.newSlot("version", [0, 0]);
            slot.setSlotType("Array");
        }

        /**
         * @member {Boolean} hasDoneAppInit
         * @category State Management
         */
        {
            const slot = this.newSlot("hasDoneAppInit", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {DomView} rootView
         * @category UI
         */
        {
            const slot = this.newSlot("rootView", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {Promise} didInitPromise
         * @category Initialization
         */
        {
            const slot = this.newSlot("didInitPromise", null);
            slot.setSlotType("Promise");
        }

        /**
         * @member {Boolean} developerMode - Whether the developer mode is enabled
         * @category State Management
         */
        {
            const slot = this.newSlot("developerMode", false);
            slot.setInspectorPath("");
            slot.setLabel("developer mode");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(false);
          }
    }
  
    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        this.setIsDebugging(true);
    }

    /**
     * @description Initializes the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setDidInitPromise(Promise.clone());
    }

    /**
     * @description Returns the title of the app
     * @returns {string} The title
     * @category Metadata
     */
    title () {
        return this.name();
    }
    
    /**
     * @description Checks if the browser is compatible
     * @returns {boolean} True if compatible, false otherwise
     * @category Utility
     */
    isBrowserCompatible () {
        return true;
    }

    /**
     * @description Runs the app
     * @category Lifecycle
     */
    async run () {
        await this.setup()
    }

    /**
     * @description Sets up the app
     * @category Initialization
     */
    async setup () {
        SyncScheduler.shared().pause();
        SvNotificationCenter.shared().pause();

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
        SvNotificationCenter.shared().resume();

        setTimeout(() => {
            console.log("All synchronous operations completed");
            this.afterFirstRender();
        }, 2);
    }

    /**
     * @description Sets up the model
     * @category Initialization
     */
    async setupModel () {
        // for subclasses to override
    }

    /**
     * @description Sets up the UI
     * @category Initialization
     */
    async setupUi () {
        this.setupDocTheme();
    }

    /**
     * @description Hides the root view
     * @returns {SvApp} The app instance
     * @category UI
     */
    hideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(true);
        }
        return this;
    }

    /**
     * @description Unhides the root view
     * @returns {SvApp} The app instance
     * @category UI
     */
    unhideRootView () {
        if (this.rootView()) {
            this.rootView().setIsDisplayHidden(false);
        }
        return this;
    }

    /**
     * @description Shows the classes
     * @category Debugging
     */
    showClasses () {
        const s = ProtoClass.subclassesDescription()
        console.log(s)
    }

    /**
     * @description Called when the app has finished initializing
     * @category Lifecycle
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
     * @category Lifecycle
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
     * @returns {SvApp} The app instance
     * @category Utility
     */
    handleSearchParams (/* searchParams */) {
        // for subclasses to implement
        return this
    }

    /**
     * @description Called after the first render
     * @category Lifecycle
     */
    afterFirstRender () {
        ResourceManager.shared().markPageLoadTime();
        //document.title = this.name() + " (" + ResourceManager.shared().loadTimeDescription() + ")";
        document.title = this.name();
    }
        
    /**
     * @description Returns the main window
     * @returns {WebBrowserWindow} The main window
     * @category UI
     */
    mainWindow () {
        return WebBrowserWindow.shared()
    }

    /**
     * @description Returns the document body view
     * @returns {DomView} The document body view
     * @category UI
     */
    documentBodyView () {
        return this.mainWindow().documentBody()
    }

    /**
     * @description Sets the name of the app
     * @param {string} aString - The new name
     * @returns {SvApp} The app instance
     * @category Metadata
     */
    setName (aString) {
        this._name = aString
        this.setTitle(aString)
        return this
    }
    
    /**
     * @description Returns the version string
     * @returns {string} The version string
     * @category Metadata
     */
    versionsString () {
        return this.version().join(".")
    }

    /**
     * @description Returns the full version string
     * @returns {string} The full version string
     * @category Metadata
     */
    fullVersionString () {
        return "Application '" + this.name() + "' version " + this.versionsString();
    }

    /**
     * @description Sets up the document theme
     * @category UI
     */
    setupDocTheme () {
        const doc = DocumentBody.shared()
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")
        this.setupNormalDocTheme()
    }

    /**
     * @description Sets up the normal document theme
     * @category UI
     */
    setupNormalDocTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        doc.setFontFamily("EB Garamond");
        doc.setFontWeight("Medium");
        doc.setFontSizeAndLineHeight("16px")
   }

    /**
     * Posts an error report to the server's /log_error endpoint
     * @param {Error|Object} error - Error object or error-like object with message property
     * @param {Object} [json=null] - Additional JSON data to include in the report
     * @returns {Promise<Object>} - Server response
     * @category Error Handling
     */
    async asyncPostErrorReport (error, json = null) {
        // Get the base URL from the current window location
        const protocol = window.location.protocol; // "http:" or "https:"
        const host = window.location.hostname;
        const port = window.location.port || (protocol === "https:" ? "443" : "80");
        const baseUrl = `${protocol}//${host}:${port}`;
        
        // Prepare error data
        const errorData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer || null,
            app: this.name(),
            version: this.versionsString()
        };
        
        // Add error information
        if (error instanceof Error) {
            errorData.message = error.message;
            errorData.name = error.name;
            errorData.stack = error.stack;
        } else if (typeof error === "object") {
            // Handle error-like objects
            Object.assign(errorData, error);
        } else if (typeof error === "string") {
            // Handle string errors
            errorData.message = error;
        }
        
        // Add additional JSON data if provided
        if (json && typeof json === "object") {
            errorData.additionalData = json;
        }
        
        try {
            // Post the error data to the server
            const response = await fetch(`${baseUrl}/log_error`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(errorData)
            });
            
            // Parse and return the response
            const responseData = await response.json();
            console.log("Error report sent successfully:", responseData);
            return responseData;
        } catch (err) {
            console.error("Failed to send error report:", err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Test method to verify error reporting functionality
     * @param {string} [message="Test error message"] - Test error message
     * @returns {Promise<Object>} - Server response
     * @category Error Handling
     */
    async testErrorReporting (message = "Test error message") {
        console.log("Testing error reporting with message:", message);
        
        const testError = new Error(message);
        testError.name = "TestError";
        
        const additionalData = {
            isTest: true,
            testTime: Date.now(),
            component: "ErrorReportingSystem"
        };
        
        return await this.asyncPostErrorReport(testError, additionalData);
    }

    // developer mode

    toggleDeveloperMode () {
        const devMode = this.developerMode();
        this.setDeveloperMode(!devMode);
        return this;
    }

    didUpdateSlotDeveloperMode (/*oldValue, newValue*/) {
        this.postNoteNamed("onAppDeveloperModeChangedNote");
    }

}.initThisClass());