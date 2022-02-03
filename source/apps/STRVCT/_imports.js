"use strict";

resourceLoader.pushRelativePaths([
    "StrvctApp.js",
])

resourceLoader.pushDoneCallback( () => {
    StrvctApp.loadAndRunShared()
    //StrvctApp.shared().run()
})
