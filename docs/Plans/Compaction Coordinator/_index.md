# Compaction Coordinator

One object that decides which columns a browser shows and how wide each is, with the rules written down.

**Status:** a recommendation for discussion (2026-11-19). Nothing here is built. It is part 2 of [Browser Cleanup](../Browser%20Cleanup/); [Tile Container Views](../Tile%20Container%20Views/) waits on it. The five decisions at the end are Steve's.

## What compaction does today

A browser shows a row of columns. When they don't fit, the leftmost ones are hidden. The rule, as the code has it:

- A column is hidden when its target width, plus the target widths of every column to its right, plus any docked companion panels and anchored-tab panes to its right, is not less than the available width.
- So the columns give way from the left, and the column the user is looking at goes last.
- A column that fills the leftover width (a narration, an inline document) is never hidden. It shrinks instead.
- Hidden means `display: none`. Nothing animates.
- Only side-by-side columns take part. A stack laid out downward is skipped.

A column's target width is the larger of 270px and its node's `nodeMinTileWidth()`, plus a thumbnail allowance, capped at the available width.

## Where it lives

The decision is spread over five classes. None of them holds the whole rule.

| Class | Its part |
| --- | --- |
| `SvStackView` | Sums the widths to the right, decides hide or show for its own column, and loops the whole chain until nothing changes. |
| `SvNavView` | Target width, available width, hide and show, and the width styles. |
| `SvDetailView` | The arithmetic for a companion panel: how much room it may have. |
| `SvCompanionView` | Docked, tab or hidden, and its docked length. |
| `SvStackView_anchoredTabs` | How much width the panes claim. |

## What is wrong with it

Each of these was read from the source. The two marked "not measured" are costs I infer from the code and have not counted in a browser.

1. **It runs far more often than the layout changes.** Every stack view's `syncFromNode` ends in a full pass over the whole chain. A node update bubbles to the root, so a streamed narration re-runs it for every column on every chunk. How many passes that is per chunk is not measured.
2. **Every column answers a window resize.** Each stack view registers for the resize event, and each one recompacts the whole chain. With N columns that is N full passes per event, each looping up to five times. The source has a TODO saying only the top stack should register. Not measured.
3. **The loop exists because the decision is spread out.** `recompactBrowserChain` repeats until nothing changes, with a guard of five. The comments in `SvDetailView` and `SvCompanionView` say the inputs were made independent of the current state so that it converges. If that holds, one ordered pass would give the same answer: companions first, then columns.
4. **Three names for one method.** `safeUpdateCompactionChain`, `updateCompactionChain` and `recompactBrowserChain` all do the same thing. There are 12 call sites.
5. **The width styles are written twice.** `SvNavView.makeOrientationRight` and `SvNavView.updateWidthForWindow` hold near-copies of the same three-way rule. The second has an extra case the first lacks: the last column fills the row when the window is between one and two column widths.
6. **Views ask the window instead of the layout.** `SvOptionNodeTile` decides whether to step back after a pick by comparing the window width with 540 ("2 × 270"). What it wants to know is whether the parent column is hidden.
7. **Numbers without names.** 270, `17em`, 540, and the guard of five.
8. **No test holds the rules.** The anchored tabs have `TestAnchoredTabsLayout`, which checks their rules with no DOM. The columns have nothing like it, so every fix so far was found in a browser and guarded by a comment.

## Recommendation

### A layout object with no DOM

`SvAnchoredTabsLayout` is the model to follow. It is a plain object that is given widths and answers which panes are open and how wide. The view applies the answer. Its rules are tested headlessly.

Do the same for the columns. Working name: `SvColumnLayout`.

- **It is given** the available width and an ordered list of claims. A column's claim is its target width, its floor when it yields, whether it fills, and whether it may be hidden. A companion's claim is its preferred length, its tab length and the user's pin. An anchored stack's claim is the one number it gives today.
- **It answers** with a plan: for each column, hidden or shown, and one of three width rules (fixed, fill, full row); for each companion, its mode and length.
- **It reads nothing from the DOM.** The browser measures the available width once, as `cachedRootWidth()` does now, and hands it in.
- **It solves in one pass.** Companions first, since their room depends only on the total width and their own content column. Then columns from the right, each against the total.

### One owner, one trigger

- **The browser owns it.** Each `SvBrowserView` has one layout, so an embedded browser's columns can never be compacted by an outer one. That boundary is enforced today by where the chain walk stops.
- **One way to ask.** `browser.setNeedsColumnLayout()` marks the layout stale and schedules one pass for the end of the cycle. The scheduler already drops duplicate requests, so a hundred asks in a cycle cost one pass.
- **The plan is applied only where it changed.** The browser keeps the last plan. A pass that produces the same plan writes nothing.
- **Only the browser listens for resize.**

### The protocol, written down

| Question | Answer |
| --- | --- |
| What asks for a pass? | The path changed. The available width changed. A claim changed: a node's width hint, a companion docked or undocked, a tab pinned or unpinned. |
| What does not? | A node update that changes none of those. |
| What order do columns give way in? | From the left. Priorities, below, would change this. |
| How does a column say it cannot be hidden? | Its claim says so. A fill column says so today. |
| How does expansion reverse it? | It doesn't need to. Each pass is computed from the claims, not from the last plan, so widening the window gives the wide answer. |
| Who may measure? | The browser, once per width change. The layout and the columns never do. |

### What the views keep

- `SvNavView` keeps `collapse()` and `uncollapse()` and gains `applyColumnPlan(plan)`. It loses the decisions and one of the two copies of the width styles.
- `SvStackView` loses the sum, the per-column decision, the loop, and the three method names.
- `SvCompanionView` keeps its panel and its pin. The arithmetic for docked, tab or hidden moves into the layout.
- `SvStackView_anchoredTabs` keeps `SvAnchoredTabsLayout` for its panes and goes on supplying one claim.

### What this opens

These are the items the Browser Cleanup page lists. None is in the first build.

- **Priorities.** A claim gains an order to give way in. The first build keeps "from the left" exactly.
- **Width extension points for Tile Container Views.** A grid or a table states its claim through the same object a column does, in place of `nodeMinTileWidth()` alone.
- **Animation.** The browser has the old plan and the new one, so it knows what moved.
- **A single-column phone mode.** A different layout object behind the same plan, in place of compacting until one column is left.

## A correction to part 1

When we chose that a tapped tile reports to the navigation entry point afterwards, I said the compaction coordinator would be the first thing to need taps to go through the entry point beforehand. Having read the compaction code, it doesn't. The coordinator needs to know that the path changed, which the report already gives it. That move can wait for something that has to refuse or redirect a tap.

## Stages

1. **Record what happens now.** A browser spec that walks a matrix of window widths, path depths and companion states, and records which columns are hidden and how wide the rest are. It also counts compaction passes and forced layouts (`?thrash=count`) while a narration streams and while the window is resized. This is the reference for stage 3 and gives the two numbers not measured above.
2. **Build the layout object and its headless test.** Today's rules, not wired to any view. The test is the written protocol in executable form.
3. **Wire it in.** The browser owns the layout, the one trigger replaces the 12 call sites, the loop and the per-column resize listeners go. The stage 1 recording must come out the same, and the pass counts must drop.
4. **Then the extensions**, each its own decision: priorities, claims from containers, animation.

Stages 1 and 2 change no behaviour. Stage 3 is the only risky one, and stage 1 is what makes it checkable.

## Risks

- **One pass may not equal the loop.** That the inputs are independent of the current state is what the comments say. Stage 2's test and stage 3's recording are how to find out. If a case needs two passes, the layout can do two inside itself; the views still see one plan.
- **A pass at the end of the cycle could show one wrong frame.** Today the pass runs inside the sync that caused it. If a deferred pass paints late, the fallback is to run it at once on a path change and defer only the rest.
- **Embedded browsers before they have a width.** A companion's browser can be asked to lay out at width 0. Today that falls back to the window width so a column is shown and not hidden. The layout must keep that rule, and the stage 1 matrix must include a companion that mounts docked.
- **Scale.** This touches the five classes above. It is larger than part 1.

## Decisions

1. **A layout object with no DOM, or the same logic gathered into the browser view?** I recommend the object. It is the only form that can be tested without a browser, and the anchored tabs show it works.
2. **Reproduce today's behaviour first, or change rules in the same step?** I recommend reproducing it exactly, including the one-to-two-widths rule, so that stage 3 has a pass or fail answer. Rule changes come after, one at a time.
3. **When does a pass run?** I recommend once at the end of the cycle, checked against the stage 1 recording for a wrong frame. The alternative is at once, but only when marked stale.
4. **How much moves in stage 3?** I recommend columns and companions together, since the loop exists because of the two. Anchored panes keep their own layout and supply a claim.
5. **The name.** `SvColumnLayout`, to sit beside `SvAnchoredTabsLayout`. "Compaction coordinator" stays as the plan's name.
