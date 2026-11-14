# Capabilities & Permissions

Asking "can this caller do this here?" in one place, answered by the pool's store, so that views offer only what will be honored and a refused write is never silent.

**Status:** open; rewritten 2026-11-13 to build on the editability cascade and the Record Store, which both shipped after the first draft. The editing half is in use (`SvNode_editability`); the questions about reading, sharing and authority, and the denial path, are not.

## Context

A concrete failure in one application: a non-admin user dragged a JSON file onto an admin-only catalog. The local model accepted the change, the dirty flag fired, a save animation ran, and the write was dropped at the sync layer. The user found out on the next reload. Two layers needed a gate, and each reimplemented the same admin check.

Two things have shipped since:

- **The editability cascade.** `subtreeIsUserEditable` is a tri-state slot (null means "ask the parent"); `effectiveUserEditability()` walks up the parent and owner chain, and views ask `offersUserEdit(rawCapability)` before offering an edit, a delete, an add or a pick. It is deliberately a UI affordance, not authority: server rules remain the write gate. It is consulted by the option picker, keyboard delete and tile delete, and not yet by title editing, inspector slot editing or drops, which is exactly where the catalog failure happened.
- **The Record Store.** A pool is one document, and it is the unit of sync and of permission: a far reference "keeps nothing alive and grants no permissions", and resolving it opens the target pool under the target's own permissions.

## Proposed Shape

### 1. Close the editing gaps (small, do first)

Make title editing, inspector slot editing and drops consult `offersUserEdit()`. That alone fixes the catalog failure on the UI side: the drop isn't offered.

### 2. The pool answers for its contents

`effectiveUserEditability()` today ends the walk with `true`. Instead, a node whose chain has no opinion asks the pool it lives in, and the pool asks its store:

- `SvRecordStoreProtocol` gains an optional `callerRolesForPool(poolId)` (or `callerCanWrite(poolId)`), answered synchronously from what the store already knows: the local store says "all", the cloud store says what the pool's membership and the server rules allow.
- An optional method with a default, not a new protocol: the shape [Complete Protocols](../Complete%20Protocols/) settled on for hooks most implementers don't need.
- The answer is cached on the pool and refreshed when membership changes, so a tile pass doesn't cost a lookup per node.

This keeps one answer for the view and for the store: the store that will refuse the write is the one that told the view not to offer it.

### 3. More than editing

The cascade answers one question. The others, as optional hooks on `SvNode` with defaults, consulted the same way:

- `callerCanRead()` — default true. For hidden or partly shared content.
- `callerCanDelete()` — default: what editing says.
- `callerCanShare()` — default false.
- `callerCanCreate(aClass)` — default: what editing says. Lets a node accept edits while limiting which children may be added.

Each resolves through the cascade and then the pool, as in 2.

### 4. Refusals are never silent

When the store refuses a write anyway (stale cache, a rule the client didn't know), it posts a domain notification naming the node and the action, and the UI shows it through the existing user-alert path (`onRequestUserAlert`). The message names the thing, not the role: "You can't edit 'Monster Catalog'." The local change is rolled back with `pool.transaction()` where it ran in one.

## Why This Shape

- **One gate per question.** Views and the store ask the same thing and get the same answer.
- **Role names stay out of call sites.** "Admin" becoming "catalog editor" and "catalog publisher" changes the store's policy, not the views.
- **Per-node policy is an override.** Draft/published, locked during a long operation, read-only after archive: each is a node overriding a hook, not a new flag.

## Open Questions

- Should the cached answer ever be async-refreshed mid-session (membership changes while a pool is open), and how is that announced? Probably a notification from the store, observed by the pool, which re-syncs its views.
- Capability discovery ("what can I do here?") versus checking an attempted action: the hooks above give both, but a view that wants to hide rather than disable needs a convention.
- Is `subtreeIsUserEditable` (not stored, set by whoever builds the tree) enough for app context such as a session's copy of a character, or should those become pool facts too?
