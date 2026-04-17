# Inspirations

Frameworks and ideas that shaped STRVCT's design.

## Miller Columns

The default navigation pattern — a horizontal stack of nested tile lists — draws from Miller columns, created by Mark S. Miller in 1980 and closely related to the class hierarchy browser in Smalltalk-76. The pattern appeared in the Macintosh Finder, the NeXTSTEP File Viewer, and later macOS's column view. The NeXTSTEP implementation was the primary inspiration — its combination of columnar navigation with an object-oriented framework made the pattern feel natural for browsing object hierarchies, not just file systems. This provides spatial context as users navigate deeper into a node hierarchy, with each level visible alongside its parent.

STRVCT extends the classic Miller column pattern by allowing each level in the stack to independently choose its layout direction — vertical or horizontal — controlled by the node via `setNodeIsVertical()`. This recursive variant means a horizontal stack can contain a column whose subnodes lay out vertically, which in turn contains a row whose subnodes lay out horizontally, and so on. The alternating directions let the same navigation model serve both hierarchical browsing (vertical lists) and detail views (horizontal field layouts) without switching interaction paradigms.

## Smalltalk, Self, and Objective-C

STRVCT's object model draws from the Smalltalk tradition. Naming follows Smalltalk conventions — camelCase with `_ivar` / `ivar()` / `setIvar()` accessors. Objects are created via `clone()` rather than constructors, reflecting Self's prototype-based model. The category system, which extends classes without modifying their source files, comes directly from Objective-C (and before that, Smalltalk). The slot system for declaring instance variables echoes Smalltalk's explicit ivar declarations, and the notification center pattern traces back to Smalltalk's change/update mechanism.

## Cocoa and UIKit

The application framework layer is heavily influenced by Apple's Cocoa and UIKit:

- **Notification center** — `SvNotificationCenter` with observations mirrors `NSNotificationCenter` closely, providing publish/subscribe communication between loosely coupled components.
- **Responder chain** — `SvResponderDomView` implements `becomeFirstResponder()`, `releaseFirstResponder()`, `acceptsFirstResponder`, and `nextKeyView`, mapping directly to Cocoa's `NSResponder` / UIKit's `UIResponder` model for keyboard focus and event routing.
- **Gesture recognizers** — `SvTapGestureRecognizer`, `SvPanGestureRecognizer`, `SvPinchGestureRecognizer`, and `SvLongPressGestureRecognizer` follow the UIKit `UIGestureRecognizer` pattern, including centralized arbitration of competing gestures via `SvGestureManager`.
- **Delegate pattern** — Used throughout for communication between views, listeners, and gesture recognizers, following Cocoa's preference for delegation over subclassing.