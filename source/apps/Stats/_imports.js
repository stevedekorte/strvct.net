"use strict"

ResourceLoader.pushRelativePaths([
    "StatsApp.js",
    "StatsResource.js",
    "table/_imports.js",
    "cache/_imports.js",
    "blobs/_imports.js",
    "resource/_imports.js",
    "datasources/_imports.js",
])

ResourceLoader.pushDoneCallback( () => {
    StatsApp.loadAndRunShared()
})
