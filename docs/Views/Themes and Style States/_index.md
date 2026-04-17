# Themes and Style States

How views resolve their appearance from theme classes, style states, and node configuration.

## Overview

Every view has a visual state — selected, active, disabled, or the default unselected. A theme defines what each state looks like for each kind of view. The view asks the theme "what should I look like right now?", applies the answer, and re-asks whenever its state changes. This indirection means swapping a theme changes the appearance of the entire UI without touching any view code, and different subtrees can use different themes simultaneously.

## Style States

`SvStyledDomView` tracks three independent boolean properties: `isSelected`, `isActive`, and `isDisabled`. These combine into a single resolved state name with a fixed priority:

1. **disabled** — checked first, takes precedence over all others
2. **active** — the view is the current focus of interaction
3. **selected** — the view has been chosen but isn't the active focus
4. **unselected** — the default when none of the above apply

When any of these properties change, the view re-resolves its state and re-applies the corresponding styles from the current theme.

## Theme Architecture

The theme system is a hierarchy of named objects:

- **`SvThemeResources`** — Singleton that holds the active theme.
- **`SvTheme`** — A complete theme containing a set of theme classes.
- **`SvThemeClass`** — Defines style values for a particular kind of view (e.g. "SvTile", "TextTile", "Header"). Theme classes form a hierarchy — a class inherits from its parent, so "TextTile" inherits defaults from "SvTile" and only overrides what differs.
- **`SvThemeState`** — One state within a theme class (e.g. "selected" within "SvTile"). Contains concrete style values: color, backgroundColor, fontSize, padding, border, and dozens more.

## How a View Resolves Its Style

When a view needs to apply its current style:

1. The view reads its `themeClassName` (set on the node via `SvStyledNode`, or inherited from the parent view).
2. It asks the active theme for the `SvThemeClass` matching that name.
3. It determines its current state name (`disabled`, `active`, `selected`, or `unselected`).
4. It retrieves the `SvThemeState` for that state from the theme class.
5. The theme state applies its values to the view via named setter methods (`setColor()`, `setBackgroundColor()`, etc.).

Style values resolve up the theme class hierarchy — if "TextTile" doesn't define a `backgroundColor` for its "selected" state, the lookup walks up to "SvTile" and uses its value.

## Node-Side Configuration

Nodes control which theme class their view uses through the `themeClassName` slot on `SvStyledNode`. This slot is marked `syncsToView`, so changing it triggers a re-style automatically. The node doesn't know anything about the visual details — it just names the class, and the theme provides the rest.

## Locked Attributes

Views can lock individual style attributes via `lockedStyleAttributeSet()`. Locked attributes are skipped when a theme state applies its values, allowing a view to override specific properties that the theme would otherwise control. This is useful for views that need a fixed value regardless of state — for example, a view that must always have a transparent background.

## Switching Themes

Because all style values flow through the theme, switching the active theme on `SvThemeResources` and calling `resyncAllViews()` re-styles every view in the hierarchy. No individual view needs to be updated manually. Different regions of the UI can also use different theme class names, so a single theme can provide distinct appearances for different areas (e.g. a sidebar vs. a content panel) without any special-case logic.
