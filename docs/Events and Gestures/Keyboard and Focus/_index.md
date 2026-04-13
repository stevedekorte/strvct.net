# Keyboard and Focus

Keyboard state tracking, modifier-aware key dispatch, and the responder chain for focus management.

## SvKeyboard

`SvKeyboard` is a singleton that tracks global keyboard state — which keys are currently pressed, modifier key status, and key code/name mapping.

## Modifier-Aware Method Names

When a key event fires, `SvKeyboard` generates a method name that includes active modifiers. For example, pressing Shift+A generates a call to `onShiftAKeyDown()`. This allows views to handle specific key combinations by simply implementing the named method.

The generated method names follow the pattern: `on[Modifiers][KeyName]Key[Down|Up]`.

## Platform Differences

- macOS: Command key maps to MetaLeft/MetaRight
- All platforms: Control, Shift, Alt (Option on macOS)
- Some OS-level shortcuts cannot be intercepted by the framework

## Responder Chain

`ResponderDomView` implements a responder chain for managing keyboard focus:

- **`acceptsFirstResponder`** — Whether a view can receive keyboard focus.
- **`becomeFirstResponder()`** / **`releaseFirstResponder()`** — Acquire or release focus.
- **`nextKeyView`** — The next view in the tab order, enabling Tab-key navigation between focusable views.

The responder chain ensures that keyboard events are routed to the focused view, and provides hooks (`willBecomeFirstResponder`) for views to prepare when receiving focus.
