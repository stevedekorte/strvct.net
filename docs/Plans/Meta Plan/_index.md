---
subtitle: The order to do the other plans in, why, and what should change in them first.
---
# Meta Plan

**As of:** 2026-11-18. Every plan page opens with a status line; this page orders them. Steps 1 to 5 are built: 1 to 3 done, 4 (Capabilities & Permissions) and 5's first part (slot constraints) built and used by the app, but **none of the browser-side work from steps 2 to 5 has been run in a browser.** Two pieces of work grew out of these steps: shared promises (step 3) and, on 2026-11-18, taking the app's class names out of framework code (step 2's boundary, the other direction).

## Next Steps

Chosen 2026-11-18, in this order.

### A. A browser pass over steps 2 to 5

Four steps of work were checked headless only, and the framework guide's evidence bar ("did I verify, or did I just read?") is not met for any of it. This comes before new work, because each later step builds on these, and a bug found now has one suspect rather than five. One session in the app (`just launch`, `https://localhost:8443`), a host and a second player, checking:

- **Step 2 (platform accessors):** an invite link's `?invite=` survives boot (`SvPlatform.pageUrl()`); opening a link, picking a file and copying text go through the view actions; an error report carries the user agent.
- **Step 3 (promises):** images and blobs load after a reload and after a failed fetch (the shared promise retries); nothing logs an unhandled rejection.
- **Step 4 (editability):** as a non-admin, a drop onto an admin-only catalog is refused and says so, and nothing saves; a title, a reorder and a field edit are refused the same way; a write the server refuses reloads the document and tells the user.
- **Step 5 (slot constraints):** a character sheet value typed outside its bounds (death saves past 3, negative coins) shows the field's error sentence and is held back from the model; the field carries `aria-valuemin` / `aria-valuemax`; an AI patch that breaks one is refused with the sentence. (There is no `aria-invalid` yet; add it if the pass shows a screen reader misses the error.)
- **The 2026-11-18 cleanup:** assistant chat messages now use `SvChatMessageTile` rather than the app's tile; they should look exactly as before, including the narrated-sentence highlight.

Run with `?thrash=count` on, since steps 2 and 4 touched view code. Each failure becomes a fix with a test where one can be written; the pass is done when every line above has been seen working.

### B. Keep the framework free of app names

The 2026-11-18 cleanup found a framework method that looked up the app's `UoSession` (a ReferenceError under any other app) and a framework class that named the app's tile; both are gone, along with about 30 comments and a fixture that used app classes as examples. One use is left on purpose, pending a decision: the tool instructions every AI conversation receives (`SvToolDefinitions`) use the app's `rollRequest` tool and `UoRollRequestMessage` as their worked example. Changing it changes the game's prompt, so it waits on a choice between a neutral example and one built from the first real tool definition.

Then a ratchet test like `TestPlatformGlobalsInModels`: fail when framework code references a class that no framework file defines, which needs no app prefix and so stays general. Small, and it stops the drift that the cleanup undid. Details in [Naked Objects Issues](../Naked%20Objects%20Issues/#app-names-in-framework-code).

### C. Browser Cleanup, part 1: one navigation entry point

Step 6 below, begun once A is done. The compaction coordinator, Tile Container Views and the navigation announcements in Accessibility all wait on it, so it is the next piece of new work.

### Not next

More slot constraints are declared where a wrong value is seen, not as a project (each is a decision about stored data). The two hand-kept promises in [Cleanup Notes](../Cleanup%20Notes/#hand-kept-promises) wait until their files are changed. Promise-wrapped slots wait for a first user.

## Where Things Stand

| Plan | State | Note |
| --- | --- | --- |
| [Complete Protocols](../Complete%20Protocols/) | Done | Defaults on base classes, `SvJsonSerializableProtocol`, and a ratchet test. |
| [Lazy Slots](../Lazy%20Slots/) | Shipped | Rewritten to describe what shipped; a few items remain. |
| [Async Final Initialization](../Async%20Final%20Initialization/) | Closed | Its main case was solved by manifests and then lazy loading. |
| [Naked Objects Issues](../Naked%20Objects%20Issues/) | Done, one follow-up | Every listed class moved; the ratchet test's baseline is empty. Two gaps stay open until needed. App class names were taken out of framework code (2026-11-18); one prompt example and a ratchet test are left (next step B). |
| [Cleanup Notes](../Cleanup%20Notes/) | Opportunistic | The runtime-risk items are fixed; the rest are for when a file is being changed anyway. Now lists the two hand-kept promises still to move to shared promises. |
| [Promise-Wrapped Slots](../Promise-Wrapped%20Slots/) | Core done, unused | One shared promise per value, retry after failure, recompute on a dependency change; no slot uses it yet. |
| [Capabilities & Permissions](../Capabilities%20%26%20Permissions/) | Built, unverified in a browser (next step A) | Every view edit path asks the editability cascade; the server says who may write and the cascade uses its answer; a refused commit reloads and says so. Read, share and create hooks wait for a need. |
| [JSON Schema](../JSON%20Schema/) | Slot constraints built, unused | A slot's `minimum`, `maxLength` and the rest reach the schema, the field's error text, ARIA and a refused AI patch; the setter only warns. `pattern` is checked too. The app declares its first few (2026-11-18). Class-level keywords and type unions are left. |
| [Browser Cleanup](../Browser%20Cleanup/) | Next new work | Holds the compaction notes; has its own order. Part 1 (one navigation entry point) is next step C. |
| [Tile Container Views](../Tile%20Container%20Views/), [Tile Views](../Tile%20Views/) | Later | Wait on compaction. Large collections rewritten around windowed collections. |
| [Accessibility Testing & Tuning](../Accessibility%20Testing%20%26%20Tuning/) | Ongoing | Automated checks now; manual passes after the navigation work. |
| [Case Studies](../Case%20Studies/) | Later | Contacts can run early. |
| [Emergent Capabilities](../Emergent%20Capabilities/) | Ideas | Each candidate now points to the plan that takes it. |
| [Async Navigation](../Async%20Navigation/), [Graph Database](../Graph%20Database/) | Directions | No work planned. |

## Recommended Order

### 1. A test runner — done (2026-11-15)

`npm test` (or `just test`) rebuilds `build/_index.json`, then runs every `tests/headless/Test*.js` in its own process, one at a time, with a timeout each; arguments filter by file name (`npm test -- Record`). The tests share LevelDB databases under `data/leveldb/`, so they can't run in parallel. The first full run found one flaky test, `TestWindowedCollections`: classic-level's `close()` resolves before LevelDB lets go of its files, so a quick reopen sometimes failed. `SvIndexedDbFolder` now retries such an open briefly, and the test's sleeps are gone. All tests pass (73 then; 80 after steps 2 and 3), in under a minute.

### 2. The model/view boundary — done (2026-11-15)

[Naked Objects Issues](../Naked%20Objects%20Issues/): add the environment accessors and view actions, move the nine classes onto them, then add the ratchet test. The list is short, and the headless and swappable-UI claims depend on it.

**App names (2026-11-18), the boundary's other side.** The framework must not know the app, and an audit found it did in a few places: a dead `session()` that looked up `UoSession`, a default tile named `UoChatInputTile`, an error message naming `UoBuildEnv`, and app classes used as examples in comments and a test fixture. All gone (strvct `9bf3aadd`), except the prompt example in next step B.

### 3. Runtime-risk fixes — done (2026-11-15)

- `markPid()` is iterative ([Cleanup Notes](../Cleanup%20Notes/#can-fail-at-runtime)).
- A promise-wrapped slot's cached promise is cleared when it fails ([Promise-Wrapped Slots](../Promise-Wrapped%20Slots/#error-recovery)). Its getter had never worked; the feature was then finished properly (one promise every caller shares), though nothing uses it yet.

The rest of Cleanup Notes is for when a file is being changed anyway.

**Shared promises (2026-11-15), which came out of this step.** Finishing the slot feature raised the question of the code that hand-kept a `fooPromise` for work several callers ask for at once. An audit of those copies found each had something wrong (a failure cached forever, a retry that never ran, a finished run clearing a newer one, an unhandled second rejection, work that carried on after being abandoned). `Object_sharedPromises.js` now gives every object three helpers (once, one at a time, fresh), and 23 hand-written copies in the framework and the app moved onto them. See [Async Patterns](../../Programming%20Idioms/Async%20Patterns/index.html). Two framework copies are left, listed in [Cleanup Notes](../Cleanup%20Notes/#hand-kept-promises).

### 4. Capabilities & Permissions — built (2026-11-17), to verify in a browser

The most user-facing value: the failure it describes is silent data loss. **Its first step is done (2026-11-16):** titles, drags in and out, reordering, desktop drops and three field paths now ask the cascade, a refused drop says so, and `TestEditabilityInViews` fails on a view that reads a raw capability.

**The rest followed (2026-11-17).** The server now tells the client, with every read, whether the caller may write; the cloud store remembers it and a document's pool carries it into the cascade, so the views and the commit cannot disagree. A commit refused for permission reloads the cloud's copy and tells the user. The work found that the client had been discarding the server's error codes, so no refusal was ever recognized as one. Not done, by decision: separate read, delete, share and create hooks, and a live push of role changes.

### 5. JSON Schema and validation

Additive, and tighter schemas improve AI tool calls at once. Start by emitting the `minimum` / `maximum` annotations that the ARIA code already reads.

**Slot constraints — done (2026-11-17).** Ten setters on `Slot`, named after their JSON Schema keywords, with four readers: the schema, the error sentence a field shows, ARIA, and the setter's warning. An AI patch that breaks one is refused before anything is applied. See [JSON Schema](../JSON%20Schema/#what-was-built). `pattern` joined them on 2026-11-18 (`setPattern`, replacing the schema-only `setJsonSchemaPattern`). The app declared its first bounds the same day, after scanning its stored data for values outside them. What remains is declaring more where a wrong value is seen (each is a decision about stored data), and the class-level keywords and type unions when a case needs them.

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
