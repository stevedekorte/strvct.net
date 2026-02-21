# Cloud Storage

Firebase integration for cloud persistence and file storage.

## FirebaseService

Integrates with Firebase for cloud persistence and file storage. Unlike AI services, `FirebaseService` extends `SvSummaryNode` directly and contains two sub-services:

- **`FirestoreDatabaseService`** — Document and collection access via Firestore. Provides query building, real-time listeners, and CRUD operations through Strvct node wrappers (`FirestoreNode`, `FirestoreQuery`).
- **`FirebaseStorageService`** — File upload and download via Firebase Storage, with permission management.
