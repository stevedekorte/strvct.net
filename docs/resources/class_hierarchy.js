#!/usr/bin/env node
// Regenerates docs/Reference/Classes/_index.md from the JS source tree.
// No npm deps — parses `class Name extends Parent` and `(class Name extends Parent`
// forms with a regex. Matches the output format expected by the docs site.

const fs = require("fs");
const path = require("path");

const CLASS_DOC_PATH = "../../resources/class-doc/class_doc.html";
const OUTPUT_REL = "docs/Reference/Classes/_index.md";
const SUBTITLE = "Complete class inheritance hierarchy.";

// Built-in types to render as grouping nodes under Object.
const BUILT_IN_TYPES = [
    "Array", "Boolean", "Date", "Error", "Map", "Set",
    "String", "Number", "ArrayBuffer", "Blob", "Image", "Range"
];

const EXCLUDE_DIRS = new Set(["_unused", "external-libs", "docs", "node_modules", "build", ".git"]);

function ensureLeadingSlash (p) {
    return p.startsWith("/") ? p : "/" + p;
}

function composeClassDocUrl (relPath) {
    return `${CLASS_DOC_PATH}?path=${encodeURIComponent(ensureLeadingSlash(relPath))}`;
}

function findJsFiles (dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!EXCLUDE_DIRS.has(entry.name)) findJsFiles(full, out);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            out.push(full);
        }
    }
    return out;
}

// Matches `class Name {`, `class Name extends Parent {`, `(class Name extends Parent{`.
// Group 1: class name. Group 2: superclass name (may be undefined).
const CLASS_RE = /\bclass\s+([A-Za-z_$][\w$]*)(?:\s+extends\s+([A-Za-z_$][\w$]*))?\s*\{/g;

function parseClasses (content) {
    const classes = [];
    let m;
    CLASS_RE.lastIndex = 0;
    while ((m = CLASS_RE.exec(content)) !== null) {
        classes.push({ name: m[1], superClass: m[2] || null });
    }
    return classes;
}

function buildHierarchy (classes) {
    const classIndex = {};
    const hierarchy = { Object: { name: "Object", children: {}, superClass: null } };

    for (const t of BUILT_IN_TYPES) {
        const obj = { name: t, children: {}, superClass: "Object" };
        hierarchy.Object.children[t] = obj;
        classIndex[t] = obj;
    }

    for (const c of classes) {
        if (!classIndex[c.name]) {
            classIndex[c.name] = { name: c.name, children: {}, superClass: c.superClass || "Object" };
        }
    }

    for (const c of classes) {
        const obj = classIndex[c.name];
        const parent = obj.superClass;
        if (parent === "Object") {
            hierarchy.Object.children[c.name] = obj;
        } else if (classIndex[parent]) {
            classIndex[parent].children[c.name] = obj;
        } else {
            // Unknown parent — place under Object and warn.
            console.warn(`Superclass ${parent} not found for ${c.name}. Placing under Object.`);
            hierarchy.Object.children[c.name] = obj;
        }
    }

    return hierarchy;
}

function sortKey (name) {
    // Match existing output ordering: ignore a leading Sv prefix for sort,
    // but keep the prefix in the displayed name.
    return name.startsWith("Sv") ? name.slice(2) : name;
}

function printHierarchy (hierarchy, classFiles, indent = "", isRoot = true) {
    let out = "";
    const entries = Object.entries(hierarchy);
    entries.sort(([a], [b]) => {
        if (a === "Object") return -1;
        if (b === "Object") return 1;
        return sortKey(a).localeCompare(sortKey(b));
    });
    for (const [name, cls] of entries) {
        const p = classFiles[name];
        const link = p ? `[${name}](${composeClassDocUrl(p)})` : name;
        if (isRoot && name !== "Object") {
            out += `${indent}- Object\n`;
            out += `${indent}  - ${link}\n`;
        } else {
            out += `${indent}- ${link}\n`;
        }
        if (Object.keys(cls.children).length > 0) {
            const nextIndent = isRoot && name !== "Object" ? indent + "    " : indent + "  ";
            out += printHierarchy(cls.children, classFiles, nextIndent, false);
        }
    }
    return out;
}

function main () {
    const root = process.argv[2] || ".";
    const rootAbs = path.resolve(root);

    const jsFiles = findJsFiles(rootAbs);
    const allClasses = [];
    const classFiles = {};

    for (const file of jsFiles) {
        const content = fs.readFileSync(file, "utf8");
        const classes = parseClasses(content);
        const rel = path.relative(rootAbs, file).replace(/\\/g, "/");
        for (const c of classes) {
            allClasses.push(c);
            classFiles[c.name] = encodeURI(rel);
        }
    }

    const hierarchy = buildHierarchy(allClasses);
    const body = printHierarchy(hierarchy, classFiles);
    const content = `# Classes\n\n${SUBTITLE}\n\n${body}`;

    const outPath = path.join(rootAbs, OUTPUT_REL);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
    console.log(`wrote ${OUTPUT_REL}`);
}

main();
