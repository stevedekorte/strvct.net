/**
 * Test the new listener system in SvDbTx (updated from callback system)
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testTransactionCallbacks () {
    console.log("=== Testing Transaction Listeners (Updated Test) ===");
    
    const database = await SvDatabase.shared().setup();
    
    // Test 1: Commit listeners
    console.log("\n--- Test 1: Commit Listeners ---");
    let commitCallbackExecuted = false;
    let rollbackCallbackExecuted = false;
    
    const tx1 = database.newTx();
    await tx1.begin(async () => {
        console.log("Inside successful transaction");
        
        // Add listener with commit handler
        tx1.addListener({
            onTxCommit: () => {
                commitCallbackExecuted = true;
                console.log("✓ Commit listener executed");
            },
            onTxRollback: () => {
                rollbackCallbackExecuted = true;
                console.log("✗ Rollback listener should not execute");
            }
        });
        
        return "success";
    });
    
    if (commitCallbackExecuted) {
        console.log("✓ Commit listener system working");
    } else {
        console.log("✗ Commit listener failed to execute");
    }
    
    if (!rollbackCallbackExecuted) {
        console.log("✓ Rollback listener correctly not executed on commit");
    } else {
        console.log("✗ Rollback listener incorrectly executed on commit");
    }
    
    // Test 2: Rollback listeners
    console.log("\n--- Test 2: Rollback Listeners ---");
    let rollbackCallbackExecuted2 = false;
    let commitCallbackExecuted2 = false;
    
    try {
        const tx2 = database.newTx();
        await tx2.begin(async () => {
            console.log("Inside failing transaction");
            
            // Add listener with rollback handler
            tx2.addListener({
                onTxCommit: () => {
                    commitCallbackExecuted2 = true;
                    console.log("✗ Commit listener should not execute");
                },
                onTxRollback: () => {
                    rollbackCallbackExecuted2 = true;
                    console.log("✓ Rollback listener executed");
                }
            });
            
            throw new Error("Intentional test error");
        });
    } catch (error) {
        console.log("✓ Transaction correctly failed:", error.message);
    }
    
    if (rollbackCallbackExecuted2) {
        console.log("✓ Rollback listener system working");
    } else {
        console.log("✗ Rollback listener failed to execute");
    }
    
    if (!commitCallbackExecuted2) {
        console.log("✓ Commit listener correctly not executed on rollback");
    } else {
        console.log("✗ Commit listener incorrectly executed on rollback");
    }
    
    // Test 3: Multiple listeners
    console.log("\n--- Test 3: Multiple Listeners ---");
    let commitCount = 0;
    
    const tx3 = database.newTx();
    await tx3.begin(async () => {
        console.log("Inside transaction with multiple listeners");
        
        // Add multiple listeners
        tx3.addListener({
            onTxCommit: () => {
                commitCount++;
                console.log("✓ Commit listener 1 executed");
            }
        });
        
        tx3.addListener({
            onTxCommit: () => {
                commitCount++;
                console.log("✓ Commit listener 2 executed");
            }
        });
        
        tx3.addListener({
            onTxCommit: () => {
                commitCount++;
                console.log("✓ Commit listener 3 executed");
            }
        });
        
        return "success";
    });
    
    if (commitCount === 3) {
        console.log("✓ All multiple commit listeners executed");
    } else {
        console.log(`✗ Expected 3 commit listeners, got ${commitCount}`);
    }
    
    // Test 4: Exception handling in listeners
    console.log("\n--- Test 4: Exception Handling ---");
    let goodListenerCalled = false;
    let errorCount = 0;
    
    // Temporarily capture console.warn to count warnings from listener errors
    const originalWarn = console.warn;
    console.warn = function (...args) {
        if (args[0] && args[0].includes("Transaction commit listener failed")) {
            errorCount++;
        }
        originalWarn.apply(console, args);
    };
    
    const tx4 = database.newTx();
    await tx4.begin(async () => {
        console.log("Testing exception handling in listeners");
        
        // Add a listener that throws an error
        tx4.addListener({
            onTxCommit: () => {
                throw new Error("Intentional listener error");
            }
        });
        
        // Add a good listener that should still work
        tx4.addListener({
            onTxCommit: () => {
                goodListenerCalled = true;
                console.log("✓ Good listener executed despite error in other listener");
            }
        });
        
        return "success";
    });
    
    // Restore original console.warn
    console.warn = originalWarn;
    
    if (goodListenerCalled && errorCount === 1) {
        console.log("✓ Exception handling working correctly");
    } else {
        console.log(`✗ Exception handling failed: good=${goodListenerCalled}, errors=${errorCount}`);
    }
    
    console.log("\n=== Transaction Listeners test completed ===");
}

testTransactionCallbacks().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});