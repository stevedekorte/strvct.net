# Notification Center

Deferred, deduplicated event dispatch with weak-reference cleanup.

## Overview

In a framework where model, view, and storage layers must stay independent, objects need a way to announce state changes without knowing who cares. Direct method calls create tight coupling — the sender has to hold a reference to every interested party, and adding a new observer means modifying the sender. The notification center solves this: senders post named notifications into a shared singleton, observers register interest by name, and the two sides never reference each other.

Notifications are queued and dispatched at the end of the event loop, so multiple changes within a single operation result in a single dispatch. This deferred deduplication is critical for performance — a bulk model update that touches 50 slots produces one notification pass, not 50.

<svg viewBox="0 0 820 300" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="anc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="box" x="40" y="20" width="180" height="260"/>
  <text x="55" y="42" class="b">Senders</text>
  <rect class="fill" x="55" y="65" width="150" height="55"/>
  <text x="130" y="90" text-anchor="middle" class="b">SvNode A</text>
  <text x="130" y="110" text-anchor="middle" class="dim">post by name</text>
  <rect class="fill" x="55" y="135" width="150" height="55"/>
  <text x="130" y="160" text-anchor="middle" class="b">SvNode B</text>
  <text x="130" y="180" text-anchor="middle" class="dim">post by name</text>
  <rect class="fill" x="55" y="205" width="150" height="55"/>
  <text x="130" y="230" text-anchor="middle" class="b">SvNode C</text>
  <text x="130" y="250" text-anchor="middle" class="dim">post by name</text>
  <line class="flow" x1="220" y1="150" x2="270" y2="150" marker-end="url(#anc)"/>
  <text x="245" y="140" text-anchor="middle" class="dim">post</text>
  <rect class="box" x="270" y="20" width="280" height="260"/>
  <text x="285" y="42" class="b">NotificationCenter</text>
  <text x="285" y="62" class="dim">queued, deduplicated</text>
  <rect class="fill" x="285" y="80" width="250" height="40"/>
  <text x="410" y="104" text-anchor="middle" class="dim">name · sender</text>
  <rect class="fill" x="285" y="130" width="250" height="40"/>
  <text x="410" y="154" text-anchor="middle" class="dim">name · sender</text>
  <rect class="fill" x="285" y="180" width="250" height="40"/>
  <text x="410" y="204" text-anchor="middle" class="dim">name · sender</text>
  <text x="410" y="250" text-anchor="middle" class="dim">drains at end of event loop</text>
  <line class="flow" x1="550" y1="150" x2="600" y2="150" marker-end="url(#anc)"/>
  <text x="575" y="140" text-anchor="middle" class="dim">dispatch</text>
  <rect class="box" x="600" y="20" width="180" height="260"/>
  <text x="615" y="42" class="b">Observers</text>
  <rect class="fill" x="615" y="65" width="150" height="55"/>
  <text x="690" y="90" text-anchor="middle" class="b">View X</text>
  <text x="690" y="110" text-anchor="middle" class="dim">handler(note)</text>
  <rect class="fill" x="615" y="135" width="150" height="55"/>
  <text x="690" y="160" text-anchor="middle" class="b">View Y</text>
  <text x="690" y="180" text-anchor="middle" class="dim">handler(note)</text>
  <rect class="fill" x="615" y="205" width="150" height="55"/>
  <text x="690" y="230" text-anchor="middle" class="b">View Z</text>
  <text x="690" y="250" text-anchor="middle" class="dim">handler(note)</text>
</svg>

## Posting Notifications

Nodes post notifications when their state changes. The most common pattern uses the convenience method on `SvNode`:

```javascript
this.postNoteNamed("myNotification");
```

For notifications with additional data:

```javascript
SvNotificationCenter.shared().newNote()
    .setSender(this)
    .setName("myNotification")
    .setInfo({ key: "value" })
    .post();
```

Notifications are not dispatched immediately. They are queued and processed at the end of the current event loop via `SvSyncScheduler`. If the same notification (same name and sender) is posted multiple times within one event loop, it is dispatched only once.

## Observing Notifications

To observe notifications from a specific sender:

```javascript
const obs = SvNotificationCenter.shared().newObservation()
    .setName("didUpdateNode")
    .setSender(targetNode)
    .setObserver(this)
    .startWatching();
```

When `targetNode` posts a `"didUpdateNode"` notification, the system calls `this.didUpdateNode(note)` — by default, the method name matches the notification name. To use a different method:

```javascript
obs.setSendName("handleNodeUpdate");
```

For one-time observations that automatically stop after the first match:

```javascript
this.watchOnceForNote("appDidInit").then(() => {
    // App is ready
});
```

Observations can also match broadly:

- `setName(null)` — match notifications with any name from the specified sender
- `setSender(null)` — match notifications with the specified name from any sender
- Both null — match all notifications (useful for debugging)

## SvNotification

Each notification is an `SvNotification` instance with three properties:

- `name` — a string identifying the event (e.g. `"appDidInit"`, `"didUpdateNode"`)
- `sender` — the object that posted it
- `info` — optional additional data

Notifications are deduplicated by a hash computed from `name` and `sender`. Posting the same event from the same object multiple times per event loop has no additional cost.

## SvObservation

An observation connects a notification pattern to an observer:

- `name` — notification name to match (or null for any)
- `sender` — sender to match (or null for any), stored as a **weak reference**
- `observer` — the object to notify, stored as a **weak reference**
- `sendName` — optional custom method name to call on the observer
- `isOneShot` — if true, automatically stops watching after the first match

The notification center maintains indexes by sender and by name for fast matching. When a notification is dispatched, matching observations are found by intersecting the relevant index sets.

## Weak References and Automatic Cleanup

Both `sender` and `observer` on `SvObservation` are stored as weak references. This means:

1. Observations do not prevent garbage collection of either party.
2. When a sender or observer is collected, a weak reference finalizer fires.
3. The finalizer schedules `stopWatching()` via `SvSyncScheduler`.
4. The observation is removed from the notification center automatically.

This eliminates a common source of memory leaks in observer patterns. There is no need to manually remove observations when objects are destroyed. Descriptions of the sender and observer are captured at registration time so that debugging information remains available even after the objects have been collected.

## Common Notification Names

**Application lifecycle:**
- `"appDidInit"` — application fully initialized and ready

**Node changes:**
- `"didUpdateNode"` — node data changed
- `"shouldFocusSubnode"` — request UI focus on a subnode
- `"didReorderParentSubnodes"` — subnode order changed

**Browser events:**
- `"onBrowserOnline"` / `"onBrowserOffline"` — connectivity changes
- `"onDocumentBeforeUnload"` — page unloading

**Configuration:**
- `"onAppDeveloperModeChangedNote"` — developer mode toggled

Applications define additional notification names for their domain-specific events.
