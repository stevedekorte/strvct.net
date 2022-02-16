
require("./IndexBuilder.js")

console.log("root __dirname = " + __dirname)
console.log("root current working directory = " + process.cwd())

new IndexBuilder().run() // IMPORTANT: should run from root site folder
