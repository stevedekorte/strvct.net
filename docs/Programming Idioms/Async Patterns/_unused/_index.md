# Async Patterns

Extended promises, serial and parallel iteration, and concurrency control.

## Promise.clone()

STRVCT extends the native `Promise` class (via `Promise_ideal.js`) with a factory method that exposes the resolve and reject functions as callable methods on the promise itself. This is the foundation for most async coordination in the framework.

```javascript
const promise = Promise.clone();
promise.setLabel("loadUserData");

// Later, from any code that holds a reference:
promise.callResolveFunc(result);
// or:
promise.callRejectFunc(error);
```

### Why not `new Promise()`?

The native constructor captures resolve/reject inside the executor callback, making them inaccessible outside it. `Promise.clone()` stores them as properties so the promise can be resolved externally — by a different method, a timer, or a network callback — without nesting all the logic inside the constructor.

### Status tracking

Cloned promises track their state explicitly:

```javascript
promise.isPending()    // true until resolved or rejected
promise.isResolved()   // true after callResolveFunc()
promise.isRejected()   // true after callRejectFunc()
promise.isCompleted()  // true if resolved or rejected
```

Calling `callResolveFunc()` or `callRejectFunc()` on an already-completed promise throws an assertion error, catching double-resolution bugs immediately.

### Timeouts

```javascript
const promise = Promise.clone();
promise.setLabel("apiCall");
promise.beginTimeout(5000); // reject after 5 seconds if still pending
```

The timeout auto-cancels on resolution or rejection. The rejection message includes the label and duration for debugging.

### Await hooks

```javascript
const promise = Promise.clone();
promise.setOnAwaitFunc((p) => {
    // Called the first time someone awaits this promise.
    // Useful for lazy initialization — don't start the work
    // until someone actually needs the result.
    startExpensiveOperation(p);
});
```

The framework also tracks `hasAwaiters()` — whether anyone is currently waiting on the promise.

### Common pattern: deferred resolution

The most frequent use of `Promise.clone()` is to bridge callback-style or event-driven code into async/await:

```javascript
async fetchData () {
    const promise = Promise.clone();
    promise.setLabel("fetchData");
    promise.beginTimeout(10000);

    this.setOnResponseCallback((data) => {
        promise.callResolveFunc(data);
    });

    this.setOnErrorCallback((error) => {
        promise.callRejectFunc(error);
    });

    this.sendRequest();
    return promise;
}
```

## Array async iteration

`Array_promises.js` adds methods for controlled async iteration. These are categories on `Array`, so they're available on any array.

### Serial iteration

```javascript
await items.promiseSerialForEach(async (item, index) => {
    await processItem(item);
});
```

Processes one item at a time, in order. Throws immediately if any iteration fails.

### Serial with yielding

```javascript
await items.promiseSerialTimeoutsForEach(async (item, index, total) => {
    await processItem(item);
}, 0); // delay in ms between iterations
```

Like serial, but inserts a `setTimeout` between iterations. This yields control back to the event loop between items, preventing UI freezes during long-running sequences. A delay of `0` still yields; higher values add intentional pacing.

### Parallel

```javascript
const results = await items.promiseParallelMap(async (item) => {
    return await transform(item);
});

// or when you don't need results:
await items.promiseParallelForEach(async (item) => {
    await processItem(item);
});
```

All items processed concurrently via `Promise.all()`. Fast, but can overwhelm APIs or exhaust resources if the array is large.

### Concurrency-limited batching

```javascript
await items.promiseConcurrentSerialTimeoutsForEach(
    async (item, index, total) => {
        await callApi(item);
    },
    3,    // maxConcurrent — at most 3 in flight at once
    100,  // delay in ms between batches
    async (error, item, index) => {
        // optional error handler — log and continue
        console.error("Failed:", item, error);
    }
);
```

The workhorse for API-heavy operations. Runs up to `maxConcurrent` items simultaneously, yields between batches, and supports per-item error handling without aborting the whole sequence. Uses `Promise.clone()` internally for coordination.

## Choosing the right iteration method

| Method | Concurrency | Yielding | Error handling | Use when |
|--------|------------|----------|----------------|----------|
| `promiseSerialForEach` | 1 | No | Fail-fast | Order matters, small arrays |
| `promiseSerialTimeoutsForEach` | 1 | Yes | Fail-fast | Order matters, UI must stay responsive |
| `promiseParallelMap` | All | No | Fail-fast | Independent items, bounded array size |
| `promiseConcurrentSerialTimeoutsForEach` | N | Yes | Configurable | API calls, large arrays, rate limiting |
