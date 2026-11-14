---
subtitle: The order to do the other plans in, why, and what should change in them first.
---
# Meta Plan

**As of:** 2026-11-13. Every plan page now opens with a status line; this page orders them.

## Where Things Stand

| Plan | State | Note |
| --- | --- | --- |
| [Complete Protocols](../Complete%20Protocols/) | Done | Defaults on base classes, `SvJsonSerializableProtocol`, and a ratchet test. |
| [Lazy Slots](../Lazy%20Slots/) | Shipped | Rewritten to describe what shipped; a few items remain. |
| [Async Final Initialization](../Async%20Final%20Initialization/) | Closed | Its main case was solved by manifests and then lazy loading. |
| [Naked Objects Issues](../Naked%20Objects%20Issues/) | Next | Nine classes, with a fix for each and a ratchet test to add. |
| [Cleanup Notes](../Cleanup%20Notes/) | Next | Pruned and ordered by risk; the recursive GC comes first. |
| [Promise-Wrapped Slots](../Promise-Wrapped%20Slots/) | Next, one fix | A failed computation stays cached forever. |
| [Capabilities & Permissions](../Capabilities%20%26%20Permissions/) | Next | Rewritten to build on the editability cascade and the Record Store. |
| [JSON Schema](../JSON%20Schema/) | Next | Now includes validation; constraints warn on load and reject edits. |
| [Browser Cleanup](../Browser%20Cleanup/) | Next | Now holds the compaction notes; has its own order. |
| [Tile Container Views](../Tile%20Container%20Views/), [Tile Views](../Tile%20Views/) | Later | Wait on compaction. Large collections rewritten around windowed collections. |
| [Accessibility Testing & Tuning](../Accessibility%20Testing%20%26%20Tuning/) | Ongoing | Automated checks now; manual passes after the navigation work. |
| [Case Studies](../Case%20Studies/) | Later | Contacts can run early. |
| [Emergent Capabilities](../Emergent%20Capabilities/) | Ideas | Each candidate now points to the plan that takes it. |
| [Async Navigation](../Async%20Navigation/), [Graph Database](../Graph%20Database/) | Directions | No work planned. |

## Recommended Order

### 1. A test runner

`npm test` is a stub and each headless test is a standalone script. One command should rebuild `build/_index.json` (a stale bundle makes tests fail confusingly) and run every `tests/headless/Test*.js`. Everything below is a refactor, and refactors need this.

### 2. The model/view boundary

[Naked Objects Issues](../Naked%20Objects%20Issues/): add the environment accessors and view actions, move the nine classes onto them, then add the ratchet test. The list is short, and the headless and swappable-UI claims depend on it.

### 3. Runtime-risk fixes

- Make `markPid()` iterative ([Cleanup Notes](../Cleanup%20Notes/#objectpool-recursive-gc)).
- Clear a promise-wrapped slot's cached promise when it fails ([Promise-Wrapped Slots](../Promise-Wrapped%20Slots/#error-recovery)).

The rest of Cleanup Notes is for when a file is being changed anyway.

### 4. Capabilities & Permissions

The most user-facing value: the failure it describes is silent data loss. Its first step (making title editing, inspector editing and drops consult `offersUserEdit()`) is small and fixes that failure on the UI side; the pool-level answer and the denial path follow.

### 5. JSON Schema and validation

Additive, and tighter schemas improve AI tool calls at once. Start by emitting the `minimum` / `maximum` annotations that the ARIA code already reads.

### 6. Browser Cleanup

In its own order: one navigation entry point, the compaction coordinator, composable breadcrumbs, the auxiliary view.

### 7. Tile Container Views and Tile Views

After the compaction coordinator. Meter and badge tiles can be done at any point.

### 8. Accessibility

Automated checks alongside step 1; manual passes after steps 6 and 7.

### 9. Case Studies

Contacts can run as early as step 2, as a gap-finder; what it finds comes back to this page. The rest once their features exist.

## Not Yet Plans

- **Undo / redo** has no other home. Write it as its own plan when wanted, built on slot-change notifications and `pool.transaction()`.
- **Schema migration.** Class renames are handled (`classNameConversionMap()`); slot type changes and custom migrations aren't. Write a plan when a real type change needs it, taking in the migration item from Emergent Capabilities.
- **Choosing lazy slots by default** (from [Lazy Slots](../Lazy%20Slots/#what-remains)): whether windowed or pool-backed collections should be lazy without being asked.
