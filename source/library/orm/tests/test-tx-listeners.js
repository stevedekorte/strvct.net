/**
 * Test the new listener-based transaction system in SvDbTx
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testTransactionListeners () {
    console.log("=== Testing Transaction Listeners ===");

    const database = await SvDatabase.shared().setup();

    // Test 1: Object with both onTxCommit and onTxRollback
    console.log("\n--- Test 1: Complete Listener Object ---");
    let commitReceived = false;
    let rollbackReceived = false;
    let commitTxRef = null;
    let rollbackTxRef = null;

    const completeListener = {
        onTxCommit: (tx) => {
            commitReceived = true;
            commitTxRef = tx;
            console.log("✓ onTxCommit message received");
        },
        onTxRollback: (tx) => {
            rollbackReceived = true;
            rollbackTxRef = tx;
            console.log("✓ onTxRollback message received");
        }
    };

    // Test successful transaction
    const tx1 = database.newTx();
    tx1.addListener(completeListener);

    await tx1.begin(async () => {
        console.log("Inside successful transaction");
        return "success";
    });

    if (commitReceived && commitTxRef === tx1) {
        console.log("✓ Commit listener properly invoked with correct transaction reference");
    } else {
        console.log("✗ Commit listener failed");
    }

    if (!rollbackReceived) {
        console.log("✓ Rollback listener correctly not invoked on commit");
    } else {
        console.log("✗ Rollback listener incorrectly invoked on commit");
    }

    // Test 2: Rollback listener
    console.log("\n--- Test 2: Rollback Listener ---");
    commitReceived = false;
    rollbackReceived = false;

    const rollbackListener = {
        onTxRollback: (tx) => {
            rollbackReceived = true;
            rollbackTxRef = tx;
            console.log("✓ onTxRollback message received for failed transaction");
        }
    };

    try {
        const tx2 = database.newTx();
        tx2.addListener(rollbackListener);

        await tx2.begin(async () => {
            console.log("Inside failing transaction");
            throw new Error("Intentional test error");
        });
    } catch (error) {
        console.log("✓ Transaction correctly failed:", error.message);
    }

    if (rollbackReceived && rollbackTxRef) {
        console.log("✓ Rollback listener properly invoked");
    } else {
        console.log("✗ Rollback listener failed");
    }

    // Test 3: Partial listeners (only one method)
    console.log("\n--- Test 3: Partial Listeners ---");
    let commitOnlyReceived = false;
    let rollbackOnlyReceived = false;

    const commitOnlyListener = {
        onTxCommit: (tx) => {
            commitOnlyReceived = true;
            console.log("✓ Commit-only listener received message");
        }
        // No onTxRollback method
    };

    const rollbackOnlyListener = {
        onTxRollback: (tx) => {
            rollbackOnlyReceived = true;
            console.log("✓ Rollback-only listener received message");
        }
        // No onTxCommit method
    };

    // Test commit-only listener
    const tx3 = database.newTx();
    tx3.addListener(commitOnlyListener);
    tx3.addListener(rollbackOnlyListener); // Should not receive message on commit

    await tx3.begin(async () => {
        console.log("Testing partial listeners on commit");
        return "success";
    });

    if (commitOnlyReceived) {
        console.log("✓ Commit-only listener worked");
    } else {
        console.log("✗ Commit-only listener failed");
    }

    if (!rollbackOnlyReceived) {
        console.log("✓ Rollback-only listener correctly ignored on commit");
    } else {
        console.log("✗ Rollback-only listener incorrectly invoked on commit");
    }

    // Test 4: Multiple listeners
    console.log("\n--- Test 4: Multiple Listeners ---");
    let listener1Called = false;
    let listener2Called = false;
    let listener3Called = false;

    const listener1 = {
        onTxCommit: () => {
            listener1Called = true;
            console.log("✓ Listener 1 called");
        }
    };

    const listener2 = {
        onTxCommit: () => {
            listener2Called = true;
            console.log("✓ Listener 2 called");
        }
    };

    const listener3 = {
        onTxCommit: () => {
            listener3Called = true;
            console.log("✓ Listener 3 called");
        }
    };

    const tx4 = database.newTx();
    tx4.addListener(listener1);
    tx4.addListener(listener2);
    tx4.addListener(listener3);

    await tx4.begin(async () => {
        console.log("Testing multiple listeners");
        return "success";
    });

    const allListenersCalled = listener1Called && listener2Called && listener3Called;
    if (allListenersCalled) {
        console.log("✓ All multiple listeners called");
    } else {
        console.log(`✗ Some listeners failed: L1=${listener1Called}, L2=${listener2Called}, L3=${listener3Called}`);
    }

    // Test 5: Remove listener
    console.log("\n--- Test 5: Remove Listener ---");
    let removedListenerCalled = false;
    let remainingListenerCalled = false;

    const removedListener = {
        onTxCommit: () => {
            removedListenerCalled = true;
            console.log("✗ Removed listener should not be called");
        }
    };

    const remainingListener = {
        onTxCommit: () => {
            remainingListenerCalled = true;
            console.log("✓ Remaining listener called");
        }
    };

    const tx5 = database.newTx();
    tx5.addListener(removedListener);
    tx5.addListener(remainingListener);
    tx5.removeListener(removedListener);

    await tx5.begin(async () => {
        console.log("Testing listener removal");
        return "success";
    });

    if (!removedListenerCalled && remainingListenerCalled) {
        console.log("✓ Listener removal working correctly");
    } else {
        console.log(`✗ Listener removal failed: removed=${removedListenerCalled}, remaining=${remainingListenerCalled}`);
    }

    // Test 6: Clear listeners functionality
    console.log("\n--- Test 6: Clear Listeners ---");
    let shouldNotBeCalled = false;

    const tx6 = database.newTx();

    const listenerToClear = {
        onTxCommit: () => {
            shouldNotBeCalled = true;
            console.log("✗ This listener should have been cleared");
        }
    };

    tx6.addListener(listenerToClear);
    tx6.clearListeners(); // Remove all listeners

    await tx6.begin(async () => {
        console.log("Testing clear listeners functionality");
        return "success";
    });

    if (!shouldNotBeCalled) {
        console.log("✓ Clear listeners working correctly");
    } else {
        console.log("✗ Clear listeners failed - listener was called");
    }

    console.log("\n=== Transaction Listeners test completed ===");
}

testTransactionListeners().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});
