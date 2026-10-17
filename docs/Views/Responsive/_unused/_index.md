# Responsive

How the view layer adapts the master-detail composition to different viewport sizes without per-screen layout code.

## Overview

Responsive behavior in STRVCT is not a separate rendering mode or set of breakpoints. The same master-detail composition that produces a multi-column Miller view on a wide desktop produces a one-column stack-with-breadcrumbs on a phone, because the stack view measures the available width and hides columns that would not fit. The model, the node graph, the tile classes, and the view hierarchy are identical in both cases; only which columns are currently visible changes.

This is the behavior described in the framework's guiding paper as *automatic collapsing* — when the viewport is too narrow to display the full chain of master-detail views, earlier columns collapse and a breadcrumb bar tracks the navigation path. It falls out of the same primitives used for navigation at any width; there is no separate mobile code path in the view hierarchy.

## The Two Mechanisms

Two orthogonal pieces of code produce the responsive effect. Understanding them separately makes the overall behavior easy to predict.

### Compaction: hiding columns that do not fit

`SvStackView.compactNavAsNeeded()` walks the stack view chain from outermost (leftmost) to innermost (rightmost), summing the target widths of all vertical nav views in the chain against the top-level viewport width (`topViewWidth()`). For each stack view in order:

- If the running sum fits, the nav view is `uncollapse()`d — its DOM element is visible.
- If the running sum overflows, the nav view is `collapse()`d — its DOM element is hidden via `display: none` and it no longer contributes to layout.

Because the walk is ordered and cumulative, it is the *earliest* columns (closest to the root of the navigation) that disappear first as width shrinks. The current (deepest) column the user is navigated into stays visible as long as possible. Horizontal nav views (e.g., top menus) are skipped in the sum — they are assumed to span the full width and are not subject to the same packing rule.

The chain is re-evaluated on window resize, orientation change, and whenever the stack view structure changes (push, pop, navigation).

### Last-column stretch: filling the slack

Compaction decides *which* columns are visible. A second method, `SvNavView.updateWidthForWindow()`, decides *how wide* the visible columns render.

For any vertical nav view:

- If `targetWidth() >= windowWidth`, the column is given `width: 100%` — it cannot achieve its target, so it takes what it can.
- If the nav view is the last visible column *and* `windowWidth < targetWidth * 2`, the column is given `width: 100%`. This is the "fill the slack" case: the viewport is wide enough to show one column but not two, so the one visible column stretches to fill rather than leaving dead space to its right.
- Otherwise the column uses its fixed `targetWidth()`.

The 2× threshold is chosen so that the transition between "one column fills the viewport" and "two columns sit side-by-side" happens at a natural breakpoint — the first viewport width where a second column could actually fit.

## Per-Node Hooks

Two node-level hooks let the domain model influence the responsive layout without overriding views:

- **`nodeMinTileWidth()`** — Returned by a node to declare a minimum width its column should render at. Used by `SvNavView.targetWidth()` as a floor against the default target. Useful for nodes whose tiles contain content that does not reflow below a certain width (e.g., a wide property inspector).
- **`nodeFillsRemainingWidth()`** — When `true`, the nav view will skip its fixed target width and stretch to fill available space when it is the last visible column, even outside the 2× stretch case. Useful for terminal views like document editors or chat logs that benefit from arbitrary extra width.

Both are queried at layout time, so a node can change its answer dynamically and the stack view will re-evaluate on the next compaction pass.

## Breadcrumbs

When columns are collapsed by the compaction pass, navigation back up the chain is provided by a breadcrumb bar rendered outside the stack itself. The breadcrumb view observes the navigation path and renders a selectable entry for each level — tapping an entry navigates the stack back to that level, at which point the deeper columns are popped and compaction re-runs against the shorter chain.

This keeps the stack view's job narrow: it is only responsible for displaying and packing columns. Back-navigation affordances, gestures (swipe-to-pop), and path visualization are concerns of the surrounding views.

## Viewport vs. Device Detection

STRVCT exposes two different pieces of information about the current environment, and they are not interchangeable:

- **`SvWebBrowserWindow.shared().width()`** returns the current viewport width in CSS pixels. This is what the compaction and stretch logic consult. It updates on window resize and orientation change. It is the right signal for any layout decision.
- **`SvWebBrowserWindow.shared().isOnMobile()`** returns whether the user-agent string matches a known mobile-device substring (iPhone, Android, etc.). It is *device detection*, not viewport detection — a narrow desktop browser window is not "mobile," and a tablet in landscape may report mobile even at desktop-class widths.

Layout code should prefer viewport width. `isOnMobile()` is appropriate for gating behavior that is genuinely device-specific — touch-only gestures, iOS/Android platform quirks, permission flows — not for choosing column widths.

## What Is Not a Layer in the Framework

A few things developers often expect to find in a responsive system are deliberately not provided by the framework:

- **There are no CSS media queries owned by the framework for column sizing.** All width decisions are made in JavaScript by the two mechanisms above, because they depend on the current stack-view chain, which CSS cannot see.
- **There is no separate "mobile view" class.** The same `SvNavView` and `SvStackView` classes render at every width.
- **There are no fixed breakpoints.** The only threshold in the layout code is the `targetWidth * 2` comparison for the last-column stretch, which is derived from the column's own target width, not a global constant.

Applications that need true breakpoint behavior (e.g., a node that renders differently below a certain width) can observe window resize notifications and change their view or tile class from `nodeViewClass()` accordingly — the framework will tear down and reconstruct the view on the next sync pass.

## iOS Safari Viewport Note (for Applications)

On iPhone Safari, the CSS viewport units `100vh`, `100svh`, and `100dvh` do not reliably subtract the animated bottom URL bar area — observed values can be ~40px larger than the actually-visible region, and `env(safe-area-inset-*)` can report 0 in the same state. This is unrelated to the framework's column-sizing machinery, but applications that host a `SvStackView` at the top level will see symptoms it causes: content at the bottom of the flex chain (the last column's footer or click-to-add tile) ends up clipped by Safari's URL bar overlay, and breadcrumbs at the top can get pushed off-screen when Safari animates.

The reliable fix is to set the page root's height from JavaScript using `window.visualViewport.height`, which reflects the true visible region in real time. A minimal implementation observes `visualViewport.resize`, `visualViewport.scroll`, and `orientationchange`, and sets `document.body.style` `min-height` and `max-height` accordingly. This is application-level glue — the framework does not prescribe a specific approach, since some apps want inner scroll views while others want body-level scrolling — but every mobile-targeted STRVCT app will need something like it.

TODO: consider bumping the base font size on small screens. Tile text that reads comfortably at desktop widths tends to look a touch small on a phone, and the available width is large enough that a 1–2pt increase below a breakpoint (say `@media (max-width: 480px)`) would improve legibility without hurting density on tablets. Framework-level or app-level CSS — defer until we have a clearer opinion on which. Not a layout bug, just a readability nit worth revisiting.

## Related

- `docs/Views/Auto-Generated Views` — How nav views, tiles, and stack views are discovered and instantiated from model nodes.
- `docs/Views/Custom Views` — Overriding view classes for domain-specific presentation.
- `docs/Naked Objects` §4.3 — The design rationale for automatic collapsing as a consequence of composable master-detail primitives.
- `docs/Events and Gestures` — Swipe gestures (including back-swipe) and touch handling.
