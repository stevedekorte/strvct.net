#!/usr/bin/env node

/**
 * rename-classes.js — codemod for strvct class renames.
 *
 * Reads ../../ClassRenames.json and applies [oldName, newName] tuples across
 * the source trees. Updates code identifiers, string literals, filenames, and
 * _imports.json entries.
 *
 * Usage:
 *   node rename-classes.js --dry-run
 *   node rename-classes.js --dry-run --only=SvRzMsg,SvRzMsgs
 *   node rename-classes.js --dry-run --cluster=Rz
 *   node rename-classes.js --apply --cluster=Rz
 *
 * Options:
 *   --dry-run       Print what would change; don't write anything. (default)
 *   --apply         Actually modify files.
 *   --only=A,B,C    Only process these class names (old names).
 *   --cluster=Rz    Only process classes whose old name starts with this prefix.
 *   --verbose       Print every match, not just per-file summaries.
 *
 * Paths walked (relative to repo root):
 *   strvct/source/
 *   app/           (if present, for cross-repo references)
 *
 * Skipped:
 *   _unused/, external-libs/, node_modules/, build/, .git/,
 *   resources/ (generated CAM bundles), npm-pkg/,
 *   llms.txt, llms-full.txt, sitemap.xml, class-hierarchy-tree.txt,
 *   any generated index.html under docs/, ClassRenames.json, ClassesToRename.txt.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, renameSync, existsSync } from "node:fs";
import { join, resolve, dirname, basename, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const strvctRoot = resolve(__dirname, "../..");                  // strvct/
const siteRoot = resolve(strvctRoot, "..");                      // site/
const appRoot = resolve(siteRoot, "app");                        // site/app/

const SKIP_DIRS = new Set([
    "_unused", "-unused", "external-libs", "node_modules", "build",
    ".git", "resources", "npm-pkg"
]);

const SKIP_FILENAMES = new Set([
    "llms.txt", "llms-full.txt", "sitemap.xml",
    "class-hierarchy-tree.txt", "ClassRenames.json", "ClassesToRename.txt"
]);

const INCLUDE_EXTENSIONS = new Set([".js", ".json", ".md", ".txt"]);

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags = {
    dryRun: true,
    apply: false,
    only: null,
    cluster: null,
    verbose: false
};

for (const arg of args) {
    if (arg === "--apply") { flags.apply = true; flags.dryRun = false; }
    else if (arg === "--dry-run") { flags.dryRun = true; flags.apply = false; }
    else if (arg === "--verbose") { flags.verbose = true; }
    else if (arg.startsWith("--only=")) { flags.only = new Set(arg.slice(7).split(",")); }
    else if (arg.startsWith("--cluster=")) { flags.cluster = arg.slice(10); }
    else { console.error(`Unknown flag: ${arg}`); process.exit(1); }
}

// ---------------------------------------------------------------------------
// Load and filter renames
// ---------------------------------------------------------------------------

const allTuples = JSON.parse(readFileSync(join(strvctRoot, "ClassRenames.json"), "utf-8"));

const tuples = allTuples.filter(([oldName, _newName]) => {
    if (flags.only && !flags.only.has(oldName)) return false;
    if (flags.cluster && !oldName.startsWith(flags.cluster)) return false;
    return true;
});

if (tuples.length === 0) {
    console.error("No renames match the filter.");
    process.exit(1);
}

console.log(`Mode: ${flags.apply ? "APPLY" : "DRY RUN"}`);
console.log(`Renames to apply: ${tuples.length} of ${allTuples.length}`);
if (flags.cluster) console.log(`Cluster filter: ${flags.cluster}*`);
if (flags.only) console.log(`Only: ${[...flags.only].join(", ")}`);
console.log();

// Build regex patterns for efficient scanning.
// We use two passes to handle different match contexts:
//   1. identRegex — normal identifiers. `_` is treated as a boundary so that
//      category names like `OldName_parsing` match the `OldName` prefix.
//   2. urlRegex — URL-encoded filenames like `%2FOldName.js`. We deliberately
//      do NOT rewrite directory segments (`%2FOldName%2F`) because this codemod
//      renames files, not directories — rewriting directory segments would
//      produce broken paths in docs links.
const renameMap = new Map(tuples);
const alternation = tuples.map(([o]) => o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const identRegex = new RegExp(`(?<![A-Za-z0-9$])(${alternation})(?![A-Za-z0-9$])`, "g");
const urlRegex = new RegExp(`(?<=%2F)(${alternation})(?=\\.js\\b)`, "g");

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

function* walk (dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            yield* walk(join(dir, entry.name));
        } else if (entry.isFile()) {
            yield join(dir, entry.name);
        }
    }
}

function shouldProcess (path) {
    const name = basename(path);
    if (SKIP_FILENAMES.has(name)) return false;

    // Skip generated doc HTML (regenerated by static-gen.js)
    if (name === "index.html" && path.includes(sep + "docs" + sep)) return false;

    // Skip Reference docs — they contain a mix of class-link URLs and
    // plain directory-name labels in a tree structure. We can't safely
    // distinguish between the two with regex. These docs should be
    // regenerated or hand-edited after renames complete.
    if (path.includes(sep + "docs" + sep + "Reference" + sep)) return false;

    const ext = path.slice(path.lastIndexOf("."));
    if (!INCLUDE_EXTENSIONS.has(ext)) return false;

    return true;
}

// ---------------------------------------------------------------------------
// Content rewriter
// ---------------------------------------------------------------------------

function rewriteContent (text) {
    let totalMatches = 0;
    const matches = []; // [{ oldName, line, text }]

    const apply = (input, regex) => input.replace(regex, (match, oldName, offset) => {
        const newName = renameMap.get(oldName);
        if (!newName) return match;

        const before = input.slice(0, offset);
        const lineNum = before.split("\n").length;
        const lineStart = before.lastIndexOf("\n") + 1;
        const lineEnd = input.indexOf("\n", offset);
        const lineText = input.slice(lineStart, lineEnd === -1 ? input.length : lineEnd);

        matches.push({ oldName, newName, line: lineNum, text: lineText.trim() });
        totalMatches += 1;
        return newName;
    });

    // Apply identifier pass first, then URL-encoded path pass on the result.
    let newText = apply(text, identRegex);
    newText = apply(newText, urlRegex);

    return { newText, matches, totalMatches };
}

// ---------------------------------------------------------------------------
// Filename rewriter: map Old.js / Old_category.js → New.js / NewCategory.js
// Uses basename match only (no partial renames).
// ---------------------------------------------------------------------------

function computeFileRename (path) {
    const base = basename(path);
    const dotIdx = base.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const stem = base.slice(0, dotIdx);
    const ext = base.slice(dotIdx);

    // Exact match: OldName.js → NewName.js
    if (renameMap.has(stem)) {
        const newStem = renameMap.get(stem);
        return { oldPath: path, newPath: join(dirname(path), newStem + ext) };
    }

    // Category match: OldName_suffix.js → NewName_suffix.js
    const underscoreIdx = stem.indexOf("_");
    if (underscoreIdx > 0) {
        const basePart = stem.slice(0, underscoreIdx);
        const suffix = stem.slice(underscoreIdx); // includes leading "_"
        if (renameMap.has(basePart)) {
            const newStem = renameMap.get(basePart) + suffix;
            return { oldPath: path, newPath: join(dirname(path), newStem + ext) };
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const roots = [
    join(strvctRoot, "source"),
    existsSync(appRoot) ? appRoot : null
].filter(Boolean);

// Also walk strvct's own doc sources (markdown) and webserver
roots.push(join(strvctRoot, "docs"));
roots.push(join(strvctRoot, "webserver"));

const stats = {
    filesScanned: 0,
    filesChanged: 0,
    totalMatches: 0,
    filesRenamed: 0
};

const pendingContentWrites = []; // [{ path, newText, matches }]
const pendingFileRenames = [];   // [{ oldPath, newPath }]

for (const root of roots) {
    if (!existsSync(root)) continue;

    for (const path of walk(root)) {
        if (!shouldProcess(path)) continue;
        stats.filesScanned += 1;

        const text = readFileSync(path, "utf-8");
        const { newText, matches, totalMatches } = rewriteContent(text);

        if (totalMatches > 0) {
            stats.filesChanged += 1;
            stats.totalMatches += totalMatches;
            pendingContentWrites.push({ path, newText, matches });
        }

        const rename = computeFileRename(path);
        if (rename) {
            stats.filesRenamed += 1;
            pendingFileRenames.push(rename);
        }
    }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log("=== File content changes ===");
for (const { path, matches } of pendingContentWrites) {
    const rel = relative(siteRoot, path);
    const byName = new Map();
    for (const m of matches) {
        if (!byName.has(m.oldName)) byName.set(m.oldName, 0);
        byName.set(m.oldName, byName.get(m.oldName) + 1);
    }
    const summary = [...byName.entries()]
        .map(([n, c]) => `${n}×${c}`).join(", ");
    console.log(`  ${rel}  (${matches.length} match${matches.length === 1 ? "" : "es"}: ${summary})`);

    if (flags.verbose) {
        for (const m of matches) {
            console.log(`    line ${m.line}: ${m.oldName} → ${m.newName}`);
            console.log(`      ${m.text}`);
        }
    }
}

console.log();
console.log("=== File renames ===");
for (const { oldPath, newPath } of pendingFileRenames) {
    console.log(`  ${relative(siteRoot, oldPath)} → ${relative(siteRoot, newPath)}`);
}

console.log();
console.log("=== Summary ===");
console.log(`  Files scanned: ${stats.filesScanned}`);
console.log(`  Files with content changes: ${stats.filesChanged}`);
console.log(`  Total identifier/string matches: ${stats.totalMatches}`);
console.log(`  Files to rename: ${stats.filesRenamed}`);

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

if (flags.apply) {
    console.log();
    console.log("Applying changes...");

    for (const { path, newText } of pendingContentWrites) {
        writeFileSync(path, newText, "utf-8");
    }
    for (const { oldPath, newPath } of pendingFileRenames) {
        renameSync(oldPath, newPath);
    }

    console.log("Done. Review with `git status` and `git diff`.");
    console.log("Remember to run `just class-tree` and `node style/static-gen.js` afterwards.");
} else {
    console.log();
    console.log("Dry run complete. Re-run with --apply to make changes.");
}
