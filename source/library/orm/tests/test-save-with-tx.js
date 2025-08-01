/**
 * Test save() with transactions
 */

"use strict";

const { initializeDatabase } = require("../../database");
const SvDatabase = require("../SvDatabase");

async function testSaveWithTx() {
    console.log("=== Testing save() with Transactions ===");
    
    // Initialize database
    await initializeDatabase();
    console.log("Database initialized successfully");
    
    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");
    
    const usersTable = database.tableWithName("users");
    const timestamp = Date.now();
    
    // Test save with transaction
    console.log("\n--- Test: save() with Transaction ---");
    const tx1 = database.newTx();
    console.log("Created transaction");
    
    await tx1.begin(async () => {
        console.log("Inside transaction callback");
        
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", `save-tx-test-${timestamp}`);
        newUser.setRowKeyValue("email", `save-tx-test-${timestamp}@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "Save TX Test User");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());
        
        console.log("Created new user row");
        console.log("About to call save(tx1)");
        console.log("tx1 is:", tx1 ? "DEFINED" : "UNDEFINED");
        
        try {
            const result = await newUser.save(tx1);
            console.log("✓ save(tx1) succeeded");
        } catch (error) {
            console.log("✗ save(tx1) failed:", error.message);
        }
    });
    
    console.log("Transaction completed");
    console.log("\n=== Test completed ===");
}

// Run the test
testSaveWithTx().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});