# Cloud Storage

Firebase integration for cloud persistence and file storage.

## SvFirebaseService

Integrates with Firebase for cloud persistence and file storage. Unlike AI services, `SvFirebaseService` extends `SvSummaryNode` directly and contains two sub-services:

- **`SvFirestoreDatabaseService`** — Document and collection access via Firestore. Provides query building, real-time listeners, and CRUD operations through Strvct node wrappers (`SvFirestoreNode`, `SvFirestoreQuery`).
- **`SvFirebaseStorageService`** — File upload and download via Firebase Storage, with permission management.
