"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_blobs
 * @extends SvObjectPool
 * @classdesc Blob collection and blob references: the blob hashes every record in the
 * pool refers to, and collecting the blobs nothing refers to. A category of
 * SvObjectPool, split from SvObjectPool.js unchanged (Plans/Cleanup § 3).
 */
(class SvObjectPool_blobs extends SvObjectPool {

    // --- blobs ---

    /**
     * @async
     * @description collect blobs
     * @returns {Promise<number>}
     */
    async asyncCollectBlobs () {
        if (!this.blobPool().isOpen()) {
            return 0;
        }
        try {
            const keySet = this.allBlobHashesSet();
            return await this.blobPool().asyncCollectUnreferencedKeySet(keySet);
        } catch (error) {
            if (!this.blobPool().isOpen() || /not open/i.test(error && error.message)) {
                return 0; // the blob store closed while the collection ran (shutdown, a test's reopen)
            }
            throw error;
        }
    }


    allObjects () {
        const objects = new Set();
        this.allPids().forEach(pid => {
            const obj = this.objectForPid(pid);
            objects.add(obj);
        });
        return objects;
    }

    allRecords () {
        const records = new Set();
        this.allPids().forEach(pid => {
            const record = this.recordForPid(pid);
            records.add(record);
        });
        return records;
    }

    allBlobHashesSet () {
        // Every pool in the local store counts, open or not: pools share the
        // blob store, and a session, character or catalog document that is not
        // open at boot still owns its images. (Walking only the open pools
        // evicted every catalog image on the first boot after the records
        // cutover, before the child pools had been imported — a one-time
        // re-download of the whole catalog.)
        //
        // Walks ROWS, not instances (materializing the store to ask each
        // object would defeat slot lazy loading). Blob hashes are hex sha256
        // strings, so scanning record JSON for 64-hex tokens is a conservative
        // superset — a blob can never be wrongly deleted. ACTIVE instances of
        // the open pools are still asked directly, which covers hashes added
        // since the last save.
        const hashesSet = new Set();
        const hexHashRegex = /[0-9a-f]{64}/g;
        this.recordStore().allRows().forEach((row) => {
            if (!row.isDeleted && row.payloadJson) {
                const matches = row.payloadJson.match(hexHashRegex);
                if (matches) {
                    matches.forEach(h => hashesSet.add(h));
                }
            }
        });
        SvObjectPool.openPools().forEach((pool) => {
            pool.activeObjects().forEachKV((pid, obj) => {
                if (obj) {
                    hashesSet.addAll(obj.referencedBlobHashesSet());
                }
            });
        });
        return hashesSet;
    }

    localBlobHashesSet () {
        const hashesSet = new Set();
        const hexHashRegex = /[0-9a-f]{64}/g;
        this.forEachRecordJson((pid, recordString) => {
            const matches = recordString.match(hexHashRegex);
            if (matches) {
                matches.forEach(h => hashesSet.add(h));
            }
        });
        this.activeObjects().forEachKV((pid, obj) => {
            if (obj) {
                hashesSet.addAll(obj.referencedBlobHashesSet());
            }
        });
        return hashesSet;
    }

    recordDescriptorsContaining (substring) {
        const found = [];
        this.forEachRecordJson((pid, recordString) => {
            if (recordString.includes(substring)) {
                const typeMatch = recordString.match(/"type"\s*:\s*"([^"]+)"/);
                found.push((typeMatch ? typeMatch[1] : "?") + " " + pid);
            }
        });
        return found;
    }

}.initThisCategory());
