#!/usr/bin/env node
// Regenerates docs/Reference/Modules/_index.md from the JS source tree.
// No npm deps — uses regex to pair each class declaration with its nearest
// preceding `@module` JSDoc tag.

const fs = require("fs");
const path = require("path");

const CLASS_DOC_PATH = "../../resources/class-doc/class_doc.html";
const OUTPUT_REL = "docs/Reference/Modules/_index.md";
const SUBTITLE = "Module hierarchy and file organization.";

// Modules page excludes external-libs and docs (unlike the class hierarchy).
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

const MODULE_RE = /@module\s+([^\s*]+)/g;
const CLASS_RE = /\bclass\s+([A-Za-z_$][\w$]*)(?:\s+extends\s+([A-Za-z_$][\w$]*))?\s*\{/g;

// For each class declaration, return { name, module } where module is the
// nearest preceding @module tag, or "globals" if none.
function parseFileClassModules (content) {
    const moduleTags = [];
    let m;
    MODULE_RE.lastIndex = 0;
    while ((m = MODULE_RE.exec(content)) !== null) {
        moduleTags.push({ index: m.index, name: m[1] });
    }
    const out = [];
    CLASS_RE.lastIndex = 0;
    while ((m = CLASS_RE.exec(content)) !== null) {
        const classIndex = m.index;
        let mod = "globals";
        for (let i = moduleTags.length - 1; i >= 0; i--) {
            if (moduleTags[i].index < classIndex) { mod = moduleTags[i].name; break; }
        }
        out.push({ name: m[1], module: mod });
    }
    return out;
}

function addToModule (modules, moduleName, item) {
    if (!modules.has(moduleName)) modules.set(moduleName, new Set());
    modules.get(moduleName).add(item);
}

function buildHierarchy (modules) {
    const hierarchy = {};
    for (const [moduleName, items] of modules) {
        const parts = moduleName.split(".");
        let current = hierarchy;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) current[part] = { name: part, children: {}, items: [] };
            if (i === parts.length - 1) current[part].items = Array.from(items);
            else current = current[part].children;
        }
    }
    return hierarchy;
}

function sortKey (name) {
    return name.startsWith("Sv") ? name.slice(2) : name;
}

function printHierarchy (hierarchy, classFiles, indent = "") {
    let out = "";
    const entries = Object.entries(hierarchy).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, mod] of entries) {
        out += `${indent}- ${name}\n`;
        if (mod.items && mod.items.length > 0) {
            const sortedItems = mod.items.slice().sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
            for (const item of sortedItems) {
                const p = classFiles[item];
                const link = p ? `[${item}](${composeClassDocUrl(p)})` : item;
                out += `${indent}  - ${link}\n`;
            }
        }
        if (Object.keys(mod.children).length > 0) {
            out += printHierarchy(mod.children, classFiles, indent + "  ");
        }
    }
    return out;
}

function main () {
    const root = process.argv[2] || ".";
    const rootAbs = path.resolve(root);

    const jsFiles = findJsFiles(rootAbs);
    const modules = new Map();
    const classFiles = {};

    for (const file of jsFiles) {
        const content = fs.readFileSync(file, "utf8");
        const classModules = parseFileClassModules(content);
        const rel = encodeURI(path.relative(rootAbs, file).replace(/\\/g, "/"));
        for (const { name, module } of classModules) {
            addToModule(modules, module, name);
            classFiles[name] = rel;
        }
    }

    const hierarchy = buildHierarchy(modules);
    const body = printHierarchy(hierarchy, classFiles);
    const content = `# Modules\n\n${SUBTITLE}\n\n${body}`;

    const outPath = path.join(rootAbs, OUTPUT_REL);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
    console.log(`wrote ${OUTPUT_REL}`);
}

main();
