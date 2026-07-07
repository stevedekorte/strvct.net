#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvImageWellProgressiveProtocol capability gate.
 *
 * The progressive image-well render path is gated on stable protocol
 * conformance (declared once via addProtocol) instead of mutable runtime
 * state, so the path choice can never flip between syncs. This test
 * verifies the mechanics that gate depends on:
 *
 *   1. the protocol class boots and is a Protocol subclass
 *   2. an adopter implementing the protocol methods can addProtocol()
 *      at initPrototype time without throwing
 *   3. conformsToProtocol() is true for adopter instances, false for
 *      non-adopters (SvImageWellField and a plain node)
 *   4. documents addProtocol's actual behavior for a class MISSING the
 *      protocol methods (whether conformance is enforced or declarative)
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestImageWellProgressiveProtocol.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

// Boot expects cwd to be the site root (build/_index.json lives there).
const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let passed = 0;
let failed = 0;

function check (condition, message) {
    if (condition) {
        passed++;
        console.log("  \x1b[32m✓\x1b[0m " + message);
    } else {
        failed++;
        console.log("  \x1b[31m✗\x1b[0m " + message);
    }
}

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");

    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvBootLoader.asyncRun();
}

function testProtocolClass () {
    console.log("\nProtocol class");

    const protocol = SvGlobals.get("SvImageWellProgressiveProtocol");
    const Protocol = SvGlobals.get("Protocol");
    check(!!protocol, "SvImageWellProgressiveProtocol loaded at boot");
    check(protocol.isKindOf(Protocol), "is a Protocol subclass");

    const proto = protocol.prototype;
    ["imageWellAspectRatio", "imageWellPreviewValue", "imageWellIsWorking", "imageWellHasFailed"].forEach((name) => {
        check(typeof (proto[name]) === "function", "declares " + name);
    });
    check(typeof (proto.imageWellBlurRadiusPx) !== "function", "does NOT declare imageWellBlurRadiusPx (deliberately dropped)");
}

function testAdopter () {
    console.log("\nAdopter conformance");

    const SvNode = SvGlobals.get("SvNode");
    const protocol = SvGlobals.get("SvImageWellProgressiveProtocol");

    let addProtocolError = null;
    try {
        (class TestProgressiveAdopter extends SvNode {
            initPrototype () {
                this.addProtocol(SvImageWellProgressiveProtocol);
            }

            imageWellAspectRatio () {
                return "5:3";
            }

            imageWellPreviewValue () {
                return null;
            }

            imageWellIsWorking () {
                return false;
            }

            imageWellHasFailed () {
                return false;
            }
        }).initThisClass();
    } catch (e) {
        addProtocolError = e;
    }

    check(addProtocolError === null, "addProtocol at initPrototype does not throw for a conforming adopter" + (addProtocolError ? " (threw: " + addProtocolError.message + ")" : ""));

    if (addProtocolError === null) {
        const adopter = SvGlobals.get("TestProgressiveAdopter").clone();
        check(adopter.conformsToProtocol(protocol) === true, "adopter instance conformsToProtocol → true");

        (class TestProgressiveAdopterChild extends SvGlobals.get("TestProgressiveAdopter") {
        }).initThisClass();
        const child = SvGlobals.get("TestProgressiveAdopterChild").clone();
        check(child.conformsToProtocol(protocol) === true, "subclass of adopter inherits conformance");
    }
}

function testNoCrossPollution () {
    console.log("\nNo cross-pollution (protocols sets are per-class, not the shared slot default)");

    const protocol = SvGlobals.get("SvImageWellProgressiveProtocol");
    const audioProtocol = SvGlobals.get("SvAudioClipDelegateProtocol");
    const audioQueueProto = SvGlobals.get("SvAudioQueue").prototype;

    check(audioQueueProto.conformsToProtocol(audioProtocol) === true, "SvAudioQueue conforms to its own SvAudioClipDelegateProtocol");
    check(audioQueueProto.conformsToProtocol(protocol) === false, "SvAudioQueue does NOT conform to the image-well protocol");

    const field = SvGlobals.get("SvImageWellField").clone();
    check(field.conformsToProtocol(audioProtocol) === false, "SvImageWellField does NOT conform to the audio protocol");
}

function testNonAdopters () {
    console.log("\nNon-adopters");

    const protocol = SvGlobals.get("SvImageWellProgressiveProtocol");

    const field = SvGlobals.get("SvImageWellField").clone();
    check(field.conformsToProtocol(protocol) === false, "plain SvImageWellField conformsToProtocol → false (stays on legacy path)");
    check(typeof (field.imageWellAspectRatio) !== "function", "SvImageWellField no longer carries dead default protocol methods");

    const node = SvGlobals.get("SvNode").clone();
    check(node.conformsToProtocol(protocol) === false, "plain SvNode conformsToProtocol → false");
}

function testNonConformingAdopter () {
    console.log("\nNon-conforming adopter (documents actual addProtocol enforcement)");

    let addProtocolError = null;
    try {
        (class TestBrokenAdopter extends SvGlobals.get("SvNode") {
            initPrototype () {
                // deliberately missing all four protocol methods
                this.addProtocol(SvImageWellProgressiveProtocol);
            }
        }).initThisClass();
    } catch (e) {
        addProtocolError = e;
    }

    // Either outcome is coherent; the point is to pin down which one the
    // framework actually implements, so the gate's failure mode is known.
    if (addProtocolError) {
        console.log("  \x1b[33mi\x1b[0m addProtocol ENFORCES conformance (threw: " + addProtocolError.message + ")");
    } else {
        const broken = SvGlobals.get("TestBrokenAdopter").clone();
        const conforms = broken.conformsToProtocol(SvGlobals.get("SvImageWellProgressiveProtocol"));
        console.log("  \x1b[33mi\x1b[0m addProtocol is DECLARATIVE (no method check); conformsToProtocol → " + conforms);
    }
    passed++; // informational — always counts as a pass
}

async function main () {
    console.log("TestImageWellProgressiveProtocol: booting strvct…");
    await boot();

    testProtocolClass();
    testAdopter();
    testNonAdopters();
    testNoCrossPollution();
    testNonConformingAdopter();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
