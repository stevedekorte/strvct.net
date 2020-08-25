"use strict"

ResourceLoader.pushRelativePaths([
    "network/_imports.js",
    "PeerApp.js",
])

ResourceLoader.pushDoneCallback( () => {
    PeerApp.loadAndRunShared()
    //PeerApp.shared().run()
})
