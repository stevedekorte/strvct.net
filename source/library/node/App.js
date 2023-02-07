"use strict";

/*
    App 
    
    A shared instance that represents the application. 

    Handles:
    - starting up persistence system
    - setting up user interface, if any

    For your application, create a subclass if needed.

*/

(class App extends BMStorableNode {
    
    // --- shared ---
    // We override sharedContext so all subclasses use the same shared value
    // and anyone can call App.shared() to access it

    static sharedContext () {
        return App
    }

    // --- store ---
    // we open store from app class since we might want to load app instance from store

    static loadAndRunShared () {
        this.defaultStore().setName(this.type()) // name of the database
        this.defaultStore().setDelegate(this).asyncOpen() 
    }

    static deleteDefaultStore () {
        this.defaultStore().deleteAll()
    }

    static onPoolOpenSuccess (aPool) {
        this.defaultStore().rootOrIfAbsentFromClosure(() => BMStorableNode.clone()) // create the root object
        //const app = this.defaultStore().rootObject().subnodeWithTitleIfAbsentInsertProto(this.type(), this)
        const app = this.clone()
        this.setShared(app)
        app.run()
    }

    static onPoolOpenFailure (aPool, error) {
        console.warn("ERROR: ", error)
        debugger;
        //ResourceLoaderPanel.shared().setError(errorMessage)
    }

    // ------

    initPrototypeSlots () {
        this.newSlot("name", "App")
        this.newSlot("version", [0, 0])
        this.newSlot("hasDoneAppInit", false)
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

    run () {
        if (!this.isBrowserCompatible()) {
            ResourceLoaderPanel.shared().setError("Sorry, this app only works on<br>Chrome, FireFox, and Brave browsers.")
            return this
        }

       this.setup()
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

    setup () {
        this.setupDocTheme()
        return this        
    }

    appDidInit () {
        this.showVersion()

        this.setHasDoneAppInit(true)
        this.postNoteNamed("appDidInit")

        if (this.runTests) {
		    this.runTests()
        }

        //Documentation.shared().show()
        //this.registerServiceWorker() // not working yet
    }
	
    documentBodyView () {
        return WebBrowserWindow.shared().documentBody()
    }

    mainWindow () {
        return Window
    }

    setName (aString) {
        this._name = aString
        this.setTitle(aString)
        WebBrowserWindow.shared().setTitle(aString)
        return this
    }
    
    // --- version ---

    versionsString () {
        return this.version().join(".")
    }

    showVersion () {
        console.log("Application '" + this.name() + "' version " + this.versionsString())
    }

    setupDocTheme () {
        const doc = DocumentBody.shared()
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")
        this.setupNormalTheme()
    }

    setupNormalDocTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        doc.setFontFamily("Helvetica")
        doc.setFontSizeAndLineHeight("15px")
        doc.setLetterSpacing("0.05em")
   }

}.initThisClass());
