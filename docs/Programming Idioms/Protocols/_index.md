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

## Protocol Verification API

| Method | Purpose & Return Value |
|---|---|
| `addProtocol(protocol)` | Registers protocol; throws startup error if any method is missing. |
| `conformsToProtocol(protocol)` | Returns `true` if class conforms to specified protocol. |
| `assertConformsToProtocol(protocol)` | Throws exception if class does not conform. |
| `methodsConformToProtocol(protocol)` | Returns array of methods satisfying the protocol. |
| `Protocol.allProtocols()` | Returns set of all registered protocol subclasses. |

---

## Formal Framework Protocols

- **`SvAudioClipProtocol`:** Audio playback interface (`play()`, `stop()`, `addDelegate()`, `removeDelegate()`).
- **`SvAudioClipDelegateProtocol`:** Callback interface (`onSoundEnded(audioClip)`).
- **`SvDragSourceProtocol`:** Drag source callbacks (`onDragSourceBegin()`, `onDragSourceDropped()`, `onDragSourceEnd()`).
- **`SvDragDestinationProtocol`:** Drop target callbacks (`onDragDestinationEnter()`, `acceptsDrop()`).
- **`SvAiRequestDelegateProtocol`:** AI HTTP request lifecycle and streaming callbacks (`onRequestBegin()`, `onStreamData()`, `onRequestComplete()`, `onRequestFailure()`).
- **`SvAiResponseParserDelegateProtocol`:** AI response stream parsing callbacks (`onParsedResponseChunk()`, `onOrphanedToolCallTag()`, `onParsedResponseComplete()`).
- **`SvImageGenerationDelegateProtocol`:** AI image generation callbacks (`onImageGenerationBegin()`, `didFetchDataUrl()`, `onImageGenerated()`, `onImageGenerationFailure()`).
- **`SvPeerConnectionDelegateProtocol`:** WebRTC peer connection and signaling server callbacks (`onPeerServerOpen()`, `onPeerConnection()`, `onOpenPeerConnection()`, `onClosePeerConnection()`).
- **`SvStreamReaderDelegateProtocol`:** SAX-style stream reader token callbacks (`onStreamTagOpen()`, `onStreamTagContent()`, `onStreamTagClose()`, `onStreamParseError()`).
- **`SvCompanionNodeProtocol`:** Companion view docking interface (`nodeCompanionNode()`, `nodeCompanionWidth()`, `nodeCompanionEdge()`).

---

## Related Guides

- [Categories](../Categories/index.html): Class extension pattern.
- [Style Guide](../Style%20Guide/index.html): Coding standards and conventions.
