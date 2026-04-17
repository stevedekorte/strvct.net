# Accessibility Testing & Tuning

Validating and refining the framework's ARIA implementation across screen readers, devices, and applications.

## Overview

The core accessibility infrastructure is in place -- ARIA roles, labels, states, landmarks, live regions, focus indicators, and slot-to-ARIA metadata wiring are all implemented in the framework's view classes (see [Accessibility](../../Accessibility/index.html) documentation). What remains is testing that implementation against real assistive technology and tuning behavior for edge cases that only surface during actual screen reader use.

## VoiceOver Testing

macOS VoiceOver is the primary testing target since it's built into the development platform.

- Walk through a representative application with VoiceOver enabled (Cmd+F5)
- Verify that tile navigation announces tile content (`aria-label` from `title()`)
- Verify that field tiles announce their role, label, and current value
- Verify that boolean fields announce as checkboxes with checked state
- Verify that action fields announce as buttons with enabled/disabled state
- Verify that option lists announce as listbox with selected option
- Verify that breadcrumbs announce as navigation with current location
- Verify that `aria-live` regions announce new content (chat messages, status updates)
- Verify that landmark roles provide useful navigation shortcuts (VO+U landmarks menu)

## Tab Key / Screen Reader Interaction

The framework overrides native Tab behavior with a custom `nextKeyView` chain. This may conflict with screen reader conventions.

- Test whether VoiceOver's Tab navigation (VO+Tab) works correctly with `tabindex=-1` tiles
- Determine if the `nextKeyView` chain needs to be suspended when a screen reader is detected
- Investigate `aria-activedescendant` as an alternative to physical focus movement for tile navigation
- Verify that form fields within tiles receive focus correctly when Tab is pressed

## Navigation Announcement Mechanism

The policy is established: announce programmatic navigation, stay silent on user-initiated navigation. The mechanism needs implementation.

- Investigate whether tile-selection navigation and programmatic navigation go through different code paths in `SvStackView` / `SvNavView`
- Determine how to detect "this focus change was not a direct response to a tile selection"
- Implement `aria-live` announcements for programmatic navigation (e.g., "Start Session" navigating to Narration view)
- Test that user-initiated drill-in/drill-out does not produce redundant announcements

## Cross-Screen-Reader Testing

Different screen readers have different behaviors and ARIA support levels.

- **NVDA on Windows** -- the most popular free screen reader; test with Firefox and Chrome
- **JAWS on Windows** -- the most widely used commercial screen reader
- **TalkBack on Android** -- test with Chrome on Android
- Verify that ARIA roles, states, and properties work consistently across readers
- Document any reader-specific workarounds needed

## Per-Application Adjustments

The framework provides good defaults, but some content needs application-level attention.

- **Alternative text for images** -- the framework can't infer what a picture shows; applications must provide `alt` text for meaningful images
- **Custom views** -- any view that overrides default rendering may need custom ARIA attributes
- **Domain-specific labels** -- where auto-generated slot descriptions aren't clear enough, applications should override `title()` or provide `aria-label` overrides
- **Complex widgets** -- application-specific composite widgets (e.g., dice rollers, map views) need manual ARIA patterns

## Color Contrast Verification

The default dark theme has been reviewed for WCAG 4.5:1 contrast compliance. Remaining work:

- Run automated contrast checks (axe, Lighthouse) against a running application
- Verify contrast ratios for all interactive states (hover, focus, disabled, selected)
- Check contrast in light theme variants if applicable
- Verify that `prefers-contrast: more` media query produces sufficient enhancement
- Ensure information is not conveyed by color alone -- use shape, text, or pattern as reinforcement

## Text Resize Testing

WCAG 1.4.4 requires content to be usable at 200% text size.

- Test with browser zoom at 200%
- Verify that content reflows correctly at 320px equivalent viewport width (WCAG 1.4.10)
- Check that no content is clipped or overlapping at increased text sizes
- Verify that STRVCT's flexbox-based layout accommodates text expansion gracefully

## Focus Management Refinements

- **Focus trapping in modals** -- when a modal dialog is open, Tab should cycle within the dialog
- **Focus restoration** -- drilling out should restore focus to the tile that was drilled into
- **Skip links** -- provide a way to skip past repetitive navigation to main content
- Verify that focus is visible and meets WCAG 2.2 contrast requirements (3:1 against adjacent colors) in all themes

## Automated Regression Testing

- Evaluate integrating axe-core or similar into the test suite for automated ARIA validation
- Consider adding Playwright accessibility assertions for critical navigation paths
- Set up CI checks that flag new accessibility regressions
