"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class SvFirestoreDatabaseService
 * @extends SvSummaryNode
 * @classdesc Service for Firebase Firestore Database integration
 *
 * This service provides access to Firestore collections and documents.
 * The root collection serves as the entry point to the Firestore hierarchy.
 */
(class SvFirestoreDatabaseService extends SvSummaryNode {

    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("root", null);
            slot.setFinalInitProto(SvFirestoreRoot);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("SvFirestoreRoot");
        }
    }

    initPrototype () {
        this.setTitle("Firestore Database");
        this.setSubtitle("document database");
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        //this.root().collectionWithPathCreateIfAbsent("users");
    }

    afterUnserializeAndInit () {
        this.root().collectionWithPathCreateIfAbsent("users");
    }

}.initThisClass());
