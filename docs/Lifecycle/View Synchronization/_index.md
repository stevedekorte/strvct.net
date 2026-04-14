# View Synchronization

How views discover nodes, synchronize state, and batch updates efficiently.

## View Discovery

The framework creates views automatically when a node needs to be displayed:

1. The node calls `nodeViewClass()`.
2. The framework searches for `NodeClassNameView` or `NodeClassNameTile`.
3. Falls back up the inheritance chain until a match is found.
4. Creates an instance via `clone()` and associates it via `setNode()`.

```
NodeView.newSubviewForSubnode(node)
  ├── Determine view class
  ├── Create instance via clone()
  └── Associate via setNode()
```

## Model to View

When a node property marked with `setSyncsToView(true)` changes:

1. The node's `didUpdateSlot()` fires.
2. An `onUpdatedNode` notification is posted.
3. The observing view schedules `syncFromNode()` via `SvSyncScheduler` at priority 2.
4. At the end of the event loop, the view updates its DOM and subviews.

## View to Model

When the user interacts with a view:

1. The view calls an action method on the node.
2. The node updates its internal state.
3. This triggers a model-to-view sync, completing the cycle.

View-to-model syncs run at priority 0 (higher than model-to-view), ensuring user edits are applied before any reactive updates.

## The Sync Scheduler

`SvSyncScheduler` is central to performance:

- **Batching** — Multiple slot changes in the same event loop produce a single sync call, not one per change.
- **Coalescing** — Duplicate sync requests for the same view are collapsed.
- **Loop detection** — The scheduler detects and breaks infinite sync cycles.
- **Pausing** — Schedulers can be paused during bulk operations (e.g. app startup) and resumed afterward.

```javascript
// Multiple updates, single sync cycle
this.scheduleSyncToView();
this.otherProperty().scheduleSyncToView();
// Both handled in one pass
```

## View Lifecycle Events

- `willAddSubview(subview)` — Before adding a child view
- `willRemoveSubview(subview)` — Before removing a child view
- `willRemove()` — Before this view is removed from its parent
- `onVisibility()` — Element becomes visible (via IntersectionObserver)
- `didChangeNode()` — The node reference changed

## Performance

- **Lazy creation** — Views are only created when their node becomes visible in the navigation.
- **Visibility tracking** — `IntersectionObserver` integration means off-screen views can skip expensive updates.
- **Batched updates** — The sync scheduler ensures that rapid state changes don't cause redundant DOM work.
