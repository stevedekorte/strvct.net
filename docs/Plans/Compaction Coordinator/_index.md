# Compaction Coordinator

The rules for which columns a browser shows and how wide each is, gathered into one place that can be tested without a browser.

**Status:** the plan as of 2026-11-21. **Part A is built** (A1, A2, A3, A4 and A7, on dev, not released): see [Part A as built](#part-a-as-built-2026-11-21). Nothing after it is built, and each part starts on Steve's word. Next is the thumbnail fix, then part B. It is part 2 of [Browser Cleanup](../Browser%20Cleanup/); [Tile Container Views](../Tile%20Container%20Views/) no longer waits on it for its first grid. **Steve's decisions of 2026-11-20:** the recordings before part A may start; the line for part B is 2ms; the companion's code is kept and no work is put into it now; the first grid does not wait on this plan. The choices made, and the ones still open, are listed at the end. A review of this page (`_review.md`, beside it) was folded in five times on 2026-11-20 and a sixth on 2026-11-21. What each pass changed is marked "(review)" and "(review 2)" to "(review 6)"; the reviewer's answers, and the questions that follow from them, are in the last section. The reviewer's verdict on the fifth pass, with the recordings in hand: part A can start (A1, A2, A3, A4 and A7, five commits), and C still waits on B.

**What changed from the first draft (2026-11-19).** That draft proposed a layout object, `SvColumnLayout`, that was handed a flat list of columns and answered with a plan. The review found three things it had not taken in: the levels are nested inside each other, not laid side by side; each level chooses its own direction; and an object that solved the whole layout would have to repeat what the views already know about themselves. This version keeps each view's knowledge in the view and moves only the arithmetic. It also puts the small, safe fixes first and a measurement before the larger change.

## Compaction in the lens model

The [Naked Objects](../../Naked%20Objects/) paper describes a screen as a lens over the model, made of three decisions: which nodes are **visible**, whether each visible parent-to-child edge is **layered** (the child gets its own plane, beside or in front of its parent) or **inlined** (the child is drawn within its parent's extent), and how siblings are **arranged**. It says the framework owns the mechanics, and names one of them: *responsive collapse is the lens switching edges from inlined to layered as space runs out, within the bounds the hints allow.*

That mechanic is what this plan is about. Read that way, the code has four separate implementations of it, one per kind of edge:

| What the user sees | In the lens model | Where it is decided today |
| --- | --- | --- |
| Earlier columns hide and the breadcrumbs keep the path | Layers stacked in depth, no longer side by side. Still layered. | `SvStackView` and `SvNavView` |
| A docked companion becomes a tab | An inlined edge becomes layered | `SvDetailView` and `SvCompanionView` |
| Side-by-side panes become tabs | An inlined edge becomes layered | `SvAnchoredTabsLayout` |
| A document's sections go from three text columns to one; a section folds to a tile | Inlined siblings rearranged; an inlined edge becomes layered, by the user's hand | CSS, and `SvInlineSectionTile` |

A pin on a companion or a tab, and a folded section, are the same thing too: the user choosing a placement, inside what the hints allow.

So the destination is one protocol in which every edge says how it wants to be placed, how far it may give way, and how much room it needs. It is a shared protocol and not one owner. Part C is the first step: the layers, with each companion's reservation handed in as a number by the companion that worked it out. `SvAnchoredTabsLayout` stays the owner of its panes for good: two panes with the same claim can need different answers, because a player dragged their divider, chose a different member of a group, or closed a pane that should be the first to come back. What it shares with the rest is the edge of the protocol: its reservation goes outward, the width it is given comes inward, and it divides that width by the history it keeps. (review 2) What this page calls a *level* is a layer in the paper's words.

## What compaction does today

### The structure

A browser shows a chain of levels. Each level is a `SvStackView` holding a nav view (the column or menu) and a detail view. The detail view holds **the next level's whole stack**, and that level's companion panel if it has one. So the levels are nested: the third column is inside the second level's detail view, which is inside the first's. The one place views sit side by side is an anchored-tabs level, whose panes are siblings.

**An anchored-tabs level ends its browser's chain.** Each open pane is a browser of its own, with its own chain, laid out against the width of its pane's frame. So there are two calculations there, not one: the outer chain, in which the anchored level reserves width and the columns before it give way, and each pane's chain, in which the pane's columns fit the pane. (review)

Each level takes its direction from its node:

- `"right"`: the nav is a column on the left and the next level is beside it.
- `"down"`: the nav is a row across the top and the next level is beneath it.

**No node in the app supplies a companion today.** `nodeCompanionNode()` answers null in the framework and nothing in the app overrides it; the Narration and Party panels that were companions are now anchored tabs, each pane a browser of its own. The companion panel is exercised only by the framework's own spec, which supplies one at run time. So every companion rule on this page is a rule of the framework that no player reaches, and what that means for C's scope is a question for Steve under [Still open](#still-open). (review 3)

In the app today every node is `"right"`, the default. The only `"down"` levels in use are anchored tabs, which force it. Any other direction throws. `"left"` and `"up"` are wanted eventually, `"left"` for right-to-left languages among other uses; see [Four directions](#four-directions).

A level also chooses how it shows its children (`nodeChildrenLayout()`): one per tile in a column, as anchored tabs, or **inline**, where the next levels are laid out in place as a document (Inline Navigation, in the app's plans). So a level is not always a column, and one column can hold several levels of the tree. See [Inline documents](#inline-documents).

### The rules

- Only `"right"` levels take part. A `"down"` level is never hidden and adds no width, since its row costs height and the levels beneath it get its full width.
- A column is hidden when its target width, plus the target widths of every `"right"` column after it, plus every docked companion and anchored-tabs claim after it, is not less than the root width. So columns give way from the left.
- A column that fills the leftover width (a narration, an inline document) is never hidden. It shrinks. Only the last column can be a fill column.
- A companion's room is the root width minus its own level's column, and nothing else. It docks when its preferred length fits, becomes a tab when it doesn't, and is hidden when even the tab doesn't fit. A user's pin wins while the tab fits.
- A companion's mode and its docked length are worked out from different budgets. The mode uses the column's comfortable target. The length may grow, for the width hint of the node in focus, into the room above the column's yield floor. A pin to docked keeps the panel at **at least** its preferred length whenever the tab fits, even when that is more than the room; a larger hint can still widen it. (review, review 2)
- Hidden means `display: none`. A column does not animate. A companion does: its size changes over 380ms, and its embedded browser is laid out again 400ms after it docks. So a companion's reservation is at its new value while its box is still narrower, and a recording has to take three things apart: the reservation when it is decided, the box in transition, and the box once settled. Otherwise a correct frame in between reads as a wrong answer. (review 4)

The arithmetic is **flat**: every comparison is against the root width, although the views are nested. It gives the right answer because columns give way strictly from the left.

A column's target width is the larger of 270px and its node's `nodeMinTileWidth()`, plus a thumbnail allowance, capped at the available width.

## Where it lives

| Class | Its part |
| --- | --- |
| `SvStackView` | Sums the widths after it, decides hide or show for its own column, and loops the whole chain until nothing changes. |
| `SvNavView` | Target width, available width, hide and show, and the width styles. |
| `SvDetailView` | A companion's room. |
| `SvCompanionView` | Docked, tab or hidden, and its docked length. |
| `SvStackView_anchoredTabs` | How much width the panes claim. |

## What is wrong with it

Each was read from the source. None has been measured in a browser; part B does that.

1. **It runs far more often than the layout changes.** Every stack's `syncFromNode` ends in a pass over the whole chain. A node update bubbles to the root, so a streamed narration runs it for every level on every chunk.
2. **Every level answers a window resize.** Each stack registers for the event and each recompacts the whole chain: N passes per event, each looping up to five times. The source has a TODO saying only the top stack should register.
3. **The pass loops because of its order.** Each level decides its column first and its companion second, so a column reads companion states left over from the pass before. Deciding companions first and columns second needs one pass, since a companion's room does not depend on which columns are hidden.
4. **Three names for one method.** `safeUpdateCompactionChain`, `updateCompactionChain` and `recompactBrowserChain`, with 12 call sites.
5. **The width styles are written twice, and disagree.** `SvNavView.makeOrientationRight` and `SvNavView.updateWidthForWindow` hold near-copies of one rule. The second has a case the first lacks: the last column fills the row when the root is between one and two column widths. In that case every sync writes the fixed width and then the full width.
6. **A height is measured on every pass.** A bottom-edge companion's room is read from `clientHeight` inside the loop, after widths are written. It is a raw element read, so the thrash counter does not see it.
7. **Views ask the window, not the layout.** `SvOptionNodeTile` decides whether to step back after a pick by comparing the window width with 540. What it wants to know is whether its parent column is hidden.
8. **Numbers without names.** 270, `17em`, 540, 200, and the loop guard of five.
9. **No test holds the rules.** The anchored tabs have `TestAnchoredTabsLayout`. The columns have nothing like it, so every fix so far was found in a browser and guarded by a comment.

## Recommendation

In this order: the recordings, part A, the thumbnail fix, part B, and then part C if B's numbers call for it. Everything before C is small and worth doing whatever is decided about C.

### Before part A: record what the fixes must not change (review)

Part A is meant to change nothing a user sees, so what it could change is recorded first. **Steve has said to start these (2026-11-20), with one condition: not everything the columns do today is how they should behave.** So a recording says what happens, not what is right. Its assertions are named as today's behaviour, anything that looks wrong is listed for Steve with the recording, and a behaviour he calls wrong is taken out of what part A and part C must reproduce and becomes a fix of its own.

- **Mend the width spec.** `app-mobile-column-width.spec.js` asserts on the widest ancestor of the "My Sessions" tile. A wrapper as wide as the viewport passes it while the column itself is stuck at 270px. It should measure the enclosing nav view.
- **Record a window resize** before A1, counting calls to the chain pass apart from the loops inside each call.
- *Deferred with the companion (Steve, 2026-11-20):* the bottom-edge companion's height changing, and two side companions in one chain. The reviewer built both fixtures in Chromium from plain `SvSummaryNode`s and the `nodeCompanionNode()` hook, and what they saw is kept here for when the companion is taken up. Bottom edge, on a host with `setNodeIsVertical(false)` at a width of 1,000px: hidden at a detail height of 219px, a tab from 220px to 579px, docked from 580px, no width reserved. Two side companions, each asking for 700px at a 1,000px root with three 270px columns: both dock and reserve 700px, the first two columns hide and the third shows; at 600px both are tabs and reserve nothing. `companion-panel.spec.js` accepts a tab while requiring a reservation above zero, which should depend on the mode. (review 4)
- **Record a narration that asks for 900px in a 390px pane**, after an ordinary node update, beside a column that is not a fill column and has stretched to fill the row. This is before A3, which touches the rule next to the one that fixed that narration. (review 2)
- **Record the solo Party sheet**, as the last column and with a tile opened from it. The Party tab asks for 437px and, for a party of one, presents a sheet that asks for 300px, so it is the case in which the two nodes disagree (see [Two fixes that are decisions](#two-fixes-that-are-decisions)).

#### What the recordings show (2026-11-20, on dev)

Taken by `tests/e2e/compaction-recordings.spec.js` in the app repo, which writes `tests/e2e/recordings/compaction-before-A.json`: one new session with one character seated, 41 steps, no page errors. It has been taken three times. The numbers here are the second run's, taken after the GM's opening had finished arriving (see point 2 below), and that run is the baseline (app commit 5e57446e4). The reviewer compared the first two runs: the same open tabs and the same stack states at all 32 steps of the resize. The third run matched the baseline in layout at every step and in every pass count (292 calls, 530 level visits, 212 resize handlers). `app-mobile-column-width.spec.js` is mended and passes. Nothing below is asserted as right.

**The width spec was measuring nothing.** On a phone the "My Sessions" text it looked for is the breadcrumb, not a tile, so none of its ancestors was a column. It now reads the columns: the root column hidden, the My Sessions column 393px of 393px.

**The session at 1,600px.** The app's two columns (the root and My Sessions) are hidden and the session's tab row takes the full width. Narration alone is 1,600px. With Party opened, Narration is 1,076px and Party 522px. Both panes' columns are fill columns.

**The resize.** Both panes stay open down to 1,040px (Narration 602px, Party 436px). At 1,000px and below only Party shows, at the full width, and Narration is closed. Coming back up, Narration returns at 1,040px. This agrees with the reviewer's 1,038px.

**The Narration column at 390px.** It is 390px wide, a fill column with no minimum, before and after an ordinary node update on the chat. The narration that asks for 900px does not overflow.

**The solo Party sheet.** The Party column's own node asks for 437px and the sheet it presents for 300px, as read. At every width recorded it is a fill column, so the difference never shows. **The second case could not be taken:** no tile on a new character's sheet opens past the inlined levels, so there was nothing to open from inside it. That case, and the repeated section column, need a character with something to open, or the Inline Lab.

**Passes.** Script time in the passes only; the layout they cause is not in these numbers, and nothing was streaming.

| What happened | Calls to the chain pass | Level visits inside them | Resize handlers | Script time |
| --- | --- | --- | --- | --- |
| One step of the resize (31 of the 32) | 7 to 9 | 13 to 17 | 6 or 7 | 0.2 to 0.7ms |
| The one step where Narration's pane reopens (1,000px to 1,040px) | 12 | 20 | 6 | 0.6ms |
| 1.2 seconds with nobody touching anything | 0 | 0 | 0 | 0 |
| Opening the Party tab | 16 | 34 | 0 | 0.8ms |
| An ordinary node update on the chat | 6 | 14 | 0 | 0.3ms |

So one resize runs six or seven handlers, and one explicit node update on the chat runs six passes. The handlers are counted across the outer browser and its pane browsers together, so "where one would do" is not yet shown: it may be one per browser. A1 checks which stack answers a resize within its own browser, and that the panes still close and reopen. The script cost is small: a third of a millisecond for the node update. If the layout cost is as small, part B will find compaction under the 2ms line and C will rest on testability. That is a first sign and not part B's answer. (review 5)

**For Steve: things that happen today and may not be wanted.**

1. **Below about 1,038px, opening Party takes Narration's place**, and the tabs swap between the two. **Steve looked at the pictures and this is fine (2026-11-20).** I had called the sheet "stretched" at that width; it is not. At 1,000px it flows into two columns, the portrait beside the sections, and reads well. The pictures are taken by `tests/e2e/compaction-looks.spec.js` into `test-results/compaction-looks/`.
2. **Probably the narration, and not a fault of the resize.** In the first run some steps of the resize cost several times the others (47 calls at 700px going down, against 7 in the second run). The GM's opening was still arriving in the first run and had finished in the second, where every step is 7 to 9 calls but the one reopening, and an idle second is none. So streaming is the likely cause. It is not proved: the recorder counts no chunks, and I was wrong to say the extra calls came in multiples of six. What a streamed chunk costs is still open, and part B answers it by counting chunks against calls. (review 5)
3. **Nothing on a new fighter's sheet, or on the Inline Lab, opens past the inlined levels.** Rows with a description open in place. So the repeated section column the reviewer saw in a fixture is not something I could reach in the app, and it stays a case for a fixture. A sheet with spells or a long inventory was not tried.

#### The width rule before A3 (review 5)

Every column that shows in the dev recording is a fill column, so the recording says nothing about the rule A3 merges. The reviewer took the missing comparison in local Chromium: a plain `SvSummaryNode` asking for 300px, not a fill column, with a child that has one leaf, in an embedded browser 390px wide. It is the last column, so it stretches under the one-to-two-widths rule. Its inline width was `100%` and its flex grow and shrink zero throughout.

| Action | Rendered width | Inline minimum | Inline maximum |
| --- | --- | --- | --- |
| Show the list | 390px | 17em | 100% |
| Call `didUpdateNode()` on the list | 390px | 300px | 100% |
| Open its child | 0px (hidden) | 300px | 300px |
| Go back to the list | 390px | 17em | 100% |

So an ordinary node update changes the column's minimum from 17em to 300px (the later write from `syncMinWidthClaim()`), and the rendered width does not move. A3 must leave all four rows as they are.

#### How a part A commit is checked

`tests/e2e/compaction-recordings.spec.js` now compares a run with the baseline, step by step: the open tabs, and each stack's direction, hidden flag, widths, target, fill and width styles. A difference fails it. The pass counts are printed beside the baseline's and not asserted, since part A is meant to lower them. A run writes to its own output directory; the baseline is replaced only on purpose (`COMPACTION_BASELINE=write`), by a run that finished. `app-mobile-column-width.spec.js` now also asserts which column shows (My Sessions) and that it is no wider than the screen. (review 5)

The commit that added the comparison dropped six helpers the test still calls, so the recorder failed at its first tab lookup; the reviewer caught it. They are restored (app commit `899f07651`), and a step that has a snapshot on one side only is now reported as a difference. The repaired recorder was run on the dev build as it stood before part A: 41 steps, every layout the same as the baseline, and the same 292 calls, 530 level visits and 212 resize handlers. (review 6)


### Part A: the fixes that need no design

Each is its own commit, changes no rule, and is checked by the comparison above, the width table for A3, and the existing specs (`companion-panel`, `session-anchored-tabs`, `app-mobile-column-width`). The numbers are kept as they were, so A5 and A8 stay in the list as moved.

1. Only the root stack answers a window resize. It is bound where the browser takes its root stack: a stack asked whether it is the root while it is being made has no parent yet, and would say yes. (review) Each pane is a browser, and its root stack keeps its listener: the pane's own observer answers a change of width, while the window handler also runs when only the height changes and clears the cached root width at once. Only the listeners of stacks below a root go. Whether a pane's root needs the window at all is left for C. (review 6)
2. One method name, `recompactBrowserChain`. The other two go.
3. One width rule in `SvNavView`, the fuller one, used by both callers. This leaves a third writer, `syncMinWidthClaim()`, which a node sync runs. A3 keeps that later write exactly as it is; it moves under one owner in C, not here. See [One method applies a width](#one-method-applies-a-width). (review 2)
4. The constants get names.
5. *Moved out: the option tile's test.* See [Two fixes that are decisions](#two-fixes-that-are-decisions).
6. *Deferred with the companion:* the bottom-edge companion is handed its height by a resize observer. It mends a read that only a bottom companion makes, and no node in the app supplies a companion.
7. `SvStackView.makeOrientationLeft` is renamed for what it does. It is the method the `"down"` direction calls, and it lays the stack out downward. The name is wanted for a real `"left"`.
8. *Moved out: which node a column's width comes from.* See [Two fixes that are decisions](#two-fixes-that-are-decisions).

#### Part A as built (2026-11-21)

Steve said to start. Five commits in strvct, each deployed to dev on its own and checked there before the next.

| Fix | Commit | What changed |
| --- | --- | --- |
| A1 | `f730b118` | `SvBrowserView` registers the root stack it makes for the window's resize; a stack no longer registers itself. Pane browsers register their roots the same way. |
| A2 | `5850899d` | `safeUpdateCompactionChain` and `updateCompactionChain` are gone; their five callers call `recompactBrowserChain`. |
| A3 | `dbf06eb4` | `makeOrientationRight` calls `updateWidthForWindow`, the one rule. Its own shorter copy is gone, and so is the second call in `syncOrientation`. `syncMinWidthClaim()` is untouched. |
| A4 | `6aef2beb` | `defaultTargetWidth` (270), `fullWidthMinWidth` (17em), `maxCompactionPasses` (5), `bottomCompanionContentRoom` (200), `narrowViewportThreshold` (540), `minInlineColumnWidth` (200). Values unchanged. |
| A7 | `a81d0557` | `SvStackView.makeOrientationLeft` is `makeOrientationDown`. |

**The checks, after every one of the five:** the recorder found the layout the same as the baseline at all 41 steps; `app-mobile-column-width` and `companion-panel` passed. From A3 on, the width table below was read too.

**What A1 saved.** Over the whole recording the chain passes fell from 292 to 193, the level visits from 530 to 299 and the resize handlers from 212 to 113. A step of the resize is now 4 to 6 passes and 3 or 4 handlers, where it was 7 to 9 and 6 or 7; the step that reopens Narration is 9, where it was 12. The handlers left should be one per browser (the outer one and each pane, open or not); I counted them and did not name which browser each belongs to. A2, A3, A4 and A7 changed no count.

**The width table, from a fixture of my own** (`tests/e2e/compaction-width-table.spec.js`: plain nodes in an embedded browser 390px wide, on dev). It was read on the build before A3 and again after, and is the same:

| Action | Rendered width | Inline minimum | Inline maximum |
| --- | ---: | --- | --- |
| Show the list | 390px | 300px | 100% |
| Call `didUpdateNode()` on the list | 390px | 300px | 100% |
| Open its child | 0px (hidden) | 300px | 300px |
| Navigate back to the list | 390px | 17em | 100% |

The first row's minimum is 300px where the reviewer's reads 17em. My mount ends in a node sync, which writes the minimum again; the other three rows agree with the reviewer's.

**Not a check of part A:** `session-anchored-tabs` fails five of its tests on dev, and did before part A. They are the gaps its last commit names (a call only the host has, Theatre opening beside Narration, a page-local character replaced by the host's party). It is not a guard for this work until it is mended.

**Not exercised:** no step of the recorder lays a stack out downward with a companion, so A7 and the 200 of A4 rest on the rename being mechanical and on `companion-panel`.

#### Two fixes that are decisions

Both were in part A and both can change what a user sees, so each is its own decision with its own acceptance case. Neither is needed for B or C. (review)

- **The option tile's test (was A5).** After a single pick, `SvOptionNodeTile` steps back when the *window* is narrower than 540px. Whether the column it would step back to is hidden is a different test: the sum of the columns against the *root* width. With two columns of the default 270px in a top-level window the two disagree only at exactly 540px. With wider columns they disagree in an ordinary window: a 400px parent and a 270px picker in a 650px window hide the parent while the picker stays open. In a narrow embedded browser inside a wide window the same follows from the two widths, though nobody has seen it yet. Asking whether the column to return to is hidden is the better rule, and it is a change. If it is adopted (review 2): the test is the visibility of the actual column to return to, on the live path in the tile's own browser; a column hidden by a docked companion counts as hidden; picking several and toggling off behave as now; and the path is checked again before the delayed step back, so a user who has already gone elsewhere stays there. **Not found in the app (2026-11-20).** The session's Settings tab, the one pane where I expected a single-pick field, shows none to a player: Steve looked, and it holds the table's status, the away-rolls rule, the invite link, delete, volume and cost. The session's Chat Model and Campaign fields are not shown there. So this stays a reasoned case with no player route known, and it is not urgent.
- **Which node a column's width comes from (was A8).** The target width, the yield floor and the thumbnail allowance are read from the column's own node; the fill test and a document's text column width from the node it presents. The Party tab (437px) presenting a solo sheet (300px) is a case where they differ, and a fill column hides the difference until a deeper tile is opened. It was found by reading; nobody has seen a sheet at the wrong width. C keeps each value's source as it is today.

  `nodeMinTileWidth` has four readers (review 2): a nav view reads its own node for its target width; an inline document reads the presented node for its text columns; a companion reads the child of its root that owns the selected path; and an anchored level reads a tab's node for the comfortable width of its pane, which is what the Party tab's 437px is for today. Moving every reader to the presented node would throw away what the host knows. If the Party pane and the sheet ever need to ask for different widths, the answer is an optional hint for that one role, defaulting to today's value.

### The thumbnail fix: its own change, after A and before B (review 4)

A column whose tiles have thumbnails is 72px wider, and it finds out by asking its first subnode. Asking can load a lazily stored list just to look at its first row (see [The thumbnail allowance](#the-thumbnail-allowance)). Mending that changes when a list loads and perhaps what a user sees, so it is not a cleanup and it is not part of C. It lands by itself after A, with its own before and after, and its result is the baseline B measures. It stands whether or not C is ever built, and C keeps an exact comparison.

Its three checks:

1. Asking for the width of a column newly bound to a pending list leaves the list pending and gives no allowance, even if the node before it had thumbnails.
2. Loading that list in the ordinary way gives the first thumbnail row its 72px.
3. Pointing the same first option at a plain node takes the allowance back to 0 with no change to the list.

The first visible frame and the settled width are both recorded, since ordinary loading may settle the allowance before anything is painted.

### Part B: measure, then decide about C

With A in place, a browser spec records two things.

- **End states.** A matrix of root widths, path depths, companion states and pins (the companion cases in a framework fixture), including a column leading into an anchored-tabs level with a deeper selection inside one of its panes, a companion that mounts docked, an inline document as the last level, and the same document with a tile opened from inside it. For each: which columns are hidden, how wide the rest are, and each companion's mode and the width it reserves. In the anchored case, the outer column must answer to the anchored level's reservation and the pane's columns to the pane's width. (review)
- **Transitions.** Resizing across each threshold in both directions, docking and undocking, going deeper and back, switching to a tab whose stack was kept off the page and returns at a different width, choosing a sibling with the same title, an embedded browser's first attachment and the first real width its container reports, and an ordinary node update after the last column has stretched to fill the row (its width styles and its rendered width, then again after it is hidden and shown), and the first visible layout of a list that has not been loaded yet, whose tiles have thumbnails. (review, review 3) Past bugs here were about order, and end states alone would not have caught them.

It also counts passes (calls apart from loops), forced layouts, and time spent in passes while a narration streams and while the window is resized. The time comes from a browser performance trace, since the thrash counter misses raw reads.

**The workloads.** (review 3)

| Workload | What is recorded |
| --- | --- |
| Streaming | A warmed, joined session with a character chosen, Narration selected, and the player at the live end of the conversation, in Chromium at 390 by 844 with the processor throttled, standing in for a phone (Steve, 2026-11-20). It is not a phone, and the result is reported as a stand-in's. One representative response replayed through the normal update path, with the same chunk sizes and cadence every run. This is the primary one: it is what a player is doing when it matters. |
| Resizing | The same session, settled, with Narration pinned and Party selected, in a browser that can be resized. Narration (600px), Party (437px) and a 1px divider need 1,038px: at 1,037px only Party shows, at 1,038px both. Start at 1,280px, take the anchored container below 1,038px and back, and record the pane closing and returning. |

The two are reported apart, each with its hardware and browser named. Compaction is counted across the outer browser and its pane browsers, nested time once. A timing on a real phone can be added later and set beside the stand-in's. Companion rules are not in these runs, since the session has no companion; they are checked in a framework fixture.

**The line, agreed before measuring (proposed by the reviewer, accepted by Steve 2026-11-20).** Compaction is costly if it takes more than **2ms at the 95th percentile per active frame**, on a 60Hz target; that is about 12% of a 16.7ms frame. The device, the path and the workloads are agreed first. Streaming and resizing are measured apart. For each, all compaction time in every frame of the workload is summed, frames that cost nothing included, with the synchronous layout it causes counted once. The speed case is made if either workload goes over the line repeatedly, or if traces repeatedly show compaction causing a missed frame even when the percentile passes. Passes per chunk, loops per resize and forced layouts explain a result; they do not establish what the user pays. (review 2)

If compaction is under the line, C rests on testability alone. Tile Container Views is not a reason for C: its first grid wraps at the edge of its container with a least cell width, which needs only the width its column is already given, as an inline document shows. Negotiating a width with the columns beside it waits for a real need, such as keeping two cells side by side by asking a neighbour to give way. (review 2) Both are good reasons; they are different sizes of reason, and Steve should see the numbers before choosing.

### Part C: claims in the views, allocation in one function

**Each level states its own claim.** A stack view answers `layerClaim()`: a small record of plain values that it works out from the model and its own state, each from the node it is read from today.

A claim holds nothing that depends on a width. `targetWidth()` today reads the available width, and on a root whose width is not cached that is a measurement, so calling it from every sync would not be the model-only comparison this plan promises. The widths are the function's other input, taken once per pass, and anything that depends on them (the cap, a full-width anchored reservation) is worked out inside the function against that one snapshot. (review 2) The level is a layer in the paper's words, and whatever it inlines is part of its claim.

| Field | From |
| --- | --- |
| axis | horizontal or vertical, from the node's orientation (vertical for anchored tabs). Which way along the axis is not in the claim; see [Four directions](#four-directions) |
| target width, yield floor | What `SvNavView.targetWidth()` and `yieldTargetWidth()` work from, **before** the cap at the available width: the larger of 270px and the node's hint, plus the thumbnail allowance (see [The thumbnail allowance](#the-thumbnail-allowance)). The function applies the cap. (review 2) |
| fills | `SvNavView.shouldCurrentlyFillAvailble()` |
| companion reservation | A number: the width its side companion holds in this pass, worked out by the companion itself (see [The companion stays where it is](#the-companion-stays-where-it-is)). Zero for a bottom companion, a tab, or none. (review 4) |
| anchored reservation | Either a fixed width, from the pins and the tabs' minimums, or a flag saying "the root's width as reported", for a level that wants the full width. `anchoredClaimWidth()` reads the root width for that case today; the flag keeps the claim free of widths and the function fills it in from the pass's snapshot. (review 3) |

**One function allocates.** `SvLayerAllocation` is given two widths (the root's width as reported, and the width to fit columns in, which differ only while a root has no width yet) and the chain's claims in order, and answers, for each level, hidden or shown and which width rule applies. It has no DOM and no views. It holds today's flat arithmetic for the columns, in one pass. It is run once per browser: the outer chain ends at an anchored level, and each pane's browser runs its own.

**The function's contract.** These are today's rules, and each is a line in `TestLayerAllocation`. (review)

- A level's sum is **itself and every level after it**: target widths of the horizontal levels, docked companions, and anchored reservations. A vertical level adds no nav width of its own, but its anchored reservation still counts, in its own sum and in every earlier level's.
- The test is applied to a **horizontal nav that is not a fill nav**: it is shown when its sum is **less than** the fitting width, and hidden when equal or more. A fill nav is always shown. A vertical nav is never hidden. (review 2)
- A target width is capped at the fitting width less one pixel, and that pixel is what keeps a lone column from being hidden by the equality.
- An anchored level that wants the full width carries the flag, and the function gives it the root width as reported in this pass.
- **Reservations can come to more than there is.** Each companion works out its room as the root width less only its own level's column, so two on different levels do not see each other. At a 1,000px root with three 270px columns and reservations of 700px on the first two levels, the first two columns are hidden and the third is shown, though the two panels together hold 1,400px. That is today's answer, seen in a browser by the reviewer, and it is one named case in the test. It is also the case a nested allocation in part D would answer differently. (review 3, review 4)
- **The cap has an edge.** At a fitting width of 2px a default column's target is 1px. At 1px the cap comes to zero, zero is treated as no answer, and the target falls back to 270px. C reproduces that, and the test has the 1px case, so that mending it later is a choice and not an accident. (review 3)
- A root that reports no width yet (an embedded browser before its container is laid out) is given the window's width for fitting columns. The companion's room uses the root width as reported. Both are kept, which is why the function takes two widths.
- A level's reservation is counted once: in that level's sum and in every earlier level's.
- A companion on a vertical level docks on the bottom edge, reserves no width, and keeps its own height rule.

**The browser runs the pass.** It walks its own chain gathering claims, calls the function, and hands each level its answer. Each view applies its own answer to itself and writes only what changed.

#### The companion stays where it is

An earlier version of this page moved the companion's arithmetic (docked, tab or hidden, and its docked length) into the function. It stays in `SvDetailView` and `SvCompanionView`. (review 4)

A side companion has all it needs before any column is hidden. Its mode comes from the root width as reported, less its own column's target. Its docked length may also use the room above that column's yield floor. Neither reads whether a column is hidden, nor another panel's reservation. Today's loop exists only because a column can read a reservation before the companion has brought it up to date.

So a pass in C goes in this order, and needs no loop:

1. Take the two widths once.
2. Work out each level's column target and yield floor against them.
3. Each side companion sizes itself from those, with the logic it has now, and gives back a number.
4. The function allocates the columns, with each reservation as an input.

What starts a pass is separate from what the pass works out. Binding a companion, a pin and a width hint each ask the owning browser for a pass, where today they lay out or compact directly; that way the first pass sees a panel that has just been mounted. The reservation itself is always worked out inside the pass, since a resize alone can change it.

This makes C the same size whatever the companion's future is. Whether it becomes the auxiliary view of [Browser Cleanup](../Browser%20Cleanup/) or is retired is Steve's to decide, and C does not wait for it. The cost is that the companion's own rules stay tested in a browser fixture and not headlessly; the function's test covers what the columns do with a reservation.

#### The thumbnail allowance

A column whose tiles have thumbnails is 72px wider, and it finds out by asking its first subnode. Three things make that less simple than it reads. (review 3)

- **The asking can load the list.** `node.subnodes().first()` goes through the subnodes getter, which loads a lazily stored list before `.first()` runs. The Bestiary makes its list lazy on purpose, since a campaign can hold hundreds of creature sheets. The reviewer saw the production method resolve a lazy list on its first call.
- **Keeping the last answer until the list changes is wrong too.** With the same first option in the same list, changing what the option points at (an image node to a plain one) took the allowance from 72px to 0. A windowed list can also gain a different first row when older rows arrive.
- **So the rule for a claim is:** ask `slotIsPendingMaterialization("subnodes")` first. While the list is pending, the claim has no thumbnail allowance and the list stays unloaded. Once it is loaded, each sync reads the first row again and a pass is asked for only when the number changes. A column bound to a new node whose list is pending does not keep the last node's 72px.

**This is a change of behaviour, so it is not in C.** Today the first layout of an unloaded list loads it, on or off the page. Under this rule the first layout may be 72px narrower until the list arrives in the ordinary way, and then corrects. It lands as [the thumbnail fix](#the-thumbnail-fix-its-own-change-after-a-and-before-b-review-4), before B, and C takes its behaviour as the one to reproduce. (review 4)

#### One method applies a width

A nav view's width is written from three places today: the two rules A3 merges, and `syncMinWidthClaim()`, which every node sync runs and which writes a minimum width. Showing a column also re-runs its orientation, which writes widths again. Under C that is a trap: a sync overwrites an allocated width, the level's claim compares equal, no pass is asked for, and nothing puts the width back. So C gives one method, `applyLayerAnswer()`, the only right to write a nav view's width, minimum and maximum, and its flex grow and shrink, which are what let a narration give way. A sync and a reveal call it with the last answer and write nothing of their own. It must be right the first time it is applied to a new view, and on the way out of being a fill column. If part B shows the node's raw minimum reaching the final styles, the answer carries it: two different raw minimums can give the same capped target. (review, review 2) `SvAnchoredTabsLayout` goes on laying out the panes inside an anchored level.

**Why this does not repeat the views' logic.** The line is between *what I need* and *who gets what*. How a column arrives at its target width, whether it fills, what its companion prefers: each stays in the view that knows it, in one place. The function sees numbers and never asks why. A new kind of level, such as a grid from Tile Container Views, states a claim and the function does not learn it exists. The companion's arithmetic does not move at all: the function is handed its result.

The risk to watch: if a claim ever needs to carry a rule and not a value, the function has started to copy a view. That is the signal to stop and put the rule back.

**Nesting and direction.** The claims are gathered by walking the nested chain, and the list keeps its order. A `"down"` level is in the list: it adds no nav width and is never hidden, and any anchored reservation it carries is counted. Because the arithmetic is flat, the function needs no tree. The nested arithmetic (each level handing its leftover width to its child) is a rule change and is in part D.

#### Four directions

`"left"` and `"up"` are not in C, but C is written so that adding them does not reopen it.

- **A direction is an axis and a way along it.** `"right"` and `"left"` are the horizontal axis; `"down"` and `"up"` the vertical. The arithmetic depends only on the axis: a `"left"` column costs the same width as a `"right"` one, and a sum does not care about order. So the claim carries the axis, and the function never learns which way a level faces. A chain that mixes `"right"` and `"left"` levels needs nothing new.
- **Which way is the view's business when it applies its answer:** the flex order, the edge its companion docks on, the side its border is drawn on.
- **The rules are worded without sides.** Columns give way "from the root end", the earliest levels first, not "from the left". A companion sits at the "far edge" of its level. The function and its test use these words, and `SvCompanionView` already speaks of an edge and a length.
- **The vertical axis is not compacted today**, in either direction: a `"down"` level is never hidden. If rows are ever to give way for height, it is the same function run on the other axis with heights, and is a part D decision.
- **A language's direction and a node's direction are two things.** Mirroring the whole interface for a right-to-left language could be done by the page's text direction, with the views writing start and end where they now write left and right, and no node changing its orientation. A node that asks for `"left"` on its own is the other case. Both come out the same in the arithmetic. Which of them a right-to-left language should use is open, and is not decided here.

#### Inline documents

Inlining is a placement, chosen edge by edge: an inlined child is drawn within its parent's extent and makes no layer of its own. So the rule for claims is that **an inlined child adds to its parent's claim, and a layered child makes its own entry in the chain.** An inline document (a character sheet) is therefore one layer to compaction, whatever it holds. What goes on inside it is CSS: its sections flow into one, two or three text columns from the width it is given, with nothing measured. That fits this plan as it is. The function gives the document a width and never looks inside. Folding a section or opening a row changes height only and asks for no pass.

Four things about it bear on the plan. The second has been seen in a framework fixture; part B records both of the first two on the Party sheet.

1. **A document fills only while it is last.** `shouldCurrentlyFillAvailble()` is true for an inline document only when no level follows it. Open a tile past the inlined levels and the document stops filling: it becomes a fixed column at its target width, and can be hidden like any other. So a sheet three text columns wide drops to one, or disappears, when a spell is opened from it. C reproduces this. Whether it is wanted is a part D question.
2. **A path through a document names the sections it passes.** Opening a tile from inside a document selects the path to the document, then the sections the tile sits in, then the tile. The stack builds a level for each node on a path, so the chain holds a level for a section the document already shows in place. **The reviewer reproduced it** (review 2): a framework browser 2,000px wide, an inline document holding a section and a tile named Destination. Before the tap the document was 2,000px wide. After it there were three visible columns of 270px: Document, Section, Destination. It is a column that repeats what is beside it. C keeps it; whether to stop building it is a part D decision. A row that opens its description in place takes another path and makes no column. In the lens model it should not exist: the path says what is visible, the placement says whether an edge makes a layer, and an inlined edge on the path makes none.
3. **`nodeMinTileWidth` means more than one thing.** For a document it is the column's target width, and it is the width of one text column inside the document. (It has two more readers; see [Two fixes that are decisions](#two-fixes-that-are-decisions).) They are read from different nodes: the target width from the column's own node, the text column width and the fill test from the node it presents (`nodePresentedNode`, as a character presents its sheet). The claim should come from one node, and I had put the presented one into part A. The review found a case where the two differ (the Party tab and a solo sheet), so that is now a separate decision and C keeps each value's source as it is.
4. **A document's real claim is a range**, and it follows from the rule above: its least is its widest inlined child, its most is its children side by side up to its maximum of text columns. It reads at one text column and uses up to its maximum. Today's claim has a target, a yield floor and a fill flag, which can say "exactly this" or "everything left" and nothing between. C keeps that. A claim with a least and a most is listed in part D, and is the same extension a grid or a table from Tile Container Views needs.

**One trigger.** `browser.setNeedsLayerAllocation()` schedules one pass for the end of the cycle. A level's sync works out its claim, which reads only the model, and asks for a pass only when the claim differs from the last one it gave. So a streamed chunk that changes no claim costs a comparison per level and no pass.

Comparing claims is not enough by itself. A stack that replaces another can have exactly the old one's claim and still never have been given an answer. So the browser is also asked for a pass whenever a stack in its chain is added, replaced, removed or put back on the page, whatever the claims say. It is asked on a real change only: `clearOtherView()` runs even when there is nothing to clear, and asking from there without looking would bring back a pass on every sync. (review, review 2)

**What is left alone in C.** An embedded browser goes on getting its width from its container's resize observer. Anchored panes keep their own layout. Every companion keeps its own sizing, side or bottom; a bottom one is handed its height (A6).

### Part D: rule changes, each its own decision

None is in C. Together they are the road from C to the one protocol described in [Compaction in the lens model](#compaction-in-the-lens-model): each brings another kind of edge, or another of the lens's decisions, under the same claims and the same allocation.

- **Document sections state claims as layers do, and the anchored layout speaks the same protocol at its edge.** A companion becoming a tab and a section becoming a tile are then one rule, an inlined edge becoming layered, with pins and folds as the user's choice within it. A pane becoming a tab is the same idea and stays with `SvAnchoredTabsLayout`, which goes on dividing the width it is given.
- **Nested allocation.** Each level hands what it has left to its child. It differs from today where a companion sits in the middle of a chain.
- **Priorities.** An order to give way in other than from the left.
- **A claim with a least and a most**, for inline documents, and for a container in Tile Container Views if one ever has to ask a neighbour to give way. A column then takes a share of the leftover width without having to be last.
- **A document that stays wide when something is opened from it**, and a level that repeats an inlined section giving way first, or not being built. See [Inline documents](#inline-documents).
- **Layout that follows width.** A level shown inline when there is room and as a column when there is not. A folded section is already a tile, so the two are the same idea at different widths.
- **`"left"` and `"up"` directions**, and compaction along the vertical axis. See [Four directions](#four-directions).
- **Direction that follows width.** A narrow root turns levels `"down"` in place of hiding columns. A single-column phone mode is the far end of this.
- **Animation.** The browser has the old answers and the new ones, so it knows what moved.

## What asks for a pass

| Asks | Detail |
| --- | --- |
| The chain changed | A stack was added, replaced, removed or put back on the page. This is asked from the stack itself, on a real change of which stack is there or whether it is on the page, and not from the path notification, which compares the path's titles joined together and so says nothing when a sibling with the same title is chosen. Mending that notification is navigation work and is not in this plan: it would wake the breadcrumbs, the URL and other listeners on more events. (review 2) It also changes which column is last and so which may fill. (review) |
| The root width changed | Window resize at the root; the container's resize observer for an embedded browser, including the first real width it reports. |
| A level's claim changed | Found by the level's own sync comparing claims. Covers a width hint, the thumbnail allowance (it follows the first subnode), the direction, a presented node, the header region. |
| A companion's claim changed | Docked or undocked by the user, or its width hint moved. The hint comes from the *embedded* browser's path notification, so this one crosses from the inner browser to the outer, and it misses a same-title sibling too. C records and keeps that. If the outer width should follow such a swap, the companion would refresh its hint on the inner chain's change and tell the outer browser only when the hint moved; that is a correction of its own, apart from C. (review 2) |
| The anchored reservation changed | Not only a pin. An ordinary tap on a tab can move a group's pin, and a tab becoming available can change the largest unpinned minimum. The level compares its reservation and asks when it differs. The test uses an anchored level that claims less than the whole root, so a stale reservation shows in the column before it. (review 2) |

A node update that changes none of these asks for nothing.

## Testing

- **Headless, new:** `TestLayerAllocation` runs whole chains through the function: depth, mixed directions with a `"down"` level at the root, middle and end (made up for the test, since a real anchored level ends its chain), an anchored reservation at the end of a chain, reservations on one level and on two, a fill column, the one-pixel margin and its 1px edge, a root with no width yet, two reservations that come to more than the root holds, an anchored level with the full-width flag, and the one-to-two-widths rule. This is the written protocol in executable form, and it covers the chain, not one level.
- **Browser fixture, for the companion, when it is taken up:** its modes, budgets, pin and hint, on the side and on the bottom edge, with the reservation, the transition and the settled box recorded apart. These rules stay in the views, so this is where they are held.
- **Browser, from part B:** the end-state matrix and the transitions, kept as a regression spec. Part C must reproduce both, and the pass counts must drop.
- **Triggers:** one browser test per row of the table above, since a missed trigger shows as a stale layout that today's run-on-everything hides.

## Risks

- **A missed trigger.** The largest risk in C. Today's cost is also its safety net. The trigger tests are the guard, and a debug flag that runs a pass on every sync and reports any difference would find the rest.
- **One pass may not equal the loop.** The evidence is now better than a reading. The reviewer ran today's loop against one sweep of companions then one of columns, using the production methods with stubbed geometry: 1,944 fixtures of two levels agreed on mode, reserved width and both hidden flags, across widths, hints, pins, starting modes and fill states. The width-hint case I could not rule out resolves in one pass, because no answer about what is hidden feeds back into either of the companion's budgets. A second run covered three levels with two companions on every pair of levels: 16,038 fixtures, all agreeing on both modes, both reserved widths and all three hidden flags, including the cases where the panels are given more than the root holds (review 3). Both runs check the arithmetic with stubbed geometry; rendered widths and the timing of observers are for the browser cases. An observer reporting a new width later is a new input and a new pass, not a second pass on old inputs. (review 2)
- **A pass at the end of the cycle could show one wrong frame.** Today the pass runs inside the sync that caused it. The transitions recording checks for it; the fallback is to run at once on a path change and defer the rest.
- **Showing a column has a side effect.** `uncollapse()` re-syncs the column's orientation and its tiles. C must keep the tiles' part of that and move the width's part into `applyLayerAnswer()`.
- **A width written behind the allocation's back.** See [One method applies a width](#one-method-applies-a-width).
- **Scale.** C touches the five classes above, about 6,900 lines between them and the anchored-tabs files. A is a few dozen lines.

## Corrections

- **To part 1.** When we chose that a tapped tile reports to the navigation entry point afterwards, I said the compaction coordinator would be the first thing to need taps to go through it beforehand. It doesn't. It needs to know the path changed, which the report gives it.
- **To the first draft.** It described the columns as a flat row and proposed a layout object that solved the whole layout. See the note at the top.
- **To the discussion on 2026-11-20.** I proposed handing an embedded browser its width from the outer pass. It already gets its width from a resize observer without measuring, so that would add a second mechanism for nothing. I also listed "a fill column with levels after it" as a case to record; only the last column can fill, so it cannot happen.
- **From the review.** I put two changes of behaviour into part A as cleanups (A5 and A8). I described an anchored-tabs level as sitting in the middle of a chain; it ends one. I said the thrash counter would check A6; it cannot see the read A6 removes. And I offered Tile Container Views as a reason for C without asking what its first grid needs.
- **From the second review.** I said the option tile's two tests disagree "only at exactly 540px" in a top-level window; that holds only for two columns of the default width. My contract said a vertical level is passed over and that equality always hides, either of which would have made a wrong headless test. And my claim called `targetWidth()`, which reads a width and can measure, while promising a comparison that reads only the model.

## Decisions

These were the recommendations; they are now the plan. Any of them can be reopened.

1. **Part A is done first, on its own, after its recordings are taken.** It is small, changes no rule, and makes B's numbers describe the design and not its accidents. A5 and A8 are not in it.
2. **Part B is measured before C is argued,** with transitions recorded as well as end states.
3. **Claims in the views, allocation in one function.** The companion's sizing stays in its views and reaches the function as a number. Keeping everything in the views would copy nothing either, but would leave the chain's rules testable only in a browser, which is how they got here.
4. **C reproduces today's flat arithmetic exactly,** including the one-to-two-widths rule, reservations that come to more than there is, and the 1px edge of the cap, so it has a pass or fail answer. Every rule change is a part D decision. There is no exception: the thumbnail fix lands before B and is part of what C reproduces.
5. **A pass runs once, at the end of the cycle,** checked against the transitions recording. If that shows a wrong frame, a path change runs its pass at once and the rest stay deferred.
6. **The names are `SvLayerAllocation`, `layerClaim()`, `setNeedsLayerAllocation()` and `TestLayerAllocation`.** A level is not always a column (it may be a row, a set of tabs or an inline document), "column" also means a text column inside a document, and the paper's word for the unit is a layer. "Compaction coordinator" stays as the plan's name.
7. **Each value in a claim keeps the source it has today** through C. (Was: the claim comes from the presented node. Withdrawn after the review.)
8. **The rules are worded by axis and end, not by side,** so `"left"` and `"up"` add nothing to the allocation.
9. **One method applies a nav view's width,** `applyLayerAnswer()`.
10. **A change to the chain asks for a pass,** as well as a change to a claim.
11. **A claim holds no widths.** The cap and a full-width anchored reservation are filled in by the function from the pass's snapshot.
12. **Part B's primary workload is narration streaming on a phone,** with a resize across 1,038px as the second, reported apart.
13. **The companion's sizing stays in `SvDetailView` and `SvCompanionView`.** C hands its reservation to the function and removes the loop by doing companions before columns.
14. **The thumbnail fix is its own change,** after A and before B.
15. **The recordings before part A start now,** and record what happens today without calling it right. (Steve, 2026-11-20)
16. **Part B's line is 2ms** at the 95th percentile per active frame, measured in Chromium at phone size with the processor throttled. (Steve, 2026-11-20)
17. **The companion's code is kept and nothing is spent on it now.** A6 and the two companion recordings wait until a node uses one. C still takes a reservation. (Steve, 2026-11-20)
18. **The first grid in Tile Container Views does not wait on this plan.** The table and the scrolling keep their place until someone checks what they need. (Steve, 2026-11-20)

### Still open

- **Whether C goes ahead, and argued how.** Steve decides with part B's numbers in hand.
- **The option tile's test** (was A5): step back when the column to return to is hidden, in place of when the window is under 540px.
- **Which node a column's width comes from** (was A8), with the Party tab and its solo sheet as the case to settle.
- **How a right-to-left language mirrors the interface:** by the page's text direction, or by nodes asking for `"left"`. The allocation is the same either way.
- **Whether to stop building a column for a section an inline document already shows.** It is built today (seen in a fixture). A part D decision.
- **Everything in part D,** each when it comes up.

## Questions for the reviewer

### Answered in the second review

All nine were answered, and the answers are folded in above. In short:

1. **The Party tab's 437px:** found by reading, not seen. The hint has four readers; keep each through C.
2. **The option tile:** the embedded case is reasoned. The disagreement is wider than 540px once columns are wider than the default. A docked companion hiding the column counts.
3. **One pass:** agreed with the loop on 1,944 two-level fixtures.
4. **Applying a width:** leave `syncMinWidthClaim()` for C; the one owner also owns flex grow and shrink.
5. **The path's titles:** not in this plan. Ask for a pass on a real change of stack.
6. **A path through an inline document:** yes, it builds a visible column for the section.
7. **What counts as costly:** 2ms at the 95th percentile per active frame, proposed.
8. **The first wrapping grid:** it only reflows; drop the dependency.
9. **Anchored tabs:** keep `SvAnchoredTabsLayout` apart for good, sharing the protocol at its edge.

### Answered in the third review

1. **Three levels and two companions:** the loop and the one sweep agreed on all 16,038 fixtures, over-allocation included. No player route makes two companions in one chain, and no app node supplies a companion at all.
2. **The thumbnail allowance on a lazy list:** asking can load the whole list, and keeping the last answer is wrong as well. Check whether the list is pending, then read the first row on each sync.
3. **The workloads:** narration streaming on a portrait phone first; a resize across 1,038px apart. The 2ms line still needs timing.

Two edits to the contract came with them, both made: the anchored reservation is a fixed width or a flag, and the 1px edge of the cap is a named case.

### Answered in the fourth review

1. **The companion's place in C:** keep its sizing in its views and hand the function a number. The loop goes because companions are done before columns, not because their arithmetic moved.
2. **The thumbnail change:** its own fix, after A and before B.
3. **Fixtures:** both work with the `nodeCompanionNode()` hook on plain nodes, with no Lab page. The reviewer built both in Chromium.
4. **Blockers:** none for the recordings.

### The fifth review

No questions were outstanding. The reviewer read the recordings and said part A can start. It corrected two claims of mine (the resize is 7 to 9 passes at 31 of 32 steps, with 12 where a pane reopens; and the cost of a streamed chunk was not measured), supplied the width comparison A3 needs, and asked for two changes to the tests, both made: the baseline is kept safe from reruns, and the width spec says which column and how wide at most.

### The sixth review (2026-11-21)

1. **A1 and the panes:** keep the listener on every browser's root stack, the panes' included, and remove only the descendants'. Dropping a pane root's listener would change when its work happens (a height-only resize, the cached root width), so it is a decision for C.
2. **The recorder was broken as committed,** and is mended (see [How a part A commit is checked](#how-a-part-a-commit-is-checked)). My note that a third run "matched the baseline" rested on a saved output and not on the committed file running; the run of 2026-11-21 is the committed file.
3. **Part A can start,** five commits with a dev deploy after each. The first deploy is also the one for the away-rolls switch check.

### For the next pass

1. **Part A is built;** see [Part A as built](#part-a-as-built-2026-11-21). Two things I would like checked: that the fixture behind my width table is a fair stand-in for yours (its first row reads 300px where yours reads 17em, for the reason given there), and whether you see anything A1 could have changed that a recorder of layouts would not show.
2. **The away-rolls switch was seen in a browser** on the first part A deploy (`tests/e2e/away-rolls-switch.spec.js`, two players on dev): drawn in Settings for owner and guest, switched off by a mouse click as the guest and back on as the owner, and both windows showed each change. Two things it turned up, neither mended: a click on the row's label does not switch it, only a click on the switch itself; and in the Settings pane at a 1,280px window the label is cut short ("GM rolls for away players after a mi…").
