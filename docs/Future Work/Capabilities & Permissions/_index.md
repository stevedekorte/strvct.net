# Capabilities & Permissions

A node-level permissions protocol with a pluggable storage-layer ACL, so the framework can ask "can this caller do this here?" without baking specific roles into call sites.

## Context

STRVCT currently has no first-class concept of who-can-do-what. Permission checks are scattered and ad-hoc: a sync method might consult an `isAdmin` flag; a drop target might just accept anything; a "save" path might silently swallow writes that the backend will reject anyway. Each new feature reinvents the gate, usually as a role check coupled to whatever auth provider is in play (Firebase custom claims today, something else tomorrow).

A concrete failure mode this produced in one application: a non-admin user dragged a JSON file onto an admin-only catalog. The local model accepted the mutation, the dirty flag fired, a "save" animation ran (because an unrelated dirty subsystem was synced), and the change was silently dropped at the sync layer — the user only discovered the loss on the next reload. Two layers needed gates and neither was generic.

## Proposed Shape

### Node-level protocol

A capability-style protocol on `SvNode`, asking the *write/read/delete* question rather than the *role* question:

- `callerCanRead()` — default `true`
- `callerCanWrite()` — default `true`
- `callerCanDelete()` — default `callerCanWrite()`
- `callerCanShare()` — default `false`

Nodes that need gating override the relevant method. Subnode containers gate drops, the inspector hides edit affordances, the sync layer asks the same question before pushing. The model never asks "is the caller admin?" — it asks "can the caller write here?"

### Scope-level resolver

The default node implementation walks up the parent chain to find the enclosing scope-root and delegates to a scope-resolver:

- `scopeRoot.callerHasRole("editor" | "owner" | "member" | "viewer")`
- Default rule: check membership records (e.g. `_members` collection) for the current authenticated user

The mapping from "what does write require here?" to "is the caller's role sufficient?" lives once, at the scope level, not at every gate site. Switching a scope from open to admin-only is a one-line policy change, not a hunt-and-replace through gate sites.

### Storage-services protocol

The scope-resolver talks to the storage layer through a thin abstraction so the answer is consistent locally and remotely:

- `SvStorageBackend.callerHasRoleOnScope(scopeRootId, role)` — async
- Backends (Firestore, IndexedDB, LevelDB, in-memory test stub) all implement the same query
- The Firestore backend implementation is the one whose answer matches the rules.firestore policy verbatim — so the client gate cannot disagree with the server enforcement

For backends without real auth (local-only IndexedDB), the implementation returns `true` for every role check, because there's nothing to gate against.

### Surfacing denials

Failed writes shouldn't be silent. The framework needs one consistent path for "the model rejected this":

- Posting a domain notification (`SvNotification`) like `SvPermissionDeniedNote` with the action and target, observable by views to surface a toast/panel
- The error message is generic: "You don't have permission to edit '{title}'." — no leaking of underlying role names

## Why this matters

- **Replaces today's two-layer hack**: UI gate + sync-layer silent-fail-clear, each reimplementing the same admin check. One protocol answers both.
- **Decouples role names from gate sites**: when "admin" splits into "catalog-editor", "catalog-publisher", "catalog-reviewer", only the scope policy changes, not the call sites.
- **Enables per-node policies**: features like draft/published states, soft-locks during long-running operations, or "read-only after archive" become node-method overrides instead of new flags scattered across the codebase.
- **Matches the storage model**: Cloud-Nodes-style designs already model permissions as scope membership. The client protocol mirrors that, so client and server stay in sync without duplicating the logic in two places.

## Open Questions

- Should permission checks be sync (cheap, may be stale) or async (authoritative, requires Promise threading through call sites)? Sync default with an async escape hatch is the likely answer.
- How to cache role lookups so a tile-rendering pass doesn't fire one auth round-trip per node.
- Should the protocol cover *capability discovery* — i.e., "what actions can the current caller take on this node?" — or only verification of attempted actions? The former enables hide-vs-disable UI affordances cleanly.
- Whether to add `callerCanCreate(childClass)` as a separate hook from `callerCanWrite()`, so a node can permit edits to itself while restricting which kinds of children may be added.
