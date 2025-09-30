/**
 * Debug test for multi-transaction support
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function debugMultiTx () {
    console.log("=== Debugging Multi-Transaction Support ===");

    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");

    console.log("activeTxs initial count:", database.activeTxs().size);

    // Test 1: Create a transaction
    console.log("\n--- Test 1: Create Transaction ---");
    const tx1 = database.newTx();
    console.log("Created tx1");
    console.log("activeTxs after newTx:", database.activeTxs().size);
    console.log("tx1.isActive():", tx1.isActive());
    console.log("activeTxs.has(tx1):", database.activeTxs().has(tx1));

    // Test 2: Begin transaction
    console.log("\n--- Test 2: Begin Transaction ---");
    await tx1.begin(async () => {
        console.log("Inside tx1.begin() callback");
        console.log("tx1.isActive():", tx1.isActive());
        console.log("activeTxs.has(tx1):", database.activeTxs().has(tx1));
        console.log("tx1.txRef():", tx1.txRef() ? "EXISTS" : "NULL");

        // Test validation directly
        try {
            const txRef = database.validateTxAndGetRef(tx1);
            console.log("✓ validateTxAndGetRef succeeded");
        } catch (error) {
            console.log("✗ validateTxAndGetRef failed:", error.message);
        }
    });

    console.log("After tx1.begin() completed");
    console.log("activeTxs final count:", database.activeTxs().size);

    console.log("\n=== Debug test completed ===");
}

// Run the test
debugMultiTx().then(() => {
    console.log("Debug test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Debug test failed:", error);
    process.exit(1);
});
