# Auto Documentation System

The documentation for this project is automatically constructed by parsing the source files.

The source files of this project is formatted with jsdoc comments.
This allows us to automatically extract them to build reference documentation.

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
you'll need to run a web server locally (with strvct as it's root folder) to test it.
