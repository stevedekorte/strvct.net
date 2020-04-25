"use strict"

ResourceLoader.pushRelativePaths([
    "d3/_imports.js",
    "StatsApp.js",
    "StatsResource.js",
    "table/_imports.js",
    //"cache/_imports.js",
    "blobs/_imports.js",
    "resource/_imports.js",
    "datasources/_imports.js",
    "mapping/_imports.js",
    "charting/_imports.js",
])

ResourceLoader.pushDoneCallback( () => {
    StatsApp.loadAndRunShared()
})
