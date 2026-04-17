# Async Navigation

Rearchitecting the navigation stack to support asynchronous loading at every level.

## Status

This is a long-term architectural direction, not expected to happen soon. The current synchronous navigation model works well for the common case and is significantly simpler to reason about. This page captures the motivation and tradeoffs for future reference.

## Context

STRVCT's navigation stack is currently synchronous. When a user drills into a node, its subnodes are expected to be available immediately in memory -- the tile container reads the subnode array, creates tiles, and displays them in the same frame. This synchronous guarantee makes the navigation code straightforward: there are no loading states, no cancellation of in-flight requests, no partial renders, and no race conditions between navigation events.

However, this model assumes all data is local. As the framework is used with cloud-backed data, server-side collections, or very large hierarchies, the assumption that subnodes are always available breaks down. Async navigation would allow any level of the hierarchy to load its children on demand -- from a remote API, a lazy database query, or any other asynchronous source.

## What Would Change

The synchronous contract runs deep through the navigation stack:

- **`SvStackView`** assumes column content is ready when a navigation event fires.
- **`SvNavView`** assumes it can read a node's subnodes and build tiles immediately.
- **`SvTilesView`** assumes the subnode array is complete and in memory.
- **Tile creation** assumes the node it represents is fully initialized.

An async-capable navigation stack would need to handle the possibility that any of these steps returns a promise rather than a value. This means:

- **Loading states**: Each navigation level needs a placeholder (spinner, skeleton tiles, or empty state) while data loads.
- **Cancellation**: If the user navigates away before loading completes, in-flight requests must be cancelled to avoid stale data arriving in the wrong column.
- **Error handling**: Network failures, timeouts, and partial results need UI treatment at every level, not just at the data layer.
- **Progressive rendering**: Results may arrive incrementally -- the container needs to render partial subnode sets and update as more arrive.
- **Back-navigation caching**: Previously loaded levels should be cached so drilling out doesn't re-fetch.

## Performance Tradeoffs

The synchronous model is fast precisely because it avoids async overhead. Making navigation async introduces significant performance costs even when data is local:

- **Microtask overhead**: Every `await` yields to the microtask queue, adding latency between navigation steps. A drill-in that currently takes one synchronous frame would span multiple frames even if all data is cached, creating visible delay or flicker.
- **Layout thrashing**: Progressive rendering (show spinner, then replace with content) causes multiple layout passes. The current model lays out tiles once.
- **Complexity tax**: Every call site in the navigation chain gains error handling, cancellation logic, and state management. This isn't just code complexity -- it's runtime cost from additional branching, promise allocation, and state tracking on every navigation event.
- **Synchronous fast path**: Even with an async architecture, the common case (local data) should remain fast. Maintaining a synchronous fast path alongside async support adds implementation complexity and testing surface.
- **Memory pressure**: Caching previously loaded levels for back-navigation trades memory for responsiveness. The cache eviction policy itself becomes a source of bugs and tuning.

These tradeoffs are the primary reason this is a long-term direction rather than an immediate goal. The current synchronous model is the right default for most applications -- the performance cost of async navigation is only worth paying when the data genuinely can't be local.

## Relationship to Other Work

Several other Future Work items intersect with async navigation:

- **[Lazy Slots](../Lazy%20Slots/index.html)** and **[Promise-Wrapped Slots](../Promise-Wrapped%20Slots/index.html)** address async data at the slot level. Async navigation would be the view-layer counterpart -- the container knowing how to wait for and display async subnode sources.
- **[Scaling to Large Collections](../Tile%20Container%20Views/index.html)** (in Tile Container Views) describes virtual scrolling and async data sources for tile containers. Async navigation generalizes this from a single container feature to a stack-wide capability.
- **[Graph Database](../Graph%20Database/index.html)** would introduce query-based node retrieval, which naturally produces async results.

If lazy slots and promise-wrapped slots are implemented first, they may provide the async primitives that async navigation builds on -- the slot system handles the data loading, and the navigation stack handles the display timing.
