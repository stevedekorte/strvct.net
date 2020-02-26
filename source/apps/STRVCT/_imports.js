"use strict"

ResourceLoader.pushRelativePaths([
    "StrvctApp.js",
])

ResourceLoader.pushDoneCallback( () => {
    StrvctApp.loadAndRunShared()
    //StrvctApp.shared().run()
})
