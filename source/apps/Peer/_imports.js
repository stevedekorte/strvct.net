"use strict";

resourceLoader.pushRelativePaths([
    "network/_imports.js",
    "PeerApp.js",
])

resourceLoader.pushDoneCallback( () => {
    PeerApp.loadAndRunShared()
    //PeerApp.shared().run()
})
