"use strict";

/**
 * @module library.node
 */

/**
 * @class SvApp
 * @extends SvTitledNode
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

(class SvApp extends SvTitledNode {

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
         * @member {SvPersistentObjectPool} store
         * @category Data Management
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("SvPersistentObjectPool");
        }

        /**
         * @member {SvModel} model
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
         * @member {Promise} userInterfaceReadyPromise - resolves with the
         * userInterface once it is ready to navigate (or, headless, once the
         * environment reports no navigable UI). Created up front so awaiting
         * after readiness resolves immediately.
         * @category Initialization
         */
        {
            const slot = this.newSlot("userInterfaceReadyPromise", null);
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
        this.showVersionJson();
    }

    /**
     * @description Returns the default chat model from services.
     * Acts as the terminal fallback for ancestor-walk model resolution.
     * @returns {SvAiChatModel} The default chat model
     * @category AI
     */
    defaultChatModel () {
        // SvServices.shared() returns the app's concrete subclass (e.g. UoServices)
        return SvServices.shared().defaultChatModel();
    }

    /**
     * @description Returns the title of the app
     * @returns {string} The title
     * @category Metadata
     */
    title () {
        return this.name();
    }

    logPrefix () {
        return "[" + this.thisClass().svType() + "] ";
    }

    async showVersionJson () {
        const json = await this.asyncVersionJson();
        console.log(this.logPrefix(), "version: ", json);

        //console.log(this.logPrefix(), "App git head hash: '" + json.gitHash + "'");
        //console.log(this.logPrefix(), "App git tag: '" + json.gitTag + "' short hash: '" + json.gitHashShort + "' timestamp: '" + json.buildTimestamp + "'");
    }

    async asyncVersionJson () {
        if (this._versionJson) {
            return this._versionJson;
        }
        /*
        sample json file:
          {
            "gitTag": "",
            "gitHash": "eb30038f...",
            "gitHashShort": "eb30038",
            "buildTimestamp": "2025-11-16T12:34:56Z"
        }
        */
        const fileName = "app-version.json";
        const file = SvFileResources.shared().rootFolder().fileWithName(fileName);
        if (!file) {
            console.error("versionJson: no file found in " + fileName);
            return null;
        }
        const data = await file.promiseData();
        const json = JSON.parse(data.asString()); // { "version": "1.0.0", "buildId": "1234567890" }
        this._versionJson = json;
        return json;
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
        this.bootPerfMark("canRunChecked");

        await this.initAndOpenStore(); // will create model
        await this.setup();
    }

    // --- open store ---

    modelClass () {
        const className = this.thisPrototype().slotNamed("model").slotType();
        return SvGlobals.get(className);
    }

    /**
     * @description The localStorage key for the clear-on-boot request flag.
     * @returns {string}
     * @category Data Management
     */
    static clearStoreOnBootKey () {
        return "SvApp_clearStoreOnBoot";
    }

    /**
     * @description Request that the NEXT boot deletes the app's persistent
     * stores (object pool + blob pool) before opening them. Used by logout
     * flows on shared browsers: deleting at boot — before any connection is
     * open — avoids IndexedDB's blocked-deletion race entirely. The caller
     * reloads the page after setting this. Content caches (CAM/hash cache,
     * localStorage) are NOT touched — only account/game data stores.
     * @category Data Management
     */
    static requestClearStoreOnBoot () {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(this.clearStoreOnBootKey(), "1");
        }
    }

    /**
     * @description Clears the app's account/game data stores (object pool
     * contents + blob pool) on the LIVE connections — used by logout so
     * nothing readable remains in IndexedDB before the user walks away from
     * a shared machine. Logout is rare and exceptional, so thoroughness
     * beats speed here. Content caches (CAM/hash cache, localStorage) are
     * untouched. Callers should also requestClearStoreOnBoot() as a backstop
     * for any records a stray in-flight write re-persists before navigation.
     * @category Data Management
     */
    async asyncClearGameDataStores () {
        await this.store().promiseDeleteAll();
        await SvBlobPool.shared().asyncClear();
    }

    /**
     * @description Consumes the clear-on-boot flag (returns whether it was set).
     * @returns {boolean}
     * @category Data Management
     */
    static consumeClearStoreOnBootFlag () {
        if (typeof localStorage === "undefined") {
            return false;
        }
        const key = this.clearStoreOnBootKey();
        const isSet = localStorage.getItem(key) === "1";
        if (isSet) {
            localStorage.removeItem(key);
        }
        return isSet;
    }

    async initAndOpenStore () {
        SvBootLoadingView.shared().setSubtitle("opening data store");

        this.setStore(this.defaultStore());
        this.store().setName(this.svType()); // name of the database

        const clearFirst = this.thisClass().consumeClearStoreOnBootFlag();

        if (clearFirst) {
            SvBootLoadingView.shared().setSubtitle("clearing local data");
            console.log(this.logPrefix(), "clear-on-boot requested (logout wipe): clearing object pool and blob pool");
            await this.clearStoreThenClose();
            await SvBlobPool.shared().asyncClear();
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
    /**
     * @description Records a boot timing mark if the SvBootPerf recorder is present.
     * @param {string} name - The mark name.
     * @category Performance Tracking
     */
    bootPerfMark (name) {
        if (SvGlobals.has("SvBootPerf")) {
            SvGlobals.get("SvBootPerf").mark(name);
        }
    }

    async openStore () {
        await this.store().promiseOpen();
        this.bootPerfMark("storeRecordsRead");
        try {
            const recordsMap = this.store().kvMap().map();
            let bytes = 0;
            recordsMap.forEach(v => {
                bytes += (typeof(v) === "string") ? v.length : (v.byteLength || 0);
            });
            console.log("[SvBootPerf] store records: " + recordsMap.size + " (~" + Math.round(bytes / 1024) + "KB)");
        } catch (e) {
            // diagnostic only — never break boot
        }
        this.store().rootOrIfAbsentFromClosure(() => {
            return this.modelClass().clone();
        });

        const currentRootObject = this.store().rootObject();

        const isCorrectModel = !Type.isNullOrUndefined(currentRootObject) && this.store().rootObject().isKindOf(this.modelClass());
        if (!isCorrectModel) {
            console.error("Model is not correct type: " + this.store().rootObject().thisClass().svType());
            if (this._attemptToResetStore === true) {
                throw new Error("Failed to open store with correct model after reset");
            }
            this._attemptToResetStore = true;
            await this.clearStoreThenClose();
            await this.openStore();
        }
        this.setModel(this.store().rootObject());
        this.model().setApp(this);
        this.bootPerfMark("storeOpened");
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
        this.bootPerfMark("modelSetup");
        await this.setupUserInterfaceIfNeeded();
        this.bootPerfMark("uiSetup");
        await this.appDidInit();
        this.bootPerfMark("appDidInit");

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
        this.addWeakTimeout(() => {
            this.scheduleMethodForNextCycle("afterAppDidInit");
        }, 0);
    }

    /**
     * @description Called after the app UI has initialized
     * @category Lifecycle
     */
    async afterAppDidInit () {
        // Time from the appDidInit mark to here is dominated by the resumed
        // reactive system performing the initial view sync (first real render).
        this.bootPerfMark("initialUiSync");
        this.model().afterAppDidInit();
        this.bootPerfMark("modelAfterInit");
        this.userInterface().afterAppDidInit();
        this.bootPerfMark("afterAppDidInit");
        this.didInitPromise().callResolveFunc(this);
        this.scheduleMethodForNextCycle("appInitCompleted");
    }

    appInitCompleted () {
        if (SvGlobals.has("SvBootPerf")) {
            SvGlobals.get("SvBootPerf").report();
        }
    }

    // --- user interface readiness ---

    /**
     * @description A promise that resolves with the userInterface once it is
     * ready to navigate — or, in a headless run, once the environment reports
     * there is no navigable UI (resolves with the headless UI, whose
     * providesNavigation() is false). Awaiting after readiness resolves
     * immediately. Use this instead of polling or retrying:
     *     const ui = await SvApp.shared().promiseUserInterfaceReady();
     *     if (ui.providesNavigation()) { ... }
     * @returns {Promise<SvUserInterface>}
     * @category Lifecycle
     */
    promiseUserInterfaceReady () {
        return this.userInterfaceReadyPromise();
    }

    /**
     * @description Called by the environment layer when the UI is ready to
     * navigate (browser: SvBrowserView after its root column is materialized;
     * headless: SvHeadlessUserInterface once init is done). Idempotent —
     * resolves the promise once.
     * @returns {SvApp}
     * @category Lifecycle
     */
    markUserInterfaceReady () {
        if (this._userInterfaceReadyMarked) {
            return this;
        }
        this._userInterfaceReadyMarked = true;
        this.userInterfaceReadyPromise().callResolveFunc(this.userInterface());
        return this;
    }

    // --- app lifecycle (routed from the environment layer) ---
    //
    // The environment (SvWebUserInterface for browsers, SvHeadlessUserInterface
    // for headless) translates its concrete signals — DOM events, process
    // signals — into these calls. SvApp fans them out to the model (and is the
    // natural place to notify other participants later). Keeping the routing
    // here means the model stays environment-agnostic.

    /**
     * @description Connectivity restored.
     * @category Lifecycle
     */
    onAppDidGoOnline () {
        this.model().onAppDidGoOnline();
        return this;
    }

    /**
     * @description Connectivity lost.
     * @category Lifecycle
     */
    onAppDidGoOffline () {
        this.model().onAppDidGoOffline();
        return this;
    }

    /**
     * @description The app is being backgrounded.
     * @category Lifecycle
     */
    onAppWillSuspend () {
        this.model().onAppWillSuspend();
        return this;
    }

    /**
     * @description The app is about to terminate.
     * @returns {Boolean} true to request that termination be blocked.
     * @category Lifecycle
     */
    onAppWillTerminate () {
        return this.model().onAppWillTerminate() === true;
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
        console.log(this.logPrefix(), s);
    }

    // General Cloud APIs
    // These are here so services which need them don't have to be tied directly to
    // the service that provide them. The app can override these to route them appropriately.
    // e.g. if an AI service requests takes a url to a public file, we can use this to upload
    // the file to the cloud and return the url, without tying it to specific cloud services.

    /*
     couldBlobStore
     - asyncStoreBlob(blob)
     - asyncGetBlob(hash)
     - asyncHasHash(hash)
     - asyncRemoveHash(hash)
     - asyncPublicUrlForHash(hash)

     cloudDocStore
     - asyncAtPathPut(path, json)
     - asyncAtPath(path)
     - asyncHasPath(path)
     - asyncRemoveAtPath(path)
     - asyncPublicUrlAtPath(path)

     folderAtPath(path) // asyncSet(name, value), asyncGet(name), asyncRemove(name), asyncHas(name)
    */

    cloudStorageService () {
        return SvFirebaseService.shared().firebaseStorageService();
    }

    cloudDocStore () {
        return SvFirebaseService.shared().firestoreDatabaseService();
    }

    async asyncPublicUrlForBlob (blob) {
        return await this.cloudStorageService().asyncPublicUrlForBlob(blob);
    }

    async asyncBlobForHash (hash) {
        const arrayBuffer = await this.cloudStorageService().asyncBlobForHash(hash);
        return arrayBuffer;
    }

}.initThisClass());
