
String.prototype.between = function (s1, s2) {
    const i1 = this.indexOf(s1, 0);
    if (i1 === -1) {
        return null
    }

    const begin = i1 + s1.length
    const end = this.indexOf(s2, begin)

    if (end === -1) {
        return null
    }
    
    const result = this.substring(begin, end);
    return result
};


const path = require("path");
const fs = require("fs")


const css = fs.readFileSync("fonts.css",  "utf8")

const parts = css.split("@font-face")

const entries = []
parts.forEach((part) => {
    const family = part.between('font-family:"','"')
    const url = part.between("url(\"",'")')
    if (family) {
        entries.push({ family: family, url: url })
    }
    
})
console.log(entries[0])

// copy font files to fonts/family-name.ext

entries.forEach((entry) => {
    const fromPath = entry.url
    const ext = fromPath.split(".").pop()
    const toName = entry.family + "." + ext
    entry.toName = toName
    const toPath = "fonts/" + toName
    entry.toPath = toPath
    fs.copyFile(fromPath, toPath, (err) => {
        const msg = "error copying file '" + fromPath + "' to '" + toPath + "'"
        console.log("warning: " + msg)
        //throw new Error(msg)
    });
})

// make an imports file

const familyNames = entries.map(e => e.toName);
const namesString = familyNames.map(n => '"' + n + '"' ).join(",\n")
const importsString = "resourceLoader.pushRelativePaths([\n" + namesString + "\n]);"
fs.writeFileSync("fonts/_imports.json", importsString, "utf8")

