# Async Patterns

Promise extensions, serial and parallel async array iteration, and error context rethrowing with `Error.rethrow()`.

## Overview

STRVCT extends native JavaScript `Promise` and `Array` prototypes via categories (`Promise_ideal.js`, `Array_promises.js`) to provide clean, chainable asynchronous primitives without importing external async utility libraries.

<svg viewBox="0 0 820 180" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="aap" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">Array_promises Extensions</text>
  <text x="40" y="58" class="dim">promiseSerialForEach / Map</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#aap)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">Promise_ideal Extensions</text>
  <text x="305" y="58" class="dim">status, timeouts, &amp; clone()</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#aap)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">Error.rethrow() Context</text>
  <text x="570" y="58" class="dim">Chained error stack traces</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Asynchronous array operations execute cleanly in serial sequence or bounded parallel batches without raw promise boilerplate.</text>
</svg>

---

## Async Array Iteration (`Array_promises.js`)

STRVCT adds asynchronous iteration methods directly to `Array.prototype`:

### 1. Serial Execution (`promiseSerialForEach` / `promiseSerialMap`)
Executes an async callback for each element in strict sequential order, awaiting each element before starting the next:

```javascript
// Executes sequentially
await items.promiseSerialForEach(async (item) => {
    await processItem(item);
});

// Maps results sequentially
const results = await items.promiseSerialMap(async (item) => {
    return await fetchDetails(item);
});
```

### 2. Parallel Execution (`promiseParallelMap`)
Executes async callbacks in parallel across all array elements:

```javascript
const results = await items.promiseParallelMap(async (item) => {
    return await fetchDetails(item);
});
```

---

## Promise Extensions (`Promise_ideal.js`)

`Promise_ideal.js` extends `Promise` with status introspection and timeout helpers:

```javascript
const promise = Promise.clone(); // Instantiates wrapper promise
promise.isPending();             // Returns true while unresolved
promise.isResolved();            // Returns true when resolved
promise.isRejected();            // Returns true on rejection

// Timeout protection
await promise.timeout(5000, "Operation timed out after 5s");
```

---

## Chained Error Context (`Error.rethrow()`)

When catching and rethrowing errors in async pipelines, `Error.rethrow()` preserves the original error stack while adding contextual messages:

```javascript
try {
    await pool.commitStoreDirtyObjects();
} catch (error) {
    throw Error.rethrow(`Failed to commit object pool ${pool.poolId()}`, error);
}
```

---

## Shared Promises (`Object_sharedPromises.js`)

Async work is often asked for by several callers at once: two views want the same image, a button and a timer both refresh a balance, an invite's auto-join races a Join click. Each caller should get the work's promise, not start the work again. Every object (and every class, for static methods) has three methods for this. Each takes a name for the work and a function that does it.

```javascript
// ONCE — done one time for the life of the object.
asyncLoad () {
    return this.sharedPromiseNamed("load", () => this.asyncLoadResource());
}

// ONE AT A TIME — callers share the run in flight; after it settles, the next call runs again.
asyncReadSubnodes () {
    return this.inFlightPromiseNamed("readSubnodes", () => this.asyncJustReadSubnodes());
}

// FRESH — a caller that arrives mid-run is promised the NEXT run, which starts when this one ends.
asyncUpdateFresh () {
    return this.freshPromiseNamed("update", () => this.asyncFetchBalance());
}
```

| Method | A caller during a run gets | After the run succeeds | After it fails |
| --- | --- | --- | --- |
| `sharedPromiseNamed` | the run's promise | the same promise, forever | forgotten: the next call runs again |
| `inFlightPromiseNamed` | the run's promise | forgotten: the next call runs again | the same |
| `freshPromiseNamed` | a promise for the next run (shared by all such callers) | the next run starts, if one was asked for | the same |

What all three guarantee:

- **The run is recorded before the function is called**, and the function is called synchronously. A failure before its first `await` is handled like any other. (A hand-written version that clears its promise in a `catch` inside the async function clears it *before* the caller has stored it, and then caches the failure.)
- **Callers hold the one promise for the run.** Nothing else is rejected, so a failure is unhandled only if no caller handles it.
- **A run only clears itself.** `forgetSharedPromiseNamed(name)` abandons the work, so the next call starts again; a run still in flight keeps going but can no longer clear or replace a newer one.
- **Abandoned work can tell.** The function receives its run, and work that must not complete once abandoned asks `run.isCurrent()` after its awaits:

```javascript
asyncJoin () {
    return this.sharedPromiseNamed("join", (run) => this.asyncConnect(run));
}

async asyncConnect (run) {
    const room = await this.asyncOpenRoom();
    if (!run.isCurrent()) {   // leave() was called while connecting
        room.disconnect();
        return null;
    }
    this.setRoom(room);
    return room;
}

leave () {
    this.forgetSharedPromiseNamed("join");
    // …
}
```

`hasSharedPromiseNamed(name)` says whether the work is under way (or was done once and kept); `existingSharedPromiseNamed(name)` returns its promise or null, for code that waits on work it does not start.

**Choosing.** Use *once* for loading or joining something. Use *one at a time* for a refresh anyone may ask for, and for anything a view's sync calls. Use *fresh* only where the caller needs a result newer than its own call — the balance after a purchase, a write of bytes that replaced the ones being written. Called from a view sync, *fresh* can chain runs forever, because each run's result syncs the view, which asks again.

**Not this pattern.** A promise created empty and settled later by an event — `Promise.clone()` used as a signal — is a different thing. And a slot whose *value* is computed asynchronously is a [promise-wrapped slot](../../Plans/Promise-Wrapped%20Slots/index.html), which caches the value in the slot and recomputes when a dependency changes.

## Related Guides

- [Categories](../Categories/index.html): Class extension pattern.
- [Protocols](../Protocols/index.html): Interface declaration and conformance checking.
