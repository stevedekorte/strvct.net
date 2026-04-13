# Keyboard and Focus

Keyboard state tracking, modifier-aware key dispatch, and the responder chain for focus management.

## SvKeyboard

The browser's native keyboard handling has two gaps that matter for an application framework. First, `keydown` and `keyup` events tell you which key was just pressed but not which other keys are already held — there is no built-in API for querying current keyboard state. Second, the DOM's `focus` model is element-level: it knows which element has focus, but has no concept of a focus chain through a view hierarchy, tab-order navigation between views, or a centralized way for views to declare whether they accept keyboard input. `SvKeyboard` and the responder chain address these: a singleton tracks live key state and generates modifier-aware method names (so views handle `onShiftAKeyDown` instead of parsing modifier flags), while `ResponderDomView` layers a responder chain on top of DOM focus to manage keyboard routing through the view tree.

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
