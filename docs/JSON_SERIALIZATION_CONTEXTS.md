# JSON Serialization Contexts

## Overview

The application has multiple JSON serialization contexts with different requirements. Data that should be persisted to the cloud is not necessarily the same as data that should be exposed to the AI assistant. This document describes the different contexts and how to configure slots for each.

## Design Rationale

### Why Separate Serialization Contexts?

Firebase Firestore constraints drive many of these design decisions:

1. **1MB Document Size Limit**: Firestore enforces a maximum document size of 1MB. Objects that serialize themselves along with their contained children (e.g., a campaign with locations, NPCs, and session history) can easily exceed this. Cloud sync must be selective about what data to include.

2. **No Graph Traversal**: If we used fully decomposed storage (one document per object), retrieving an object graph would require many sequential round trips. Firestore has no support for traversing a directed graph of references in a single request.

3. **Batching Limits**: Storing each object as its own document hits Firestore's batching limits (500 operations per batch), making bulk operations slow and requiring additional sync mechanisms to ensure consistency.

### The Three-Context Solution

Rather than fighting these constraints with complex sync logic, we use three distinct serialization contexts:

| Context | Purpose | Size Concern |
|---------|---------|--------------|
| **Local Storage** | Complete state for offline recovery | No limit (IndexedDB) |
| **Cloud Sync** | Cross-device synchronization | Must fit in 1MB documents |
| **AI-Visible** | Data for AI assistant tools | Should be concise for token efficiency |

This separation allows:
- **Local storage** to be comprehensive without worrying about cloud limits
- **Cloud sync** to be selective, excluding transient state and large blobs
- **AI-visible** to be focused on game-relevant data, excluding internal metadata

Binary blobs (images, audio) are handled separately via `SvBlobPool` and synced to Cloud Storage rather than Firestore, avoiding the document size limit entirely. See `BLOB_STORAGE_SYSTEM.md` for details.

---

## Serialization Contexts

### 1. Local Storage (`setShouldStoreSlot`)

**Purpose**: Persist data to IndexedDB for local state recovery.

**Configured by**: `slot.setShouldStoreSlot(true)`

**Includes**:
- All persistent state needed to restore the application
- Transient UI state that should survive page refresh
- References to related objects (via puuid)

**Used by**: `PersistentObjectPool`, `recordForStore()`, `loadFromRecord()`

---

### 2. Cloud Sync (`setIsInCloudJson`)

**Purpose**: Sync data between devices via Firebase cloud storage.

**Configured by**: `slot.setIsInCloudJson(true)`

**Default behavior**: Falls back to `isInJsonSchema()` if not explicitly set.

**Includes**:
- All data needed to fully restore state on another device
- User-generated content (characters, campaigns, session history)
- Completed actions and their results (e.g., roll results)
- Media references or data URLs for generated images/audio

**Used by**: `asCloudJson()`, `setCloudJson()`, `SyncableJsonGroup`

**Key files**:
- `strvct/source/library/node/json/SyncableJsonGroup.js`
- `strvct/source/library/services/AiServiceKit/ConversationMessage.js`

---

### 3. AI-Visible JSON (`setIsInJsonSchema`)

**Purpose**: Data exposed to AI assistants via `getClientState` tool calls.

**Configured by**: `slot.setIsInJsonSchema(true)`

**Includes**:
- Game state the AI needs to understand the current situation
- Character stats, inventory, conditions
- Campaign locations, NPCs, narrative context
- Session state relevant to gameplay decisions

**Excludes** (intentionally):
- Internal implementation details
- Image generation prompts and intermediate state
- Audio/video data URLs
- Tool call metadata
- UI state flags

**Used by**: `asJson()`, `calcJson()`, `getClientState` tool

---

## How the Contexts Relate

The key relationship between `isInJsonSchema` and `isInCloudJson`:

```javascript
// From Slot.js
isInCloudJson () {
    const v = this.getAnnotation("isInCloudJson");
    if (v === undefined) {
        return this.isInJsonSchema(); // default to isInJsonSchema
    }
    return v;
}
```

This means:

| Configuration | In `asJson()` (AI-visible) | In `asCloudJson()` (cloud sync) |
|--------------|---------------------------|--------------------------------|
| `setIsInJsonSchema(true)` only | Yes | Yes (via default) |
| `setIsInCloudJson(true)` only | No | Yes |
| Both set to `true` | Yes | Yes |
| `setIsInJsonSchema(true)` + `setIsInCloudJson(false)` | Yes | No |

## Usage Patterns

### Pattern 1: AI-Visible Game State

For data the AI needs to understand and that should sync to cloud:

```javascript
{
    const slot = this.newSlot("hitPoints", 10);
    slot.setShouldStoreSlot(true);
    slot.setIsInJsonSchema(true);  // AI-visible, and cloud-synced via default
}
```

### Pattern 2: Cloud-Only Internal State

For data that should sync but NOT be exposed to the AI:

```javascript
{
    const slot = this.newSlot("rollResultJsonString", null);
    slot.setShouldStoreSlot(true);
    slot.setIsInCloudJson(true);   // Cloud-synced
    // No setIsInJsonSchema, so NOT AI-visible
}
```

### Pattern 3: Local-Only Transient State

For data that should persist locally but not sync to cloud:

```javascript
{
    const slot = this.newSlot("isRolling", false);
    slot.setShouldStoreSlot(true);
    // No setIsInCloudJson or setIsInJsonSchema
    // Only stored locally, not synced or AI-visible
}
```

## Message Classes Requiring Cloud Sync

### Session Messages (`app/sessions/session/AiChat/Messages/`)

These slots need `setIsInCloudJson(true)` for cloud sync (but should NOT be AI-visible):

| Class | Slots |
|-------|-------|
| `ConversationMessage` | `timestamp`, `isVisibleToUser` |
| `AiResponseMessage` | `isResponse` |
| `AiParsedResponseMessage` | `hasProcessed`, `isDoneSpeaking` |
| `UoRollRequestMessage` | `toolCall`, `isQueuedToRoll`, `isRolling`, `hasChosen`, `rollResultJsonString` |
| `UoImageMessage` | `keyIsComplete`, `prompt`, `imagePromptClassName`, `imagePrompt`, `mosaicImage`, `imageUrlData` |
| `UoVideoMessage` | `keyIsComplete`, `prompt`, `videoPrompt`, `videoDataUrl` |
| `UoAudioMessage` | `audioDataUrl`, `transcript` |

## Current Safeguards

The architecture provides natural protection for session messages:

- `UoSession.asJson()` does NOT recurse into `aiChat.messages()`
- The AI sees message content via conversation history, not via `getClientState`
- This means message internal state is already protected from AI visibility

However, explicit `setIsInCloudJson(true)` is still needed for these slots to sync to cloud.

## Recommendations

1. **For new slots**: Think about which context(s) the data belongs to:
   - AI needs to see it? → `setIsInJsonSchema(true)`
   - Should sync to cloud? → `setIsInCloudJson(true)` (or rely on default if also AI-visible)
   - Local persistence only? → Just `setShouldStoreSlot(true)`

2. **Naming convention**: Consider adding comments to clarify intent:
   ```javascript
   slot.setIsInCloudJson(true);  // Sync to cloud, but not AI-visible
   ```

3. **Testing**: When adding new cloud-synced fields, verify they round-trip correctly through `asCloudJson()` / `setCloudJson()`
