"use strict";

/*
    App 
    
    A shared instance that represents the application. For your application, 
    create a subclass called App and implement a custom setup method.

    Handles starting up persistence system.

*/

(class App extends BMStorableNode {
    
    static loadAndRunShared () {
        this.defaultStore().setName(this.type()) // name of the database
        this.defaultStore().setDelegate(this).asyncOpen() 
    }

    static deleteDefaultStore () {
        this.defaultStore().deleteAll()
    }

    static onPoolOpenSuccess (aPool) {
        //debugger;
        this.defaultStore().rootOrIfAbsentFromClosure(() => BMStorableNode.clone()) // create the root object
        //const app = this.defaultStore().rootObject().subnodeWithTitleIfAbsentInsertProto(this.type(), this)
        const app = this.clone()
        this.setShared(app)
        app.run()
    }

    static onPoolOpenFailure (aPool, error) {
        console.log("ERROR: ", error)
        debugger;
        //ResourceLoaderPanel.shared().setError(errorMessage)
    }

    initPrototypeSlots () {
        this.newSlot("name", "App")
        this.newSlot("version", [0, 0])
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
        return this        
    }

    appDidInit () {
        this.showVersion()

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

    setupTheme () {
        const doc = DocumentBody.shared()
        doc.setColor("#f4f4ec")
        doc.setBackgroundColor("rgb(25, 25, 25)")

        this.setupNormalTheme()
        //this.setupVectorTheme()
    }

    setupNormalTheme () {
        const doc = DocumentBody.shared()
        doc.setBackgroundColor("#191919")
        //doc.setFontFamily("Sans-Serif")
        //doc.setFontFamily("Electrolize-Regular")
        doc.setFontFamily("Helvetica")
        //doc.setFontWeight("bold")
        //doc.setFontFamily("Helvetica Neue")
        //doc.setFontFamily("San Francisco Display")
        //doc.setFontFamily("PublicSans Light")
        //doc.setFontFamily("OpenSans Regular")
        doc.setFontSizeAndLineHeight("15px")
        doc.setLetterSpacing("0.05em")
        //doc.setTextTransform("uppercase")
   }

}.initThisClass());
