# Protocols

Declaring interfaces and verifying conformance at runtime.

## Overview

Protocols are STRVCT's interface system. A protocol defines a set of methods that a class promises to implement. Unlike duck-typing (where you check for individual methods at call sites), protocols give the contract a name, make it inheritable, and verify it at registration time rather than at the point of use.

The most important property of the protocol system is **fail-fast verification**: when a class declares that it conforms to a protocol, the framework immediately checks that all required methods are present. **If any are missing, an error is thrown at startup** -- not later when a rarely-exercised code path happens to call the missing method. This moves an entire category of bugs from runtime surprises to immediate, deterministic failures.

The conformance check is also designed to be very fast. It uses a single set-subset operation -- each required method name is looked up in the class's `Set` of slot names in O(1). Since this runs once at startup during class registration, there is zero per-call overhead. The cost is paid once, upfront, and the guarantee holds for the lifetime of the application.

The system is inspired by Objective-C's `@protocol` and Smalltalk's message categories.

## Defining a protocol

A protocol is a subclass of `Protocol` that lists the required methods as empty instance methods:

```javascript
(class SvAudioClipProtocol extends Protocol {

    play () {
    }

    addDelegate (audioClipDelegate) {
    }

    removeDelegate (audioClipDelegate) {
    }

    stop () {
    }

}.initThisProtocol());
```

Key points:

- Call `.initThisProtocol()` instead of `.initThisClass()`. This registers the protocol and asserts the naming convention.
- The class name **must** end with `Protocol` (enforced at runtime).
- Method bodies are empty -- they exist to declare the interface, not to provide default implementations.
- Use the `@interface` JSDoc tag (not `@class`) in the file's module comment.

## Implementing a protocol

A class declares conformance by calling `addProtocol()` in its `initPrototype()` method:

```javascript
(class SvWaSound extends SvSummaryNode {

    initPrototype () {
        this.addProtocol(SvAudioClipProtocol);
    }

    play () {
        // actual implementation
    }

    addDelegate (audioClipDelegate) {
        // actual implementation
    }

    removeDelegate (audioClipDelegate) {
        // actual implementation
    }

    stop () {
        // actual implementation
    }

}.initThisClass());
```

When `addProtocol()` is called, the framework immediately checks that the class's methods satisfy the protocol. If any required method is missing, an error is thrown at class-registration time -- not later when the method would have been called.

## Verification API

The protocol system provides several methods on `ProtoClass` (available to all STRVCT classes):

| Method | Purpose |
|---|---|
| `addProtocol(protocol)` | Declare conformance; throws if methods are missing |
| `conformsToProtocol(protocol)` | Returns `true` if the class has registered the protocol |
| `assertConformsToProtocol(protocol)` | Throws if the class doesn't conform |
| `methodsConformToProtocol(protocol)` | Returns which methods satisfy the protocol |
| `implementsMethodNamesSet(set)` | Checks if the class implements a given set of method names |

On the `Protocol` class itself:

| Method | Purpose |
|---|---|
| `Protocol.allProtocols()` | Returns all registered protocol subclasses |
| `protocol.addImplementer(class)` | Records a class as an implementer (called automatically by `addProtocol`) |
| `protocol.implementers()` | Returns the set of all classes that conform to this protocol |

## Protocol inheritance

Protocols are classes, so they support inheritance. A protocol can extend another protocol to build larger interfaces from smaller ones:

```javascript
(class SvExtendedAudioProtocol extends SvAudioClipProtocol {

    seek (position) {
    }

    duration () {
    }

}.initThisProtocol());
```

A class that conforms to `SvExtendedAudioProtocol` must implement both its own methods and those inherited from `SvAudioClipProtocol`.

## Existing protocols

The framework currently declares four formal protocols:

- **`SvAudioClipProtocol`** -- playback interface: `play()`, `stop()`, `addDelegate()`, `removeDelegate()`
- **`SvAudioClipDelegateProtocol`** -- callback interface: `onSoundEnded(audioClip)`
- **`SvDragSourceProtocol`** -- drag source callbacks: `onDragSourceBegin()`, `onDragSourceDropped()`, `onDragSourceEnd()`, `acceptsDropHover()`, and others
- **`SvDragDestinationProtocol`** -- drop target callbacks: `onDragDestinationEnter()`, `onDragDestinationHover()`, `onDragDestinationExit()`, `acceptsDropHoverComplete()`, `acceptsDrop()`, and others

## Protocols vs. duck-typing

Many parts of the codebase use informal duck-typing -- checking for a method's existence before calling it:

```javascript
if (node && node.nodeAcceptsDrop) {
    node.nodeAcceptsDrop(droppedNode);
}
```

This works, but it has drawbacks:

- The interface contract is implicit -- you have to read call sites to discover what methods are expected.
- There's no early verification -- a missing method surfaces only when the code path is hit at runtime.
- There's no way to query which classes implement the interface.

Formal protocols address all three. The trade-off is a small amount of ceremony (defining the protocol class and calling `addProtocol`). For optional interfaces where not every class is expected to conform, duck-typing remains appropriate. For interfaces that represent a real contract between components, a protocol is the better choice.

## Naming conventions

- Protocol class names always end with `Protocol`: `SvAudioClipProtocol`, `SvDragSourceProtocol`
- Protocol files live alongside the classes they relate to (e.g., the audio protocols are in `library/node/audio/`)
- Delegate protocols follow the pattern `SvThingDelegateProtocol` for callback interfaces

## Related patterns

- [Categories](../Categories/index.html) -- extending classes with methods from separate files (protocols define *what* methods to implement; categories *add* methods)
- [Complete Protocols](../../Future%20Work/Complete%20Protocols/index.html) -- future work on formalizing the codebase's many undeclared protocols
