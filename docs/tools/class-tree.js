#!/usr/bin/env node

/**
 * class-tree.js
 *
 * Generates ASCII tree diagrams of class hierarchies from JavaScript source code.
 *
 * Usage:
 *   node class-tree.js [path...] [options]
 *
 * Arguments:
 *   path - One or more directories to scan (default: strvct/source)
 *
 * Options:
 *   --filter <pattern> - Only show classes matching pattern (e.g., "Sv", "Uo")
 *   --depth <n>        - Maximum depth to display (default: unlimited)
 *   --full             - Show full paths instead of just class names
 *
 * Examples:
 *   node class-tree.js
 *   node class-tree.js ../source --filter Sv
 *   node class-tree.js ../../strvct/source ../../app --filter Uo --depth 3
 */

const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

// Configuration
const config = {
    scanPaths: [],
    filter: null,
    maxDepth: Infinity,
    showPaths: false
};

// Parse command line arguments
function parseArgs () {
    const args = process.argv.slice(2);
    let i = 0;

    while (i < args.length) {
        const arg = args[i];

        if (arg === '--filter' && args[i + 1]) {
            config.filter = args[i + 1];
            i += 2;
        } else if (arg === '--depth' && args[i + 1]) {
            config.maxDepth = parseInt(args[i + 1], 10);
            i += 2;
        } else if (arg === '--full') {
            config.showPaths = true;
            i += 1;
        } else if (!arg.startsWith('--')) {
            config.scanPaths.push(arg);
            i += 1;
        } else {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
        }
    }

    // Set default scan path if not provided
    if (config.scanPaths.length === 0) {
        config.scanPaths.push(path.join(__dirname, '../../source'));
    }
}

// Recursively find all .js files
async function findJsFiles (dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const jsFiles = [];

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            // Skip directories named "_unused", "node_modules", or "external-libs"
            if (file.name !== "_unused" && file.name !== "node_modules" && file.name !== "external-libs") {
                jsFiles.push(...await findJsFiles(fullPath));
            }
        } else if (file.name.endsWith('.js')) {
            jsFiles.push(fullPath);
        }
    }

    return jsFiles;
}

// Parse classes from JavaScript source
function parseClasses (content) {
    try {
        const ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
        const classes = [];

        walk.simple(ast, {
            ClassDeclaration (node) {
                classes.push({
                    name: node.id.name,
                    superClass: node.superClass ? node.superClass.name : null
                });
            },
            ClassExpression (node) {
                if (node.id) {
                    classes.push({
                        name: node.id.name,
                        superClass: node.superClass ? node.superClass.name : null
                    });
                }
            }
        });

        return classes;
    } catch (error) {
        // Silently skip files that can't be parsed
        return [];
    }
}

// Build class hierarchy tree structure
function buildHierarchy (classes, classFiles) {
    const classIndex = {};
    const hierarchy = {};
    const orphans = [];

    // Built-in types that might be used as base classes
    const builtInTypes = ['Object', 'Array', 'Boolean', 'Date', 'Error', 'Map', 'Set',
                         'String', 'Number', 'ArrayBuffer', 'Blob', 'Image', 'Range'];

    // Initialize built-in types
    for (const type of builtInTypes) {
        classIndex[type] = {
            name: type,
            children: [],
            superClass: null,
            isBuiltIn: true
        };
    }

    // First pass: create class objects
    for (const cls of classes) {
        if (cls && cls.name) {
            classIndex[cls.name] = {
                name: cls.name,
                children: [],
                superClass: cls.superClass || 'Object',
                filePath: classFiles[cls.name],
                isBuiltIn: false
            };
        }
    }

    // Second pass: build hierarchy
    for (const cls of classes) {
        if (cls && cls.name) {
            const classObj = classIndex[cls.name];
            const superClass = classObj.superClass;

            if (!superClass || superClass === 'Object' || !classIndex[superClass]) {
                // Root level class or extends Object
                if (!hierarchy[classObj.name]) {
                    hierarchy[classObj.name] = classObj;
                }
            } else if (classIndex[superClass]) {
                classIndex[superClass].children.push(classObj);
            }
        }
    }

    return { hierarchy, classIndex };
}

// Filter classes based on pattern
function filterHierarchy (node, pattern, depth = 0) {
    if (depth > config.maxDepth) {
        return null;
    }

    // If no filter, include everything
    if (!pattern) {
        return node;
    }

    // Check if this node or any children match
    const nodeMatches = node.name.includes(pattern);
    const filteredChildren = [];

    for (const child of node.children) {
        const filteredChild = filterHierarchy(child, pattern, depth + 1);
        if (filteredChild) {
            filteredChildren.push(filteredChild);
        }
    }

    // Include node if it matches or has matching children
    if (nodeMatches || filteredChildren.length > 0) {
        return {
            ...node,
            children: filteredChildren
        };
    }

    return null;
}

// Print ASCII tree
function printTree (node, prefix = '', isLast = true, depth = 0) {
    if (depth > config.maxDepth) {
        return '';
    }

    let output = '';
    const connector = isLast ? '└── ' : '├── ';
    const label = config.showPaths && node.filePath
        ? `${node.name} (${node.filePath})`
        : node.name;

    output += prefix + connector + label + '\n';

    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const sortedChildren = [...node.children].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    for (let i = 0; i < sortedChildren.length; i++) {
        const child = sortedChildren[i];
        const childIsLast = i === sortedChildren.length - 1;
        output += printTree(child, childPrefix, childIsLast, depth + 1);
    }

    return output;
}

// Main function
async function main () {
    parseArgs();

    console.log(`Scanning: ${config.scanPaths.join(', ')}`);
    if (config.filter) {
        console.log(`Filter: ${config.filter}`);
    }
    if (config.maxDepth !== Infinity) {
        console.log(`Max depth: ${config.maxDepth}`);
    }
    console.log('');

    try {
        const allClasses = [];
        const classFiles = {};
        let totalFiles = 0;

        // Scan all paths
        for (const scanPath of config.scanPaths) {
            const jsFiles = await findJsFiles(scanPath);
            totalFiles += jsFiles.length;

            // Parse all files from this path
            for (const file of jsFiles) {
                const content = await fs.readFile(file, 'utf-8');
                const classes = parseClasses(content);
                allClasses.push(...classes);

                // Store the relative path for each class
                classes.forEach(cls => {
                    classFiles[cls.name] = path.relative(scanPath, file).replace(/\\/g, '/');
                });
            }
        }

        console.log(`Found ${totalFiles} JavaScript files`);
        console.log(`Found ${allClasses.length} classes`);
        console.log('');

        // Build hierarchy
        const { hierarchy } = buildHierarchy(allClasses, classFiles);

        // Get root classes (sorted)
        const rootClasses = Object.values(hierarchy)
            .filter(node => !node.isBuiltIn)
            .sort((a, b) => a.name.localeCompare(b.name));

        // Apply filter if specified
        let filteredRoots = rootClasses;
        if (config.filter) {
            filteredRoots = rootClasses
                .map(node => filterHierarchy(node, config.filter))
                .filter(node => node !== null);
        }

        // Print trees
        if (filteredRoots.length === 0) {
            console.log('No classes found matching the criteria.');
        } else {
            for (let i = 0; i < filteredRoots.length; i++) {
                const node = filteredRoots[i];
                const isLast = i === filteredRoots.length - 1;
                process.stdout.write(printTree(node, '', isLast, 0));
            }
        }

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { findJsFiles, parseClasses, buildHierarchy, printTree };
