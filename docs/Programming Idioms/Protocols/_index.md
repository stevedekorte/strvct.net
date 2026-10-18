# Protocols

Declaring interfaces and verifying conformance at runtime with fail-fast registration checks.

## Overview

Protocols are STRVCT's interface system. A protocol defines a set of methods that a class promises to implement. Unlike informal duck-typing (where code checks for individual methods at call sites), protocols name the contract, support inheritance, and verify conformance at class registration time.

The defining feature of STRVCT's protocol engine is **fail-fast verification**: when a class declares conformance to a protocol via `addProtocol()`, the framework immediately verifies that all required methods exist. If any method is missing, an error is thrown at startup—moving bugs from rare runtime surprises to instant, deterministic startup failures.

<svg viewBox="0 0 820 220" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="apr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="170"/>
  <text x="40" y="42" class="b">Protocol Declaration</text>

  <rect class="fill" x="40" y="60" width="210" height="40"/>
  <text x="55" y="80" class="b">SvAudioClipProtocol</text>
  <text x="55" y="93" class="dim">Extends Protocol class</text>

  <rect class="fill" x="40" y="115" width="210" height="40"/>
  <text x="55" y="135" class="b">.initThisProtocol()</text>
  <text x="55" y="148" class="dim">Registers interface stubs</text>

  <line class="flow" x1="265" y1="105" x2="290" y2="105" marker-end="url(#apr)"/>

  <rect class="fill" x="290" y="20" width="240" height="170"/>
  <text x="305" y="42" class="b">Implementer Class</text>

  <rect class="box" x="305" y="60" width="210" height="40"/>
  <text x="320" y="80" class="b">initPrototype()</text>
  <text x="320" y="93" class="dim">this.addProtocol(Protocol)</text>

  <rect class="box" x="305" y="115" width="210" height="40"/>
  <text x="320" y="135" class="b">Method Implementations</text>
  <text x="320" y="148" class="dim">play(), stop(), addDelegate()</text>

  <line class="flow" x1="530" y1="105" x2="555" y2="105" marker-end="url(#apr)"/>

  <rect class="box" x="555" y="20" width="240" height="170"/>
  <text x="570" y="42" class="b">Startup Conformance Check</text>

  <rect class="fill" x="570" y="60" width="210" height="40"/>
  <text x="585" y="80" class="b">Set Intersection O(1)</text>
  <text x="585" y="93" class="dim">Verifies required methods</text>

  <rect class="fill" x="570" y="115" width="210" height="40"/>
  <text x="585" y="135" class="b">Pass or Instant Error</text>
  <text x="585" y="148" class="dim">Fails fast at boot if missing</text>
</svg>

---

## Defining a Protocol (`.initThisProtocol()`)

A protocol inherits from `Protocol` and declares empty method stubs representing the interface:

```javascript
(class SvAudioClipProtocol extends Protocol {

    play () {
    }

    stop () {
    }

    addDelegate (audioClipDelegate) {
    }

    removeDelegate (audioClipDelegate) {
    }

}.initThisProtocol());
```

### Protocol Rules:
- Execute `.initThisProtocol()` at class registration.
- Class name **must** end with `Protocol` (enforced at startup).
- Method bodies are empty stubs defining expected parameters.

---

## Implementing & Verifying a Protocol (`addProtocol`)

Implementers call `addProtocol()` inside `initPrototype()`:

```javascript
(class SvWaSound extends SvSummaryNode {

    initPrototype () {
        this.addProtocol(SvAudioClipProtocol);
    }

    play () {
        // Implementation
    }

    stop () {
        // Implementation
    }

    addDelegate (delegate) {
        // Implementation
    }

    removeDelegate (delegate) {
        // Implementation
    }

}.initThisClass());
```

---

## Required and Optional Methods

`addProtocol()` checks only a protocol's **required** methods. A protocol names the ones an adopter may leave out with the static `optionalMethodNames()`; by default there are none, so every declared method is required.

```javascript
(class SvExampleProtocol extends Protocol {

    static optionalMethodNames () {
        return ["describe"];
    }

    play () {
    }

    describe () {
    }

}.initThisProtocol());
```

---

## Delegate Protocols

A **delegate protocol** declares the messages one kind of object sends its delegate through `sendDelegateMessage()`. A delegate implements only the messages it cares about, so a delegate protocol extends `SvDelegateProtocol`, which makes every message optional. Adopting one declares who listens; it never fails.

Name a delegate protocol after its sender (`SvHtmlStreamReader` → `SvHtmlStreamReaderDelegateProtocol`), and declare exactly what the sender sends, with the arguments it sends them with:

```javascript
(class SvHtmlStreamReaderDelegateProtocol extends SvDelegateProtocol {

    onHtmlStreamReaderPushNode (reader, node) {
    }

    // ...

}.initThisProtocol());
```

The **sender** names its protocol:

```javascript
delegateProtocol () {
    return SvHtmlStreamReaderDelegateProtocol;
}
```

and each **delegate** adopts it in `initPrototype()` with `this.addProtocol(SvHtmlStreamReaderDelegateProtocol)`.

Two checks keep the declaration and the code from drifting apart:

- **At runtime**, `sendDelegateMessage()` warns once per sender class and message when a sender that names a protocol sends a message the protocol does not declare.
- **In tests**, `tests/headless/TestDelegateProtocols.js` scans the source. Every message a sender sends must be declared, every declared message must be sent (a declared message nobody sends is an invented interface), and every delegate protocol must be named by a sender.

A protocol file loads before any class that adopts it: list it first in its folder's `_imports.json`, or in a folder that loads earlier.

---

## Protocol Verification API

| Method | Purpose & Return Value |
|---|---|
| `addProtocol(protocol)` | Registers the protocol; throws if a required method is missing. |
| `conformsToProtocol(protocol)` | `true` if the class has added the protocol. |
| `assertConformsToProtocol(protocol)` | Throws if the class has not added the protocol. |
| `methodsConformToProtocol(protocol)` | `true` if the object implements every required method. |
| `Protocol.protocolMethodNames()` | Every method the protocol declares, including those of ancestor protocols. |
| `Protocol.optionalMethodNames()` / `requiredMethodNames()` | The declared methods an adopter may leave out / must implement. |
| `Protocol.declaresMethodNamed(name)` | Whether the protocol declares the method (required or optional). |
| `Protocol.allProtocols()` | Every protocol class. |

---

## Framework Protocols

The protocol files are the source of truth. These are the ones the framework declares:

**Capabilities** (every method required)

- **`SvAudioClipProtocol`:** something that plays (`play()`, `stop()`, `addDelegate()`, `removeDelegate()`).
- **`SvRecordStoreProtocol`:** a record store: local, memory or cloud.
- **`SvProgressiveImageSourceProtocol`:** a node whose image arrives in stages (aspect ratio, preview, working, failed).
- **`SvCollapsibleRegionProtocol`:** a region that expands and collapses (`isExpanded()`, `toggleExpanded()`, `collapsibleAxis()`).
- **`SvDragSourceProtocol`** and **`SvDragDestinationProtocol`:** the two ends of a drag (`onDragSource…`, `onDragDestination…`, `acceptsDrop…`).

**Delegate protocols** (every message optional)

| Protocol | Sender | Delegates |
|---|---|---|
| `SvAudioClipDelegateProtocol` | an audio clip | `SvAudioQueue` |
| `SvHtmlStreamReaderDelegateProtocol` | `SvHtmlStreamReader` | `SvAiParsedResponseMessage` |
| `SvXhrRequestDelegateProtocol` | `SvXhrRequest` | `SvAiRequest`, `SvFileToDownload` |
| `SvAiRequestDelegateProtocol` | `SvAiRequest` | `SvAiResponseMessage` |
| `SvConversationMessageDelegateProtocol` | `SvConversationMessage` and its subclasses | `SvConversation` |
| `SvImagineProImageGenerationDelegateProtocol` | `SvImagineProImageGeneration` | — |
| `SvRzSigServerConnDelegateProtocol` | `SvRzSigServerConn` | — |
| `SvRzPeerConnDelegateProtocol` | `SvRzPeerConn` | — |

---

## Related Guides

- [Categories](../Categories/index.html): Class extension pattern.
- [Style Guide](../Style%20Guide/index.html): Coding standards and conventions.
