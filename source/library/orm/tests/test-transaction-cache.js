/**
 * Test script for transaction-aware cache consistency
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testTransactionCacheConsistency() {
    console.log("=== Testing Transaction-Aware Cache Consistency ===");
    
    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");
    
    const usersTable = database.tableWithName("users");
    const timestamp = Date.now();
    
    // Test 1: Insert with commit - should add to cache
    console.log("\n--- Test 1: Insert with Successful Commit ---");
    const testId1 = `tx-test-${timestamp}-1`;
    
    const tx1 = database.newTx();
    await tx1.begin(async () => {
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", testId1);
        newUser.setRowKeyValue("email", `tx-test-${timestamp}-1@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "TX Test User 1");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());
        
        console.log("Cache before insert:", usersTable.getCachedRowForId(testId1) ? "FOUND" : "NOT FOUND");
        
        await newUser.save(tx1);
        
        // Cache should still be empty until commit
        console.log("Cache after insert (before commit):", usersTable.getCachedRowForId(testId1) ? "FOUND" : "NOT FOUND");
    });
    
    // After commit, cache should have the row
    console.log("Cache after commit:", usersTable.getCachedRowForId(testId1) ? "FOUND" : "NOT FOUND");
    
    // Test 2: Insert with rollback - should NOT add to cache
    console.log("\n--- Test 2: Insert with Rollback ---");
    const testId2 = `tx-test-${timestamp}-2`;
    
    try {
        const tx2 = database.newTx();
        await tx2.begin(async () => {
            const newUser = usersTable.newRow();
            newUser.setRowKeyValue("id", testId2);
            newUser.setRowKeyValue("email", `tx-test-${timestamp}-2@example.com`);
            newUser.setRowKeyValue("password_hash", "test-hash");
            newUser.setRowKeyValue("display_name", "TX Test User 2");
            newUser.setRowKeyValue("created_at", new Date());
            newUser.setRowKeyValue("updated_at", new Date());
            
            console.log("Cache before insert:", usersTable.getCachedRowForId(testId2) ? "FOUND" : "NOT FOUND");
            
            await newUser.save(tx2);
            
            console.log("Cache after insert (before rollback):", usersTable.getCachedRowForId(testId2) ? "FOUND" : "NOT FOUND");
            
            // Force rollback by throwing error
            throw new Error("Intentional rollback");
        });
    } catch (error) {
        console.log("Transaction rolled back as expected:", error.message);
    }
    
    // After rollback, cache should NOT have the row
    console.log("Cache after rollback:", usersTable.getCachedRowForId(testId2) ? "FOUND" : "NOT FOUND");
    
    // Test 3: Delete with commit - should remove from cache
    console.log("\n--- Test 3: Delete with Successful Commit ---");
    
    const tx3 = database.newTx();
    await tx3.begin(async () => {
        console.log("Cache before delete:", usersTable.getCachedRowForId(testId1) ? "FOUND" : "NOT FOUND");
        
        const userToDelete = usersTable.getCachedRowForId(testId1);
        if (userToDelete) {
            await userToDelete.delete(tx3);
            
            // Cache should still have the row until commit
            console.log("Cache after delete (before commit):", usersTable.getCachedRowForId(testId1) ? "FOUND" : "NOT FOUND");
        } else {
            console.log("ERROR: Could not find user to delete in cache");
        }
    });
    
    // After commit, cache should NOT have the row
    console.log("Cache after commit:", usersTable.getCachedRowForId(testId1) ? "FOUND" : "NOT FOUND");
    
    // Test 4: Delete with rollback - should keep in cache
    console.log("\n--- Test 4: Delete with Rollback ---");
    
    // First insert a user to delete
    const testId4 = `tx-test-${timestamp}-4`;
    const tx4a = database.newTx();
    await tx4a.begin(async () => {
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", testId4);
        newUser.setRowKeyValue("email", `tx-test-${timestamp}-4@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "TX Test User 4");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());
        await newUser.save(tx4a);
    });
    
    console.log("Cache after insert (for delete test):", usersTable.getCachedRowForId(testId4) ? "FOUND" : "NOT FOUND");
    
    try {
        const tx4b = database.newTx();
        await tx4b.begin(async () => {
            const userToDelete = usersTable.getCachedRowForId(testId4);
            if (userToDelete) {
                await userToDelete.delete(tx4b);
                
                console.log("Cache after delete (before rollback):", usersTable.getCachedRowForId(testId4) ? "FOUND" : "NOT FOUND");
                
                // Force rollback
                throw new Error("Intentional rollback");
            }
        });
    } catch (error) {
        console.log("Delete transaction rolled back as expected:", error.message);
    }
    
    // After rollback, cache should still have the row
    console.log("Cache after rollback:", usersTable.getCachedRowForId(testId4) ? "FOUND" : "NOT FOUND");
    
    // Verify row still exists in database
    const tx5 = database.newTx();
    await tx5.begin(async () => {
        const rows = await usersTable.selectRows({ where: { id: testId4 } }, tx5);
        console.log("Row still in database:", rows.length > 0 ? "YES" : "NO");
    });
    
    console.log("\n=== Transaction-Aware Cache Consistency test completed ===");
}

// Run the test
testTransactionCacheConsistency().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});