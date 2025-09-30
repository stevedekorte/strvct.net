"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseService
 * @extends AiService
 * @classdesc Root service for Firebase integration
 */
(class FirebaseService extends SvSummaryNode {

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
            const slot = this.newSlot("firestoreDatabaseService", null);
            slot.setFinalInitProto(FirestoreDatabaseService);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("firebaseStorageService", null);
            slot.setFinalInitProto(FirebaseStorageService);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

    }

    initPrototype () {
        this.setTitle("Firebase");
        this.setSubtitle("could services");
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
