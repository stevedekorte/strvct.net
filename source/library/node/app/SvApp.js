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
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("isRunning", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {PersistentObjectPool} store
         * @category Data Management
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("PersistentObjectPool");
        }

        /**
         * @member {UoModel} model
         * @category Model
         */
        {
            const slot = this.newSlot("model", null);
            slot.setSlotType("SvModel");
        }

        /**
         * @member {String} userInterfaceClassName
         * @category UI
         */
        {
            const slot = this.newSlot("userInterfaceClassName", "SvUserInterface");
            slot.setSlotType("String");
        }

        /**
         * @member {SvUserInterface} userInterface
         * @category UI
         */
        {
            const slot = this.newSlot("userInterface", null);
            slot.setSlotType("SvUserInterface");
            //slot.setFinalInitProto(SvUserInterface);
            // note: we want to be able to support 1) web ui 2) cli ui 3) no ui i.e. headless mode
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
         * @member {Promise} didInitPromise
         * @category Initialization
         */
        {
            const slot = this.newSlot("didInitPromise", null);
            //slot.setSlotType("Promise");
            slot.setFinalInitProto(Promise);
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
        this.initUserInterface();
        //this.setDidInitPromise(Promise.clone());
    }

    initUserInterface () {
        const uiClass = SvGlobals.get(this.userInterfaceClassName());
        assert(uiClass, "User interface class " + this.userInterfaceClassName() + " not found");
        assert(uiClass.isKindOf(SvUserInterface), "User interface class " + this.userInterfaceClassName() + " is not a subclass of SvUserInterface");
        this.setUserInterface(uiClass.clone());
    }

    finalInit () {
        super.finalInit();
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
     * @description Runs the app
     * @category Lifecycle
     */
    async run () {
        if (this.isRunning()) {
            return;
        }
        this.setIsRunning(true);

        this.userInterface().setApp(this);
        await this.userInterface().assertCanRun(); // e.g. check for other tabs

        await this.initAndOpenStore(); // will create model
        await this.setup();
    }

    // --- open store ---
    
    modelClass () {
        const className = this.thisPrototype().slotNamed("model").slotType();
        return SvGlobals.get(className);
    }

     async initAndOpenStore () {
        SvBootLoadingView.shared().setSubtitle("opening data store");

        this.setStore(this.defaultStore());
        this.store().setName(this.svType()); // name of the database

        let clearFirst = false; // SvPlatform.isNodePlatform())

        if (clearFirst) {
            await this.clearStoreThenClose();
        }
        await this.openStore();
    }

    /**
     * @description Clears the store
     * @category Data Management
     */
    async clearStoreThenClose () {
        this.logDivider("begin clearStoreThenClose");
        await this.store().promiseDeleteAll();
        await this.store().promiseClose();
        this.logDivider("end clearStoreThenClose");
    }

    /**
     * @description Opens the store and runs the app
     * @category Initialization
     */
    async openStore () {
        await this.store().promiseOpen(); 
        this.store().rootOrIfAbsentFromClosure(() => {
            return this.modelClass().clone();
        });

        const currentRootObject = this.store().rootObject();

        const isCorrectModel = !Type.isNullOrUndefined(currentRootObject) && this.store().rootObject().isKindOf(this.modelClass());
        if (!isCorrectModel) { 
            console.error("Model is not correct type: " + this.store().rootObject().thisClass().svType());
            if (this._attemptToResetStore === true) { 
                debugger;
                throw new Error("Failed to open store with correct model after reset");
            }
            this._attemptToResetStore = true;
            await this.clearStoreThenClose();
            await this.openStore();
        }
        this.setModel(this.store().rootObject());
        this.model().setApp(this);
        SvBootLoadingView.shared().setSubtitle("data store opened");
    }

    pauseReactiveSystem () {
        SvSyncScheduler.shared().pause();
        SvNotificationCenter.shared().pause();
    }

    resumeReactiveSystem () {
        SvSyncScheduler.shared().resume();
        SvNotificationCenter.shared().resume();
    }

    /**
     * @description Sets up the app
     * @category Initialization
     */
    async setup () {
        SvBootLoadingView.shared().setSubtitle("setup app");

        this.pauseReactiveSystem();

        await this.setupModel();
        await this.setupUserInterfaceIfNeeded();
        await this.appDidInit();

        this.resumeReactiveSystem();
        SvBootLoadingView.shared().setSubtitle("app initialized");
    }

    async setupModel () {
        SvBootLoadingView.shared().setSubtitle("setup model");
        await this.model().setup();
    }

    async setupUserInterfaceIfNeeded () {
        SvBootLoadingView.shared().setSubtitle("setup ui");
        await this.userInterface().setup();
    }

    /**
     * @description Called when the app has finished initializing
     * @category Lifecycle
     */
    async appDidInit () {
        this.setHasDoneAppInit(true);
        
        this.model().appDidInit();
        this.userInterface().appDidInit();

        //this.postNoteNamed("appDidInit");
        //await this.afterAppDidInit();
        this.postAppDidInit();
    }

    postAppDidInit () {
        this.postNoteNamed("appDidInit");
        this.addTimeout(() => {
            this.scheduleMethodForNextCycle("afterAppDidInit");
        }, 0);
    }

    /**
     * @description Called after the app UI has initialized
     * @category Lifecycle
     */
    async afterAppDidInit () {
        this.model().afterAppDidInit();
        this.userInterface().afterAppDidInit();
        this.didInitPromise().callResolveFunc(this);
    }

    /**
     * @description Sets the name of the app
     * @param {string} aString - The new name
     * @returns {SvApp} The app instance
     * @category Metadata
     */
    setName (aString) {
        this._name = aString;
        this.setTitle(aString);
        return this;
    }
    
    /**
     * @description Returns the version string
     * @returns {string} The version string
     * @category Metadata
     */
    versionsString () {
        return this.version().join(".");
    }

    /**
     * @description Returns the full version string
     * @returns {string} The full version string
     * @category Metadata
     */
    fullVersionString () {
        return "Application '" + this.name() + "' version " + this.versionsString();
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

    /**
     * @description Shows the classes
     * @category Debugging
     */
    showClasses () {
        const s = ProtoClass.subclassesDescription();
        this.log(s);
    }

}.initThisClass());