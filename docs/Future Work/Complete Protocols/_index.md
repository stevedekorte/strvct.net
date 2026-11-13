# Complete Protocols

Replacing duck-typed method checks with the right kind of contract: a default on a base class, a protocol, or nothing at all.

**Status:** done (2026-11-12) for the hooks and protocol below. `tests/headless/TestHookDefaults.js` checks the defaults and the protocol; `tests/headless/TestDuckTypedChecks.js` keeps new checks from appearing.

## Context

STRVCT has a [protocol system](../../Programming%20Idioms/Protocols/) for declaring interfaces. A class adopts a protocol with `addProtocol()`, which verifies at class setup that it implements every required method; a protocol can also name optional methods (`optionalMethodNames()`). Protocols declared so far:

- **Contracts:** `SvRecordStoreProtocol` (the local, memory and cloud record stores), `SvCollapsibleRegionProtocol`, `SvAudioClipProtocol`, `SvProgressiveImageSourceProtocol`.
- **Delegates:** `SvDelegateProtocol` and its subprotocols, whose methods are all optional: `SvAudioClipDelegateProtocol`, `SvAiRequestDelegateProtocol`, `SvConversationMessageDelegateProtocol`, `SvXhrRequestDelegateProtocol`, `SvHtmlStreamReaderDelegateProtocol`, `SvImagineProImageGenerationDelegateProtocol`, `SvRzPeerConnDelegateProtocol`, `SvRzSigServerConnDelegateProtocol`.

Elsewhere the code checks whether an object has a method before calling it: `if (node && node.cssVariableDict) { … }`. These checks hide three different situations, and each wants a different fix.

## Three Kinds of Check

### 1. Optional hooks: give the base class a default

Most checks ask whether a node or view *offers* some optional behavior, because most don't. A protocol doesn't help here: it verifies classes that claim conformance, but these call sites need to know about every object, so the check would only change from `node.foo` to `node.conformsToProtocol(P)`.

The fix is a default on the common base class that does nothing or returns a neutral value. Subclasses override it, and every call site loses its check. This is the same shape as the `node*` view hints: the base class answers for everyone, and a class that wants something different says so.

| Hook | Checked in | Defined today | Default to add |
| --- | --- | --- | --- |
| `cssVariableDict()` | `SvNodeView`, app tiles | Only app classes (`UoAiChat`, `UoAiResponseMessage`) | `null`, on `SvNode` |
| `nodeAcceptsDrop(node)`, `nodeDropped(node)` | `SvTile_dragging` | `SvLinkNode` only | `false`, and do nothing, on `SvNode` |
| `keyIsComplete()`, `valueIsComplete()` | `SvFieldTile`, image and video well tiles | Slots on some message classes | `true` |
| `referencedBlobHashesSet()` | `SvObjectPool_blobs` (every pooled object) | `SvBlobNode` only | an empty set, on the storable base |

### 2. Checks for methods the base class already has: delete them

Some checks guard methods every possible receiver already inherits. They can go now:

| Method | Checked in | Already defined on |
| --- | --- | --- |
| `nodeBecameVisible()` | `SvNodeView` | `SvNode` |
| `onBrowserDropChunk(chunk)` | `SvTilesView` | `SvViewableNode` (and a do-nothing default on `SvNode`) |
| `activate()` | `SvFieldTile` (on its value view) | `SvStyledDomView` |

Before deleting each check, confirm the receiver can't be some other class (a plain `SvNode` where an `SvViewableNode` is expected, a value view that isn't an `SvStyledDomView`). Where it can, the base default belongs one level higher, as in kind 1.

The node defaults are on `SvNode`, not `SvViewableNode` where the other hints live: a view may show any node, and some aren't viewable nodes (the top bar's feedback link is an `SvTitledNode`). Defaults first put on `SvViewableNode` threw for it on every sync.

Kept: `SvTile`'s check for `didChangeNavSelection()` on its tiles view, which is just its parent view and isn't always an `SvTilesView` (inline documents, the companion). The sync scheduler has no such check: it calls whatever method it is given.

### 3. Real contracts: declare a protocol

A protocol fits when several methods must come together and are implemented by classes that share no base class that could hold them. These are the ones to declare:

**`SvJsonSerializableProtocol`**: `serializeToJson()` and `deserializeFromJson(json)`.

- Implemented by: `SvJsonGroup`, `SvJsonArrayNode`, `SvJsonDictionaryNode`, `SvField`, `SvBooleanField`, `SvPointerField`, `SvJsonNullField`, `SvDateNode`, `SvTimeNode`, `SvImageNode`, `SvToolResult`, `SvConversation`, `SvJsonIdNode`.
- The two don't always come as a pair today: `SvImageNode` and `SvJsonDictionaryNode` serialize but don't deserialize, and `SvJsonIdNode` (the base of `SvJsonGroup`) deserializes but doesn't serialize. Declaring the protocol makes each class say which it supports, perhaps as two protocols, or one with an optional half.
- The checks at call sites stay as method checks (`value.serializeToJson`, `typeof node.deserializeFromJson === "function"`): the values can be strings, numbers or `null`, and the reading checks sit in the JSON patch paths, where a rewrite would change nothing but risk. The protocol's job is the verification at class setup and the one place that documents the contract.

**`SvNodeDropTargetProtocol`**, only if a second drop target appears. With `SvLinkNode` as the only implementer, the defaults in kind 1 are simpler.

Not a protocol: storage. `recordForStore()` and `loadFromRecord()` are categories on `Object`, `ProtoClass` and the built-ins (`Array_store`, `Map_store`, …), so every object already has them. Protocols can only be adopted by `ProtoClass` subclasses today, so built-ins couldn't declare conformance anyway.

## Approach

1. **Defaults (kind 1).** For each hook: add the default to the base class, delete the checks at its call sites, and check the app (`Uo*`) for overrides that relied on the method being absent.
2. **Deletions (kind 2).** Confirm each receiver's class, then delete the check.
3. **Protocols (kind 3).** Declare `SvJsonSerializableProtocol`, have each implementer adopt it, and settle the pairs that are half implemented.
4. **Keep it from coming back.** A headless test that lists the remaining `if (x && x.method)` checks in `source/`, with an allowance for the deliberate ones (values that can be primitives), so a new check is noticed when it's added.

Each step stands alone and changes no behavior: kind 1 replaces a check with a default that gives the same answer, kind 2 removes a check that always passed, and kind 3 adds verification at class setup.

## Benefits

- **Less code at call sites.** Most checks disappear rather than being rewritten.
- **One place to look.** A hook's default on the base class documents it: its name, what it's for, what it returns when a class doesn't care.
- **Early errors where they help.** A class that adopts `SvJsonSerializableProtocol` but lacks a method fails at startup, not when its JSON is first exported.
- **Consistency with node hints.** Optional behavior works the same way throughout: the base class answers, subclasses override.
