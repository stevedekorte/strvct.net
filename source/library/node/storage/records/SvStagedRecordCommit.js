"use strict";

/**
 * @module library.node.storage.records
 * @class SvStagedRecordCommit
 * @extends ProtoClass
 * @classdesc Drives one commit that is too large for a single transaction
 * through a store's staging calls (Plans/Record Store §7 point 5):
 *
 *   asyncStageBegin({ poolId, baseVersion, requestId, create? })  → { status: "staging"|"conflict"|"busy"|"committed"|"refused", version }
 *   asyncStageWrite({ poolId, requestId, writes, deletes })        → { status: "staging" } (a batch; never the root)
 *   asyncStageFinalize({ poolId, requestId, rootWrite })           → { status: "committed", version }
 *
 * The store reserves the next version at begin, keeps each touched row's
 * pre-image, answers every other reader and writer of the pool "busy" until
 * finalize, and rolls an abandoned stage back — so the result is the same one
 * version a single commit would make, or nothing.
 */
(class SvStagedRecordCommit extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("Object");
            slot.setDescription("answers asyncStageBegin / asyncStageWrite / asyncStageFinalize");
        }
        {
            const slot = this.newSlot("commit", null);
            slot.setSlotType("Object");
            slot.setDescription("{ poolId, baseVersion, requestId, writes, deletes, create? }");
        }
        {
            const slot = this.newSlot("maxOpsPerWrite", 200);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("maxBytesPerWrite", 2 * 1024 * 1024);
            slot.setSlotType("Number");
            slot.setDescription("payload bytes per batch; the server also writes each row's pre-image");
        }
    }

    /**
     * @description Whether the commit exceeds what one transaction carries.
     * @param {Object} commit
     * @param {Number} maxOps
     * @param {Number} maxBytes
     * @returns {Boolean}
     * @category Sizing
     */
    static needsStaging (commit, maxOps, maxBytes) {
        const ops = (commit.writes || []).length + (commit.deletes || []).length;
        return ops > maxOps || this.payloadBytes(commit.writes || []) > maxBytes;
    }

    static payloadBytes (writes) {
        return writes.reduce((sum, row) => sum + (row.payloadJson ? row.payloadJson.length : 0), 0);
    }

    async asyncRun () {
        const commit = this.commit();
        const begun = await this.store().asyncStageBegin(this.beginArgs());
        if (begun.status !== "staging") {
            return begun;
        }
        for (const batch of this.batches()) {
            await this.store().asyncStageWrite(Object.assign({ poolId: commit.poolId, requestId: commit.requestId }, batch));
        }
        return this.store().asyncStageFinalize({ poolId: commit.poolId, requestId: commit.requestId, rootWrite: this.rootWrite() });
    }

    beginArgs () {
        const commit = this.commit();
        const args = { poolId: commit.poolId, baseVersion: commit.baseVersion, requestId: commit.requestId };
        if (commit.create) {
            args.create = commit.create;
        }
        return args;
    }

    rootWrite () {
        return (this.commit().writes || []).find(row => SvRecordRow.isRoot(row)) || null;
    }

    /**
     * @description The non-root writes, then the deletes, in batches bounded by
     * operation count and payload bytes.
     * @returns {Array<Object>} [{ writes, deletes }]
     * @category Sizing
     */
    batches () {
        const ops = (this.commit().writes || []).filter(row => !SvRecordRow.isRoot(row)).map(row => ({ write: row }))
            .concat((this.commit().deletes || []).map(key => ({ delete: key })));
        const batches = [];
        let current = null;
        ops.forEach((op) => {
            const bytes = op.write && op.write.payloadJson ? op.write.payloadJson.length : 0;
            if (!current || current.count >= this.maxOpsPerWrite() || (current.bytes + bytes > this.maxBytesPerWrite() && current.count > 0)) {
                current = { writes: [], deletes: [], count: 0, bytes: 0 };
                batches.push(current);
            }
            if (op.write) {
                current.writes.push(op.write);
            } else {
                current.deletes.push(op.delete);
            }
            current.count++;
            current.bytes += bytes;
        });
        return batches.map(b => ({ writes: b.writes, deletes: b.deletes }));
    }

}.initThisClass());
