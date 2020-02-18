"use strict"

ResourceLoader.pushRelativePaths([
    "STRVCT.js",
])

ResourceLoader.pushDoneCallback( () => {
    console.log("STRVCT.shared().run() <<<<<<<<<<<<<<<<<<")
    STRVCT.shared().run()
})
