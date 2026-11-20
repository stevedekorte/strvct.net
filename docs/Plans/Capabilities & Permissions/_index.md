# Capabilities & Permissions

Asking "can this caller do this here?" in one place, answered by the pool's store, so that views offer only what will be honored and a refused write is never silent.

**Status:** built; seen working in a browser through the model on 2026-11-19, and the refusals through the views are still to see ([Meta Plan](../Meta%20Plan/#a-a-browser-pass-over-steps-2-to-5), step A). Rewritten 2026-11-13 to build on the editability cascade and the Record Store, which both shipped after the first draft. The editing half is in use (`SvNode_editability`); the questions about reading, sharing and authority, and the denial path, are not. Step 1 is done (2026-11-16): every edit path in the view layer asks the cascade, and a test keeps it so. The rest was agreed and built 2026-11-17 as [the design questions](#design-questions-for-steps-2-to-4) settle it: the server says who may write, the pool's answer is the cascade's default, and a refused commit reloads and says so. Checked headless, with the server's contract tests on the Firestore backing, and in a browser against `just launch` (a forced save refused 403, reloaded and said; `editability-browser-pass.spec.js`); not yet on the Spanner backing.

## Context

A concrete failure in one application: a non-admin user dragged a JSON file onto an admin-only catalog. The local model accepted the change, the dirty flag fired, a save animation ran, and the write was dropped at the sync layer. The user found out on the next reload. Two layers needed a gate, and each reimplemented the same admin check.

Two things have shipped since:

- **The editability cascade.** `subtreeIsUserEditable` is a tri-state slot (null means "ask the parent"); `effectiveUserEditability()` walks up the parent and owner chain, and views ask `offersUserEdit(rawCapability)` before offering an edit, a delete, an add or a pick. It is deliberately a UI affordance, not authority: server rules remain the write gate. Since 2026-11-16 every edit path in the view layer consults it (step 1 below).
- **The Record Store.** A pool is one document, and it is the unit of sync and of permission: a far reference "keeps nothing alive and grants no permissions", and resolving it opens the target pool under the target's own permissions.

## Proposed Shape

### 1. Close the editing gaps — done (2026-11-16)

Every edit path in the view layer now asks the cascade, which fixes the catalog failure on the UI side. Before, field values, add and delete asked; these did not:

- **Titles and subtitles** (`SvTitledTile`, `SvActionFieldTile`).
- **Dragging a node in, and reordering** (`SvTilesView.acceptsDropHover()`, `SvTile.acceptsDropHoverComplete()`, `canReorderTiles()`).
- **Dragging a node out.** A move removes the node from its list, so from a read-only list a drag is a copy.
- **Dropping a file from the desktop** (`SvTilesView.onBrowserDropChunk()`). It is refused with a message rather than silently: the node's `noteUserEditRefused()` posts `onRequestUserAlert`, "You can't edit 'Monster Catalog'." The app's own catalog drop gate, which did this for two classes, is gone.
- **Field paths the first audit missed:** the option picker's toggle, the video well, the chat input.

`tests/headless/TestEditabilityCascade.js` checks the cascade's answers and the refusal message. `tests/headless/TestEditabilityInViews.js` scans the view layer for a raw capability read (`nodeCanEditTitle()`, `canDelete()`, `valueIsEditable()`, `acceptsAddingSubnode()`, …) without `offersUserEdit()`; run over the code before this step it finds all 11 sites. Checked headless only.

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

## Design Questions for Steps 2 to 4

**Agreed and built 2026-11-17.** Each answer is given with its reasoning; [What Was Built](#what-was-built) lists where it differs. Where one changes a step above, it says so.

What the code did before, which these were built on:

- The client decides "may this person edit the catalog?" from the `role: "admin"` claim in the sign-in token (`UoModel.callerIsAdmin()`). The server decides from the caller's row in the scope's `_members` (`assertCanWrite`: owner or editor). The server's own notes call membership "the enforced definition" and the claim "a separate auth-side concern". The two can disagree in both directions.
- The server already looks the caller's role up on every read (`assertCanRead`), and does not send it back.
- A pool does not know its scope. The scope is on the pool's root row on the server; the app passes it as a commit option.
- The client threw the server's error code away. The server replies `403` with `code: "permission-denied"` in the body; the request layer kept only the number, so `SvCloudRecordStore`'s test for a refusal never matched in production and a refused commit was thrown as an unknown failure. (`UoSessions` matched the message text to work around it.) `UoFsBackend.errorCodeNameFor()` now passes the code on.
- A refused commit comes back as `{ status: "refused", reason }` for four different causes (permission, invalid argument, failed precondition, not signed in). `UoCloudDocument` rethrows all four as one error, nothing tells the user, and the local edit stays dirty and is retried on every sync pass.
- A conflict, by contrast, has a finished path: reload from the cloud, check whether the reload lost anything the refused commit carried, and tell the user only if it did (`handleWriteConflict`).
- A guest's session is a replica: a pool the guest can never commit, in which the guest still types, picks and rolls. Those travel to the host as messages.

### Q1. Where does the answer come from, and what about the admin claim?

**Recommendation: the server answers, with every pool read, and the client stops consulting the admin claim for editing.**

- The read functions add `callerCanWrite` (a boolean) to what they return for a pool. The lookup is already done, so it costs nothing, and the answer can't be older than the data it arrives with.
- A boolean, not the role name. "Owner or editor may write" is the server's rule; if it becomes "catalog publisher", no client code changes. A role name on the client is the same mistake as the admin check, one level down. If a view later needs "owner" for sharing, that is its own question (Q4).
- The cloud store keeps the answer per pool; the pool asks its store. `SvRecordStoreProtocol` gains an optional `callerCanWritePool(poolId)` whose default is true, which is what the local and memory stores say.
- `UoGenres.subtreeIsUserEditable()` and `UoPublicCatalogCollection.callerCanEdit()` then read that answer and the admin check behind them goes. The claim keeps its real job, gating the admin site and `bootstrapRoot`.

Why not make admins editors and keep the client check: `grantCatalogAdmin` already does make them owners, so today the two usually agree. But "usually" is the problem: two rules that agree by convention drift, and the failure when they drift is the silent loss this plan exists to end. One rule, asked of the party that enforces it, cannot drift.

**Before the answer is known.** A pool made on this device, or in the caller's own scope, is writable: no server is needed to know that. A pool opened from the local mirror before the cloud has been reached uses the last answer, kept with the mirror, so an offline start looks like the last session. Otherwise not offered until the read lands, which is the same moment the content does.

### Q2. How does the store's answer combine with the cascade?

**Recommendation: the pool's answer replaces the cascade's final `true`. The nearest node opinion still wins, in both directions.** This changes what I first proposed (the store's answer always wins).

"The store only ever restricts" is the obvious rule and it breaks sessions. A guest's replica pool is unwritable by design, so the rule would turn off the guest's chat input, option picks and dice, all of which are legitimate: they are not edits of the pool, they are messages to the host. Since step 1 the chat input asks the cascade (rightly: a non-editor should not drive a catalog campaign's assistant), so this is not hypothetical.

So the question the cascade answers stays "should an edit be offered here?", and the pool supplies the default for everything under it:

- No opinion anywhere in the chain: the pool's answer. This covers the catalog with no app code.
- A node says `false`: read-only, whatever the pool says (a session's party).
- A node says `true`: offered, whatever the pool says. It is a statement that input here does not travel through this pool's commit. The guest's session surface declares it once.

The risk is someone setting `true` to quiet a read-only complaint and bringing the silent loss back. Q3 is the backstop: a refused write is announced, so the mistake is loud the first time it runs.

This also settles the last open question in the first draft: `subtreeIsUserEditable` and the pool's answer are different facts and both stay. The pool says whether the store will take a write; a node opinion says what the app means here.

### Q3. What happens to an edit the server refuses anyway?

**Recommendation: reload the document and tell the user, by the path conflicts already use. Only for a permission refusal.**

First, the four causes need to stop being one. The store passes the code through (`{ status: "refused", code, reason }`), and each gets what it needs:

| Refusal | What it means | Response |
| --- | --- | --- |
| `permission-denied` | The caller may not write here | Reload from the cloud; tell the user if something was lost; the pool's answer becomes false, so the views go read-only |
| `unauthenticated` | The sign-in lapsed | Keep the edits; ask the user to sign in; the next save sends them |
| `invalid-argument`, `failed-precondition` | A bug: the client sent something malformed | Keep the edits; report the error; do not reload |

Dropping edits over a lapsed sign-in or over our own bug would be data loss we caused. Only the permission case has no future in which the edit can be saved.

For that case, reload rather than keep-and-mark:

- An edit that can never be saved is not a draft, it is a fork. It stays dirty, is retried every pass (the "403 storm" `UoSessions.onChildCloudSaveFailed` was written to stop), and shows this user a document nobody else sees.
- The machinery exists and has been exercised: `handleWriteConflict` reloads and asks `holdsCommitContent()` whether anything was lost. Usually a refused commit carries only defaults filled on load, and then nothing need be said.
- The message is `noteUserEditRefused()`'s, extended: "You can't edit 'Monster Catalog'. Your change wasn't kept."

The first draft said to roll back with `pool.transaction()`. That cannot work: the commit runs later and asynchronously, long after the edit's transaction closed.

Two details. The refused commit's content goes to the error report, so support can recover a real loss. And `UoSessions`' test of the message text (`/not an editor/`) to spot a deleted scope becomes a test of the code.

Each refusal is also a measurement: it means a view offered something it should not have. Reported, they are the list of gaps left in Q1 and Q2.

### Q4. Read, delete, share, create (step 3 above)

**Recommendation: not now. Add each one when a view offers something the server refuses.**

- Nothing calls them, and four hooks with defaults are four places to be subtly wrong with no test that matters.
- Reading needs no client gate: the server does not send what the caller may not read.
- Delete and create follow editing today, on client and server alike.
- Sharing is the one with a real separate rule (an invite needs the scope's owner). When the invite action is next touched it gets `callerCanShare`, answered the same way as Q1.

Q3's refusal reports say when this is wrong: a refusal for an action that editing allowed is the signal to add its hook.

### Q5. Roles that change mid-session

**Recommendation: no push. The answer refreshes on every read of the pool, on a refusal, and when an invite is accepted.**

Roles change rarely, and the cost of a stale answer is bounded by Q3: one refused edit, a clear message, and the answer corrected by the refusal itself. A live channel for membership is more moving parts than that cost justifies. When the answer changes, the pool tells its root, which re-syncs its views.

### Hide or disable?

**Recommendation: no new convention; keep what step 1 does.** Content stays where it is and renders read-only (a title that can't be edited, a field with no caret). A control whose only purpose is the edit is not shown (the add button, the delete swipe). A layout that reflows by permission would make the same document look different to an editor and a reader for no gain.

### What Was Built

In the order suggested: Q3, then Q1, then Q2. Q4 and Q5 need no work until something calls for them.

- **Q3.** `SvCloudRecordStore.asyncCommit()` answers `{ status: "refused", code, reason }`, and the pool adds the commit it sent. `UoCloudDocument.handleRefusedCommit()` does what the table says; a permission refusal reloads by the conflict path and tells the user once (`noteUserEditRefused("Your change wasn't kept.")`), with the commit's content in the error report. Every refusal is still thrown, with its code, so a folder can reconcile it. App test: `TestRefusedCommit.js`.
- **Q1.** The server's `openPool`, `readChanges` and the scope listing return `callerCanWrite`, from one rule (`roleMayWrite`) that `assertCanWrite` also uses; both backings, with a contract test. `SvCloudRecordStore` remembers the answer per pool and per scope (`callerCanWritePool()`, `callerCanWriteScope()`), and a commit taken or refused for permission updates it. Framework test: `TestCloudWriteAnswers.js`.
- **Q2.** `SvObjectPool.callerCanWrite` holds the answer, set when a document's pool is opened from the cloud or commits. `effectiveUserEditability()` makes a pool's root read-only when it is false. `UoClientSession` says `true`. `TestEditabilityCascade.js` covers it.

Where it differs from the answers above:

- **A store's "yes" is no opinion.** Only its "no" enters the cascade. Otherwise a writable document inside a deliberately read-only place (a session's party) would become editable again.
- **No protocol method.** Only the cloud store has an answer and only the app's documents ask it, so `SvRecordStoreProtocol` is unchanged. Add `callerCanWritePool()` to it when a second store has something to say.
- **The answer is not kept with the local mirror.** A document opened offline, before any read, is offered for editing until the first read says otherwise. Q3 covers the gap: a refused edit is announced and the document goes read-only.
- **The admin claim remains as the guess before the server has said.** `UoModel.callerCanWriteToScopeRoot()` asks the store; until the catalog's first listing answers (or against a server that does not say), the catalog goes by the claim as before. That also makes the client safe to ship before the server.
