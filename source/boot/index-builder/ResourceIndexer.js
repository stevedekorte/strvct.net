/**
 * @module IndexBuilder
 * @class ResourceIndexer
 * @extends Object
 * @classdesc Command line script to recursively walk directories and
    generate a _imports.json file. These files are used by
    ImportsIndexer to build and index and zip file containing
    resources. 

    Generally, this is only used for data resources like:
    - fonts
    - images
    - svg icons
    - sounds
    - json data files 
    - etc

    which don't need to be loaded immediately, and whose load order 
    isn't critical (unlike load&eval on JS source files).

*/

console.log("running ResourceIndexer.js");

const ResourcesFolder = require('./ResourcesFolder.js');
console.log("ResourcesFolder:", ResourcesFolder);
const process = require('process');


class ResourceIndexer extends Object {
    constructor() {
        super();
    }

    /**
     * @method run
     * @description Main entry point for the script.
     * @returns {void}
     */

    run() {
        const args = process.argv;
        args.shift(); // remove node executable path
        args.shift(); // remove path to this script

        // remaining paths are arguments

        args.forEach(dirPathCommandLineArg => {
            const folder = new ResourcesFolder();
            folder.setPath(dirPathCommandLineArg);
            folder.recursivelyCreateImports();
        });

        //process.exitCode = 0 // vscode wants an explicit exit code for prelaunch tasks
        //process.exit(); // this may stop process before file ops complete
    }
}

new ResourceIndexer().run();
