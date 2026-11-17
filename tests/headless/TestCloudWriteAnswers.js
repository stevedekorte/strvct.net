#!/usr/bin/env node

"use strict";

/**
 * Headless test: the cloud record store remembers whether the caller may
 * write, as the backend says it (Plans/Capabilities & Permissions, Q1).
 *
 * The backend decides who may write a scope and says so with every read
 * (`callerCanWrite`), so views offer only the edits a commit would take and
 * the client never restates the rule. Checks, with a fake backend:
 *   - nothing is known before the backend has said;
 *   - opening a pool, reading its changes and listing a scope each record
 *     the answer, for the pool and for the scope;
 *   - a commit taken is a yes, a commit refused for permission is a no, and
 *     any other failure changes nothing;
 *   - a backend that does not say leaves what is known as it is;
 *   - a refusal carries its code.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestCloudWriteAnswers.js
 * (rebuild the index first if sources changed: node source/boot/index-builder/ImportsIndexer.js)
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) {
        pass++;
        console.log("  \x1b[32m✓\x1b[0m " + m);
    } else {
        fail++;
        console.log("  \x1b[31m✗\x1b[0m " + m);
    }
};

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

function fakeBackend (state) {
    return {
        callFunction: async (name, args) => {
            switch (name) {
                case "records-limits": return {};
                case "records-open": return { pool: { root: { poolId: args.poolId, objectId: "r", scopeId: state.scopeId }, records: [], version: 1, callerCanWrite: state.says } };
                case "records-changes": return { changes: { rows: [], tombstones: [], version: 1, reloadRequired: false, callerCanWrite: state.says } };
                case "records-scope-roots": return { rows: [], callerCanWrite: state.says };
                case "records-commit": {
                    if (state.commitError) { throw Object.assign(new Error(state.commitError), { code: state.commitError }); }
                    return { status: "committed", version: 2 };
                }
                default: throw new Error("fake backend: unknown function " + name);
            }
        }
    };
}

async function main () {
    await boot();
    const state = { says: undefined, scopeId: "scopeA", commitError: null };
    const store = SvGlobals.get("SvCloudRecordStore").clone().setBackend(fakeBackend(state));
    const commit = (poolId) => store.asyncCommit({ poolId: poolId, baseVersion: 1, requestId: "r", writes: [], deletes: [] });

    console.log("Before the backend has said");
    check(store.callerCanWritePool("scopeA:doc") === null && store.callerCanWriteScope("scopeA") === null, "nothing is known");
    await store.asyncOpen("scopeA:doc");
    check(store.callerCanWritePool("scopeA:doc") === null, "a backend that does not say leaves it unknown");

    console.log("\nReads carry the answer");
    state.says = false;
    await store.asyncOpen("scopeA:doc");
    check(store.callerCanWritePool("scopeA:doc") === false, "opening a pool records it for the pool");
    check(store.callerCanWriteScope("scopeA") === false, "…and for the pool's scope (from its root row)");
    state.says = true;
    await store.asyncReadChanges("scopeA:doc", 0);
    check(store.callerCanWritePool("scopeA:doc") === true, "reading its changes updates it");
    await store.asyncScopeRootRows("scopeB");
    check(store.callerCanWriteScope("scopeB") === true && store.callerCanWriteScope("scopeA") === false, "listing a scope records it for that scope only");
    state.says = undefined;
    await store.asyncOpen("scopeA:doc");
    check(store.callerCanWritePool("scopeA:doc") === true, "a read that does not say leaves the last answer");

    console.log("\nA commit's outcome is an answer too");
    state.commitError = "permission-denied";
    const refused = await commit("scopeA:doc");
    check(refused.status === "refused" && refused.code === "permission-denied", "a refusal carries its code: " + JSON.stringify(refused));
    check(store.callerCanWritePool("scopeA:doc") === false, "refused for permission: no");
    state.commitError = "invalid-argument";
    check((await commit("scopeA:other")).code === "invalid-argument" && store.callerCanWritePool("scopeA:other") === null, "refused for another reason: nothing learned");
    state.commitError = null;
    check((await commit("scopeA:doc")).status === "committed" && store.callerCanWritePool("scopeA:doc") === true, "taken: yes");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
