"use strict";

const files = [
    "../getGlobalThis.js",
    "./ResourceLoaderPanel.js",
    "./ResourceLoader.js",
]

const loadNextFile = function () {
    const nextFile = files.shift()

    if (nextFile) {
        const path = "./" + nextFile
        //console.log("importing '" + path + "'")
        import(path).then((module) => {
            loadNextFile()
        })
    }
}

window.onload = () => {
    loadNextFile()
}
