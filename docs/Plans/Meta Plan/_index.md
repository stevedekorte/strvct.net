---
subtitle: The order to do the other plans in, why, and what should change in them first.
---
# Meta Plan

**As of:** 2026-11-23. Every plan page opens with a status line; this page orders them. Steps 1 to 6 are built: 1 to 3 done, 4 (Capabilities & Permissions) and 5's first part (slot constraints) seen working in a browser on 2026-11-19, and 6 (Browser Cleanup) built in all four parts, its compaction coordinator released to production on 2026-11-22. On 2026-11-23 the plans were checked against the code: Browser Cleanup's composable breadcrumbs and auxiliary view had been built on 2026-06-12, as `SvBreadCrumbsView` and the companion, and the plan had not noticed. The steps below follow from that check.

## Next Steps

Chosen 2026-11-23, in this order. The 2026-11-18 set (A to C) is [below](#done-the-2026-11-18-steps).

### 1. Put back what the 2026-11-23 check found broken or stale — done (2026-11-23)

Small, and each is a fault a reader or a user can meet today. All done the same day: the breadcrumbs' `aria-current` (with `TestBreadCrumbsAriaCurrent`), the Responsive page rewritten around claims and `SvLayerAllocation`, and the stale class name replaced.

- **The breadcrumb bar's `aria-current`.** `SvBreadCrumbsTile` set `aria-current="location"` on the last crumb; `SvBreadCrumbsView`, which replaced it on 2026-06-12, does not. Put it back, with a headless check.
- **Docs that describe code that is gone.** [Responsive](../../Views/Responsive/) explains compaction with `compactNavAsNeeded` and `updateWidthForWindow`, both removed by the compaction coordinator; rewrite it around claims and `SvLayerAllocation`. [Accessibility](../../Accessibility/), [Internationalization](../../Internationalization/) and [Auto-Generated Views](../../Views/Auto-Generated%20Views/) still name `SvBreadCrumbsTile`.

### 2. Keep the framework free of app names (was B) — test built (2026-11-23), the prompt example waits

**Built:** `TestUndefinedClassNames` fails when framework code uses a name as a class (`extends`, `new`, `instanceof`, `.clone()`, `.shared()`, a slot type, `SvGlobals.get`) that no framework file defines, that is not a platform API, and that is not listed with its reason. It found no app names, and two real faults, both fixed: an audio file read through `SvResourceFile` made an `SvSoundResource`, a class that never existed (seen decoding to an `SvWaSound` in a browser after the fix), and a slot type spelled `"NumbeStringr"`. It does not read prose in strings, so it cannot see the prompt example below.

What was planned: the ratchet test, like `TestPlatformGlobalsInModels`: fail when framework code references a class that no framework file defines. It needs no app prefix, so it stays general, and it stops the drift the 2026-11-18 cleanup undid. One known use stays until Steve chooses: the tool instructions every AI conversation receives (`SvToolDefinitions`) use the app's `rollRequest` and `UoRollRequestMessage` as their worked example. The recommendation is a neutral example made up for the framework, with the game keeping its own in its prompt files; it changes the game's prompt, so it waits on that choice. Details in [Naked Objects Issues](../Naked%20Objects%20Issues/#app-names-in-framework-code).

### 3. Navigation announcements, with the entry point's second pass — built (2026-11-23), not yet heard with VoiceOver

**Built:** a model's focus notes are selected on behalf of a `"program"` request, and a browser says the title of a place code moved the user to, through one polite live region (`SvLiveAnnouncer`). Checked headless (`TestNavigationEntryPoint`) and in Chromium against `just launch` (`tests/e2e/navigation-announcements.spec.js`, new; `navigation-entry-point` and `meta-plan-step-a` still pass). Still to do: listen with VoiceOver. See [Accessibility Testing & Tuning](../Accessibility%20Testing%20%26%20Tuning/#navigation-announcement-mechanism).

What was planned:

The first feature in [Accessibility Testing & Tuning](../Accessibility%20Testing%20%26%20Tuning/#navigation-announcement-mechanism), and the last open part of Browser Cleanup. A path change now says who caused it, so announcing a `"program"` navigation is a listener and a live region. It is right only once the focus-and-expand notes and the other unrequested path changes go through `navigate()` ([second pass](../Browser%20Cleanup/#second-pass-open)); today they are recorded as the user's and would go unannounced. Checked in a browser with VoiceOver, not only headless.

### 4. Tile Container Views: the wrapping grid — proposal written, waiting on three decisions (2026-11-23)

A recommendation is in [Tile Container Views](../Tile%20Container%20Views/#the-first-grid-a-recommendation-for-discussion-2026-11-23): opt in with `nodeChildrenLayout()` answering `"grid"`, not a view class; build it as a mode of `SvTilesView` that fills whenever shown; first used by a character's artwork. Nothing is built until those are agreed.

What was planned: `setNodeTilesViewClass()` and the first grid. It waits on nothing (decided 2026-11-20), and the manual accessibility passes and the Photo Gallery case study wait on it. Its ARIA roles come with it.

### Not next

More slot constraints are declared where a wrong value is seen, not as a project (each is a decision about stored data). The two hand-kept promises in [Cleanup Notes](../Cleanup%20Notes/#hand-kept-promises) wait until their files are changed. Promise-wrapped slots wait for a first user. The rest of the compaction coordinator's part D, and the companion's missing hints, wait for a case that needs them. A review of compaction parts C and D, which shipped without one, is welcome whenever a reviewer is free; its questions are in [For the next pass](../Compaction%20Coordinator/#for-the-next-pass).

### Done: the 2026-11-18 steps

- **A. A browser pass over steps 2 to 5** (2026-11-19). Run against `just launch` and the deployed dev project, in Playwright specs that cost nothing to rerun: `hosted-table-invite-signup`, `meta-plan-step-a`, `editability-browser-pass` and `editability-views-browser-pass`. It found and fixed an empty catalog under `just launch` (since 2026-11-13) and Cmd+D duplicating into a read-only list; `TestEditabilityInViews` now also fails on a view method that changes a node's list without asking. It showed that a player cannot reach the catalog's nodes or a character's raw number fields by hand, so for players the view refusals and a field's error sentence are a second line behind the server's refusal and the patch preflight. **Still unseen:** a failed fetch from Cloud Storage rather than the local pool (needs a deployed project), and the narrated-sentence highlight during real narration.
- **B. App names.** Carried forward as step 2 above.
- **C. One navigation entry point** (2026-11-19). `SvBrowserView.navigate(aRequest)`; see [Browser Cleanup](../Browser%20Cleanup/#one-navigation-entry-point). The compaction coordinator followed it and was released 2026-11-22.

## Where Things Stand

| Plan | State | Note |
| --- | --- | --- |
| [Complete Protocols](../Complete%20Protocols/) | Done | Defaults on base classes, `SvJsonSerializableProtocol`, and a ratchet test. |
| [Lazy Slots](../Lazy%20Slots/) | Shipped | Rewritten to describe what shipped; a few items remain. |
| [Async Final Initialization](../Async%20Final%20Initialization/) | Closed | Its main case was solved by manifests and then lazy loading. |
| [Naked Objects Issues](../Naked%20Objects%20Issues/) | Done, one decision left | Every listed class moved; seen in a browser 2026-11-19. App class names were taken out of framework code (2026-11-18), and `TestUndefinedClassNames` keeps them out (2026-11-23). One prompt example waits on a decision (next step 2). |
| [Cleanup Notes](../Cleanup%20Notes/) | Opportunistic | The runtime-risk items are fixed; the rest are for when a file is being changed anyway, including the two hand-kept promises. |
| [Promise-Wrapped Slots](../Promise-Wrapped%20Slots/) | Core done, unused | One shared promise per value, retry after failure, recompute on a dependency change; no slot uses it yet. |
| [Capabilities & Permissions](../Capabilities%20%26%20Permissions/) | Built, seen in a browser | Every view edit path asks the editability cascade; the server says who may write; a refused commit reloads and says so. Read, share and create hooks wait for a need. Not yet run on the Spanner backing. |
| [JSON Schema](../JSON%20Schema/) | Slot constraints built | A slot's `minimum`, `maxLength`, `pattern` and the rest reach the schema, the field's error text, ARIA and a refused AI patch. The app declares its first few. Class-level keywords and type unions are left. |
| [Browser Cleanup](../Browser%20Cleanup/) | Built | All four parts: the entry point (2026-11-19, second pass 2026-11-23), the compaction coordinator (released 2026-11-22), composable breadcrumbs and the companion (2026-06-12). The companion's missing hints wait for a node that uses one. |
| [Compaction Coordinator](../Compaction%20Coordinator/) | Released | Parts A to D in production 2026-11-22; C and D had no outside review. The rest of part D waits for cases. |
| [Accessibility Testing & Tuning](../Accessibility%20Testing%20%26%20Tuning/) | Started | Navigation announcements and the breadcrumbs' `aria-current` built 2026-11-23, checked in Chromium; a VoiceOver check is next. No automated checks yet. |
| [Tile Container Views](../Tile%20Container%20Views/), [Tile Views](../Tile%20Views/) | Next after | The wrapping grid is next step 4 and waits on nothing; the table and scrolling follow. Large collections rewritten around windowed collections. |
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

### 4. Capabilities & Permissions — built (2026-11-17), seen in a browser (2026-11-19)

The most user-facing value: the failure it describes is silent data loss. **Its first step is done (2026-11-16):** titles, drags in and out, reordering, desktop drops and three field paths now ask the cascade, a refused drop says so, and `TestEditabilityInViews` fails on a view that reads a raw capability.

**The rest followed (2026-11-17).** The server now tells the client, with every read, whether the caller may write; the cloud store remembers it and a document's pool carries it into the cascade, so the views and the commit cannot disagree. A commit refused for permission reloads the cloud's copy and tells the user. The work found that the client had been discarding the server's error codes, so no refusal was ever recognized as one. Not done, by decision: separate read, delete, share and create hooks, and a live push of role changes.

### 5. JSON Schema and validation

Additive, and tighter schemas improve AI tool calls at once. Start by emitting the `minimum` / `maximum` annotations that the ARIA code already reads.

**Slot constraints — done (2026-11-17).** Ten setters on `Slot`, named after their JSON Schema keywords, with four readers: the schema, the error sentence a field shows, ARIA, and the setter's warning. An AI patch that breaks one is refused before anything is applied. See [JSON Schema](../JSON%20Schema/#what-was-built). `pattern` joined them on 2026-11-18 (`setPattern`, replacing the schema-only `setJsonSchemaPattern`). The app declared its first bounds the same day, after scanning its stored data for values outside them. What remains is declaring more where a wrong value is seen (each is a decision about stored data), and the class-level keywords and type unions when a case needs them.

### 6. Browser Cleanup — built

One navigation entry point (2026-11-19); the compaction coordinator (released 2026-11-22); composable breadcrumbs and the auxiliary view, which turned out to have been built on 2026-06-12 as `SvBreadCrumbsView` and the companion. The entry point's second pass is left, and goes with the navigation announcements (next step 3).

### 7. Tile Container Views and Tile Views

Next (step 4 above). Meter and badge tiles can be done at any point.

### 8. Accessibility

Nothing built yet. The navigation announcements now, with the automated checks alongside; manual passes after the first grid (step 7).

### 9. Case Studies

Contacts can run as early as step 2, as a gap-finder; what it finds comes back to this page. The rest once their features exist.

## Not Yet Plans

- **The [First Principles](../../First%20Principles/) essay** is on hold (2026-11-23) until after the Thanksgiving break, or when Steve has time. He edits it by hand first, then asks for help.

- **Undo / redo** has no other home. Write it as its own plan when wanted, built on slot-change notifications and `pool.transaction()`.
- **Schema migration.** Class renames are handled (`classNameConversionMap()`); slot type changes and custom migrations aren't. Write a plan when a real type change needs it, taking in the migration item from Emergent Capabilities.
- **Choosing lazy slots by default** (from [Lazy Slots](../Lazy%20Slots/#what-remains)): whether windowed or pool-backed collections should be lazy without being asked.
