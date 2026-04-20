#!/usr/bin/env node
// Regenerates docs/Reference/Protocols/_index.md from the JS source tree.
// No npm deps. Finds classes whose declared superclass is `Protocol`, groups
// them by their `@module` tag, and attaches implementors listed via
// `@implements` JSDoc tags on other classes.

const fs = require("fs");
const path = require("path");

const CLASS_DOC_PATH = "../../resources/class-doc/class_doc.html";
const OUTPUT_REL = "docs/Reference/Protocols/_index.md";
const SUBTITLE = "Protocol definitions and implementations.";

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

// Matches the JSDoc comment block that immediately precedes a class declaration.
// Group 1: the comment body (between /** and */). Group 2: class name. Group 3: superclass name.
const CLASS_WITH_COMMENT_RE = /\/\*\*([\s\S]*?)\*\/\s*(?:\(\s*)?class\s+([A-Za-z_$][\w$]*)\s+extends\s+([A-Za-z_$][\w$]*)/g;
const MODULE_RE = /@module\s+([^\s*]+)/g;
const CLASS_RE = /\bclass\s+([A-Za-z_$][\w$]*)(?:\s+extends\s+([A-Za-z_$][\w$]*))?\s*\{/g;
const IMPLEMENTS_RE = /@implements\s+\{?([A-Za-z_$][\w$]*)\}?/g;

// Return all @module positions in a file.
function findModuleTags (content) {
    const tags = [];
    let m;
    MODULE_RE.lastIndex = 0;
    while ((m = MODULE_RE.exec(content)) !== null) {
        tags.push({ index: m.index, name: m[1] });
    }
    return tags;
}

function moduleForOffset (moduleTags, offset) {
    for (let i = moduleTags.length - 1; i >= 0; i--) {
        if (moduleTags[i].index < offset) return moduleTags[i].name;
    }
    return "globals";
}

function parseFile (content) {
    const moduleTags = findModuleTags(content);
    const protocols = []; // [{ name, module }]
    const implementedBy = new Map(); // protocolName -> Set of class names

    // Walk all class declarations.
    CLASS_RE.lastIndex = 0;
    let m;
    while ((m = CLASS_RE.exec(content)) !== null) {
        const className = m[1];
        const superClass = m[2];
        const classIndex = m.index;
        const mod = moduleForOffset(moduleTags, classIndex);

        if (superClass === "Protocol" && className !== "Protocol") {
            protocols.push({ name: className, module: mod });
        }

        // Look at the JSDoc block (if any) immediately preceding this class for @implements tags.
        const before = content.slice(Math.max(0, classIndex - 2000), classIndex);
        const lastDocStart = before.lastIndexOf("/**");
        const lastDocEnd = before.lastIndexOf("*/");
        if (lastDocStart !== -1 && lastDocEnd !== -1 && lastDocEnd > lastDocStart) {
            const commentBody = before.slice(lastDocStart, lastDocEnd);
            let im;
            IMPLEMENTS_RE.lastIndex = 0;
            while ((im = IMPLEMENTS_RE.exec(commentBody)) !== null) {
                const proto = im[1];
                if (!implementedBy.has(proto)) implementedBy.set(proto, new Set());
                implementedBy.get(proto).add(className);
            }
        }
    }

    return { protocols, implementedBy };
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

function printHierarchy (hierarchy, protocolFiles, implementors, indent = "") {
    let out = "";
    const entries = Object.entries(hierarchy).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, mod] of entries) {
        out += `${indent}- ${name}\n`;
        if (mod.items && mod.items.length > 0) {
            const sortedItems = mod.items.slice().sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
            for (const item of sortedItems) {
                if (item === "Protocol") continue;
                const p = protocolFiles[item];
                const link = p ? `[${item}](${composeClassDocUrl(p)})` : item;
                const impl = implementors.get(item);
                const implStr = impl && impl.size > 0 ? ` (implemented by: ${Array.from(impl).join(", ")})` : "";
                out += `${indent}  - ${link}${implStr}\n`;
            }
        }
        if (Object.keys(mod.children).length > 0) {
            out += printHierarchy(mod.children, protocolFiles, implementors, indent + "  ");
        }
    }
    return out;
}

function main () {
    const root = process.argv[2] || ".";
    const rootAbs = path.resolve(root);

    const jsFiles = findJsFiles(rootAbs);
    const modules = new Map();
    const protocolFiles = {};
    const implementors = new Map();

    for (const file of jsFiles) {
        const content = fs.readFileSync(file, "utf8");
        const { protocols, implementedBy } = parseFile(content);
        const rel = encodeURI(path.relative(rootAbs, file).replace(/\\/g, "/"));
        for (const { name, module } of protocols) {
            addToModule(modules, module, name);
            protocolFiles[name] = rel;
        }
        for (const [proto, classes] of implementedBy) {
            if (!implementors.has(proto)) implementors.set(proto, new Set());
            for (const c of classes) implementors.get(proto).add(c);
        }
    }

    const hierarchy = buildHierarchy(modules);
    const body = printHierarchy(hierarchy, protocolFiles, implementors);
    const content = `# Protocols\n\n${SUBTITLE}\n\n${body}`;

    const outPath = path.join(rootAbs, OUTPUT_REL);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
    console.log(`wrote ${OUTPUT_REL}`);
}

main();
