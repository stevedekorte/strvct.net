"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreQuery
 * @extends SvSummaryNode
 * @classdesc Represents a Firestore query with configuration options
 *
 * Holds query parameters like limit, orderBy, filters, and pagination cursors.
 * Contains a FirestoreDocuments instance that holds the query results.
 */
(class FirestoreQuery extends SvSummaryNode {

    initPrototypeSlots () {

        // Path (collection path for this query)
        {
            const slot = this.newSlot("path", null);
            slot.setDescription("Firestore collection path to query");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Limit - maximum number of documents to fetch
        {
            const slot = this.newSlot("limit", 50);
            slot.setInspectorPath("Settings");
            slot.setLabel("Limit");
            slot.setDescription("Maximum number of documents to fetch");
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSummaryFormat("key: value");
        }

        // Order by field
        {
            const slot = this.newSlot("orderByField", null);
            slot.setInspectorPath("Settings");
            slot.setLabel("Order By");
            slot.setDescription("Field to order results by (e.g., 'timestamp', 'name')");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSummaryFormat("key: value");
        }


        // Order direction
        {
            const slot = this.newSlot("orderDirection", "ascending");
            slot.setInspectorPath("Settings");
            slot.setLabel("Order Direction");
            slot.setDescription("Order direction: 'ascending' or 'descending'");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setValidValues(["ascending", "descending"]);
            slot.setSummaryFormat("key: value");
        }

        // Documents container (holds query results)
        {
            const slot = this.newSlot("results", null);
            slot.setLabel("Results");
            slot.setFinalInitProto(FirestoreDocuments);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("FirestoreDocuments");
        }

        // Last document cursor for pagination
        {
            const slot = this.newSlot("lastDocument", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(false);
            slot.setIsSubnodeField(false);
        }

        // Refresh action
        {
            const slot = this.newSlot("refreshAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Execute Query");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncExecute");
        }

        // Next page action
        {
            const slot = this.newSlot("nextPageAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Next Page");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncNextPage");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setTitle("Query");
    }

    /**
     * @description Gets the title for display
     * @returns {string} The query description
     * @category Display
     */
    title () {
        return "Query";
    }

    description () {
        const parts = [];
        if (this.limit()) {
            parts.push(`limit: ${this.limit()}`);
        }
        if (this.orderByField()) {
            parts.push(`orderBy: ${this.orderByField()} ${this.orderDirection()}`);
        }
        return parts.length > 0 ? parts.join(", ") : "Query";
    }

    /**
     * @description Gets the subtitle for display
     * @returns {string} Count of documents
     * @category Display
     */
    subtitle () {
        const count = this.results().documents().length;
        return `${count} document${count !== 1 ? "s" : ""}`;
    }

    orderDirectionValueAsString () {
        return this.orderDirection() === "ascending" ? "asc" : "desc";
    }

    /**
     * @description Executes the query and populates documents
     * @returns {Promise<void>}
     * @category Firestore Operations
     */
    async asyncExecute () {
        const collectionPath = this.path();
        if (!collectionPath) {
            throw new Error("No collection path set");
        }

        const parent = this.ownerNode();
        if (!parent || !parent.isKindOf(FirestoreCollection)) {
            throw new Error("FirestoreQuery must have a FirestoreCollection owner");
        }

        const db = parent.getFirestoreDb();

        // Build query
        let query = db.collection(collectionPath);

        // Apply orderBy if specified
        if (this.orderByField()) {
            query = query.orderBy(this.orderByField(), this.orderDirectionValueAsString() || "asc");
        }

        // Apply limit if specified
        if (this.limit()) {
            query = query.limit(this.limit());
        }

        // Execute query
        const snapshot = await query.get();

        // Store last document for pagination
        if (snapshot.docs.length > 0) {
            this.setLastDocument(snapshot.docs[snapshot.docs.length - 1]);
        }

        // Clear existing documents
        this.results().removeAllSubnodes();

        // Add documents from query results
        snapshot.forEach(docSnap => {
            const docId = docSnap.id;
            const doc = this.results().documentWithDocIdCreateIfAbsent(docId);

            // Update document content
            const data = docSnap.data();
            doc.setContent(data);

            // Update timestamp
            if (docSnap.updateTime) {
                doc.setUpdateTimeMillis(docSnap.updateTime.toMillis());
            }
        });
    }

    /**
     * @description Fetches the next page of results
     * @returns {Promise<void>}
     * @category Firestore Operations
     */
    async asyncNextPage () {
        if (!this.lastDocument()) {
            throw new Error("No cursor available - execute query first");
        }

        const collectionPath = this.path();
        if (!collectionPath) {
            throw new Error("No collection path set");
        }

        const parent = this.ownerNode();
        if (!parent || !parent.isKindOf(FirestoreCollection)) {
            throw new Error("FirestoreQuery must have a FirestoreCollection owner");
        }

        const db = parent.getFirestoreDb();

        // Build query with cursor
        let query = db.collection(collectionPath);

        // Apply orderBy (required for cursor)
        if (this.orderByField()) {
            query = query.orderBy(this.orderByField(), this.orderDirectionValueAsString() || "asc");
        }

        // Apply cursor
        query = query.startAfter(this.lastDocument());

        // Apply limit
        if (this.limit()) {
            query = query.limit(this.limit());
        }

        // Execute query
        const snapshot = await query.get();

        // Update cursor
        if (snapshot.docs.length > 0) {
            this.setLastDocument(snapshot.docs[snapshot.docs.length - 1]);
        }

        // Add documents from query results (append, don't clear)
        snapshot.forEach(docSnap => {
            const docId = docSnap.id;
            const doc = this.results().documentWithDocIdCreateIfAbsent(docId);

            // Update document content
            const data = docSnap.data();
            doc.setContent(data);

            // Update timestamp
            if (docSnap.updateTime) {
                doc.setUpdateTimeMillis(docSnap.updateTime.toMillis());
            }
        });
    }

    hasPath () {
        return this.path() !== null && this.path() !== "";
    }

    /**
     * @description Gets action info for refresh action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    refreshActionInfo () {
        const hasPath = this.hasPath();
        const subtitle = !hasPath ? "No collection path set" : "";
        return {
            isEnabled: hasPath,
            title: "Execute",
            subtitle: subtitle
        };
    }

    /**
     * @description Gets action info for next page action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    nextPageActionInfo () {
        const hasOrderBy = this.hasOrderBy();
        const hasCursor = this.lastDocument() !== null;
        const subtitle = !hasOrderBy ? "Requires orderBy for pagination" : (!hasCursor ? "Execute query first" : "");

        return {
            isEnabled: hasOrderBy && hasCursor,
            title: "Next Page",
            subtitle: subtitle
        };
    }

}.initThisClass());
