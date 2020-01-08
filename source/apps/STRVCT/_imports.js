"use strict"

ResourceLoader.pushRelativePaths([
    "STRVCT.js",
])

ResourceLoader.pushDoneCallback( () => {
    STRVCT.shared().run()
})
