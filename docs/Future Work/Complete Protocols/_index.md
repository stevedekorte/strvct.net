# Complete Protocols

Formalizing the many undeclared interface contracts throughout the codebase.

## Context

STRVCT has a [protocol system](../../Programming%20Idioms/Protocols/index.html) for declaring interfaces and verifying conformance at class-registration time. In practice, only a handful of protocols have been formally declared (audio clip, audio clip delegate, drag source, drag destination). The rest of the codebase relies on informal duck-typing -- checking for a method's existence before calling it, or simply assuming it exists based on context.

This means there are many implicit protocols scattered throughout the framework: sets of methods that classes are expected to implement but that have no formal declaration, no early verification, and no central documentation.

## Examples of Undeclared Protocols

These are recurring interface patterns in the codebase that are currently enforced by convention rather than by protocol declarations:

### Node drop protocol

Used by tile views to ask a node whether it accepts a dropped item:

- `nodeAcceptsDrop(node)` -- returns whether the drop is allowed
- `nodeDropped(node)` -- handles the actual drop

Currently checked with `if (node && node.nodeAcceptsDrop)` at call sites. A formal `SvNodeDropProtocol` would make the contract explicit.

### Delegate protocols

The framework uses a delegation pattern in many places beyond audio. Any class that accepts delegates and calls methods on them defines an implicit protocol. Formalizing these as `SvThingDelegateProtocol` classes would:

- Document which callbacks a delegate must implement
- Catch missing delegate methods early
- Make it easy to find all delegate interfaces in the codebase

### Serialization protocols

Classes that participate in persistence implement methods like `recordForStore()`, `loadFromRecord()`, and `referencedBlobHashesSet()`. Classes that participate in JSON exchange implement `serializeToJson()` and `deserializeFromJson()`. These are currently expected by convention -- a formal protocol would verify that a class claiming to be storable actually implements all the required methods.

### View protocols

Node views implement a set of methods for synchronization (`syncToNode()`, `syncFromNode()`), lifecycle (`prepareToRetire()`), and display (`postNeedsDisplay()`). These expectations are implicit -- a formal protocol would clarify the minimal interface a view must provide.

## Approach

The work is incremental and non-breaking. Each undeclared protocol can be formalized independently:

1. **Identify the contract.** Find all the method names that call sites expect on the target objects.
2. **Create the Protocol subclass.** List those methods as empty declarations in a new `Protocol` subclass.
3. **Register conformance.** Add `addProtocol()` calls to classes that implement the interface.
4. **Verify.** The framework's existing verification machinery checks method presence at registration time. Any missing implementations surface immediately.

No existing behavior changes -- the methods already exist on the classes. The protocol declaration simply makes the contract explicit and verifiable.

## Benefits

- **Self-documenting interfaces.** Each protocol class is a readable list of required methods, replacing the need to read call sites to discover the contract.
- **Early error detection.** A class that claims conformance but is missing a method throws at startup, not when the code path is eventually hit.
- **Queryable.** `Protocol.allProtocols()` and `protocol.implementers()` provide runtime introspection of which classes implement which interfaces.
- **Inheritance.** Protocols can extend other protocols, building larger contracts from smaller ones without repeating method lists.

## Scope

This is an ongoing improvement, not a single task. The codebase has dozens of implicit protocols. Formalizing them should happen organically -- when working in an area of the code, identify the implicit contracts and declare them as protocols. Priority should go to contracts that:

- Are implemented by many classes (high fan-out)
- Have been a source of bugs from missing methods
- Would benefit from being documented as a discrete interface
