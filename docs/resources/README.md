# Auto Documentation System

The documentation for this project is automatically constructed by parsing the source files.

The source files of this project is formatted with jsdoc comments.
This allows us to automatically extract them to build reference documentation.

## Top level

The root index.html file contains code to open .md files and format them as html.
It will automatically convert the md style links to references to itself with a path parameter added.
For example, navigating to the Project Overview page will open:

    http://localhost:8001/index.html?path=docs%2FProjectOverview.md

## Module and Class Hierarchy

Running:

node ./docs/resources/class_hierarchy.js

Will find all the .js files in the project excluding any folders named "docs", "external-libs", or "\_unused",
extract their class name and parent class name, and use this to construct the markdown files:

./docs/reference/class_hierarchy.md
./docs/reference/module_hierarchy.md (how the classes are organized by the project's folder structure)

## Class Level

In the class_hierarchy.md file produced by the last step, each class contains link to:

./docs/resources/class-doc/class-doc.html?path={path to js file}

and clicking on that will open class-doc.html which will load and parse the referenced class file at runtime
using the parser found in:

./docs/resources/class-doc/class_doc_parser.js

and apply the CSS style found in that same folder.

## Testing

Since class-doc.html needs to load the related source file (and browsers don't allow dynamic loads of file:// files),
you'll need to run a web server locally (with strvct as it's root folder) to test it. For example:

    node local-web-server/main.js --port 8001

and in your browser, open:

    http://localhost:8001/index.html
