#!/usr/bin/env node

/**
 * Static HTML generator for the STRVCT layout engine.
 *
 * Walks the site tree, finds pages that use the layout engine (index.html with
 * a sibling _index.json or _index.md), and injects pre-rendered HTML into each
 * page. This makes content readable by AI crawlers and other clients that don't
 * execute JavaScript.
 *
 * The browser-side layout.js still runs and overwrites the static content on
 * load, so the two paths produce identical results.
 *
 * Usage:  node strvct/style/static-gen.js
 * Run from the site root (Servers/GameServer/site/).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Layout engine imports — same modules the browser uses
import { ContentBase } from "./layout/ContentBase.js";
import { ContentText } from "./layout/ContentText.js";
import { ContentCards } from "./layout/ContentCards.js";
import { ContentKeyValue } from "./layout/ContentKeyValue.js";
import { ContentUnorderedList } from "./layout/ContentUnorderedList.js";
import { ContentOrderedList } from "./layout/ContentOrderedList.js";
import { ContentTable } from "./layout/ContentTable.js";
import { ContentImage } from "./layout/ContentImage.js";
import { ContentTimeline } from "./layout/ContentTimeline.js";
import { ContentToc } from "./layout/ContentToc.js";
import { PageIndex } from "./layout/PageIndex.js";

// Register content types (mirrors layout.js)
ContentBase.typeMap = {
    ContentText,
    ContentCards,
    ContentKeyValue,
    ContentUnorderedList,
    ContentOrderedList,
    ContentTable,
    ContentImage,
    ContentTimeline,
    ContentToc,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(__dirname, ".."); // strvct root

const skipDirs = new Set([
    "node_modules", "external-libs", "source", "build",
    "npm-pkg", "webserver", "resources",
]);

// ---------------------------------------------------------------------------
// Filesystem-backed fetch that resolves URLs relative to a page directory
// ---------------------------------------------------------------------------

function createFetchFn (pageDir) {
    return async function (url) {
        const decoded = decodeURIComponent(url);
        const filePath = resolve(pageDir, decoded);
        try {
            const content = readFileSync(filePath, "utf-8");
            return {
                ok: true,
                status: 200,
                json: async () => JSON.parse(content),
                text: async () => content,
            };
        } catch {
            return { ok: false, status: 404 };
        }
    };
}

// ---------------------------------------------------------------------------
// Directory walker — finds pages that have both index.html and _index content
// ---------------------------------------------------------------------------

function findLayoutPages (dir) {
    const pages = [];
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return pages;
    }

    const hasIndex = entries.some(e => e.name === "index.html" && e.isFile());
    const hasContent = entries.some(e =>
        (e.name === "_index.json" || e.name === "_index.md") && e.isFile()
    );

    if (hasIndex && hasContent) {
        pages.push(dir);
    }

    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && !skipDirs.has(entry.name)) {
            pages.push(...findLayoutPages(join(dir, entry.name)));
        }
    }

    return pages;
}

// ---------------------------------------------------------------------------
// Generate static HTML for a single page
// ---------------------------------------------------------------------------

async function generatePage (pageDir) {
    const relPath = relative(siteRoot, pageDir) || ".";
    const pathSegments = relPath === "."
        ? []
        : relPath.split(sep).filter(s => s.length > 0);

    ContentBase.setFetchFn(createFetchFn(pageDir));

    const context = {
        isRoot: () => pageDir === siteRoot,
        pathSegments: () => pathSegments,
        urlParam: () => null,
    };

    const page = new PageIndex();
    await page.loadPage(context);

    if (!page.json) {
        console.log(`  skipped (no content): ${relPath}`);
        return;
    }

    const pageHtml = page.computePageHtml();
    const docTitle = page.computeDocumentTitle();

    const pageClasses = ["page", "loaded"];
    if (page.json.pageLayout) {
        pageClasses.push(`page-${page.json.pageLayout}`);
    }

    // Read existing HTML template
    const htmlPath = join(pageDir, "index.html");
    let html = readFileSync(htmlPath, "utf-8");

    // Replace the .page div contents (greedy match to find the last </div> before <script>)
    html = html.replace(
        /(<body>\s*)<div class="page[^"]*"[^>]*>[\s\S]*<\/div>(\s*<script)/,
        `$1<div class="${pageClasses.join(" ")}">${pageHtml}</div>$2`
    );

    // Add or update <title> tag
    if (/<title>/.test(html)) {
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${docTitle}</title>`);
    } else {
        html = html.replace("</head>", `  <title>${docTitle}</title>\n</head>`);
    }

    writeFileSync(htmlPath, html);
    console.log(`  generated: ${relPath}`);
}

// ---------------------------------------------------------------------------
// Sitemap generator
// ---------------------------------------------------------------------------

function generateSitemap (pages, baseUrl) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const pageDir of pages) {
        const relPath = relative(siteRoot, pageDir);
        const urlPath = relPath
            ? relPath.split(sep).map(s => encodeURIComponent(s)).join("/") + "/"
            : "";
        xml += `  <url><loc>${baseUrl}${urlPath}</loc></url>\n`;
    }

    xml += "</urlset>\n";
    return xml;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const SITE_URL = "https://strvct.net/";

async function main () {
    const pages = findLayoutPages(siteRoot);
    console.log(`Static gen: found ${pages.length} layout pages under ${siteRoot}`);

    for (const pageDir of pages) {
        await generatePage(pageDir);
    }

    // Write sitemap.xml at site root
    const sitemap = generateSitemap(pages, SITE_URL);
    writeFileSync(join(siteRoot, "sitemap.xml"), sitemap);
    console.log(`  generated: sitemap.xml (${pages.length} URLs)`);

    console.log(`Static gen: done (${pages.length} pages).`);
}

main().catch(e => {
    console.error("Static gen failed:", e);
    process.exit(1);
});
