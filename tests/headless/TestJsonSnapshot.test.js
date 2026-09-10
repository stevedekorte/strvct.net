"use strict";

// Exercise the actual serializer with minimal slot descriptors, without a DOM.
// node --test tests/headless/TestJsonSnapshot.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
class Base { static initThisClass () { return this; } }
class LazyRef {
    constructor (json) { this.value = json; }
    json () { return this.value; }
}
const Group = vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../../source/library/node/json/SvJsonGroup.js"), "utf8"), {
    SvJsonIdNode: Base, SvLazyJsonRef: LazyRef, assert,
    Type: { isJsonType: () => true, isDeepJsonType: () => true },
});
function serialize (value, lazy = false) {
    const slot = {
        name: () => "data", isLazy: () => lazy, slotType: () => "JSON Object",
        onInstanceRawGetValue: () => new LazyRef(value),
        onInstanceGetValue: () => { assert.equal(lazy, false, "lazy getter must not run"); return value; },
    };
    const group = new Group();
    group.shouldStoreSubnodes = () => false;
    group.thisClass = () => ({ jsonSchemaSlots: () => [slot], cloudJsonSchemaSlots: () => [slot], maxSerializationDepth: () => 100, svType: () => "TestGroup" });
    return group.serializeToJson(null);
}

test("plain objects and nested arrays are detached in both directions", () => {
    const original = [{ nested: { value: 1 } }, [{ value: 2 }], null, "text", 3, false];
    const snapshot = serialize(original).data;
    original[0].nested.value = 10;
    original[1][0].value = 20;
    assert.equal(snapshot[0].nested.value, 1);
    assert.equal(snapshot[1][0].value, 2);
    snapshot[0].nested.value = 30;
    snapshot[1].push({ value: 40 });
    assert.equal(original[0].nested.value, 10);
    assert.equal(original[1].length, 1);
    assert.equal(snapshot[2], null);
    assert.equal(snapshot[3], "text");
    assert.equal(snapshot[4], 3);
    assert.equal(snapshot[5], false);
});

test("lazy JSON snapshots are detached without invoking the lazy getter", () => {
    const original = { children: [{ name: "before" }], empty: null };
    const snapshot = serialize(original, true).data;
    original.children[0].name = "after";
    assert.equal(snapshot.children[0].name, "before");
    snapshot.children.push({ name: "snapshot only" });
    assert.equal(original.children.length, 1);
    assert.equal(snapshot.empty, null);
});

test("model objects in ordinary arrays still use their serializer", () => {
    let calls = 0;
    const snapshot = serialize([{ serializeToJson () { calls++; return { value: "serialized" }; } }]);
    assert.equal(calls, 1);
    assert.equal(snapshot.data[0].value, "serialized");
});
