/**
 * Test script demonstrating the save() method behavior
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testSaveMethod() {
    console.log("=== Testing save() Method Behavior ===");
    
    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");
    
    const usersTable = database.tableWithName("users");
    const timestamp = Date.now();
    
    // Test 1: Create new row (should insert)
    console.log("\n--- Test 1: Create New Row (Insert) ---");
    const tx1 = database.newTx();
    await tx1.begin(async () => {
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", `save-test-${timestamp}-1`);
        newUser.setRowKeyValue("email", `save-test-${timestamp}-1@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "Save Test User 1");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());
        
        console.log("Row before save() - Primary key:", newUser.primaryKeyValue());
        console.log("Cached row exists:", usersTable.getCachedRowForId(newUser.primaryKeyValue()) ? "YES" : "NO");
        
        const result = await newUser.save(tx1); // Should INSERT
        console.log("✓ save() completed - operation was INSERT");
        console.log("Row after save() - Primary key:", newUser.primaryKeyValue());
    });
    
    // Test 2: Update existing cached row (should update)
    console.log("\n--- Test 2: Update Existing Cached Row (Update) ---");
    const tx2 = database.newTx();
    await tx2.begin(async () => {
        const testId = `save-test-${timestamp}-1`;
        const cachedUser = usersTable.getCachedRowForId(testId);
        
        if (cachedUser) {
            console.log("Found cached row with email:", cachedUser.asDict().email);
            console.log("Row is cached and same instance:", cachedUser === cachedUser);
            
            // Modify the cached row
            cachedUser.setRowKeyValue("display_name", "Save Test User 1 - UPDATED");
            cachedUser.setRowKeyValue("updated_at", new Date());
            
            const result = await cachedUser.save(tx2); // Should UPDATE
            console.log("✓ save() completed - operation was UPDATE");
            console.log("Updated display_name:", cachedUser.asDict().display_name);
        } else {
            console.log("✗ No cached row found");
        }
    });
    
    // Test 3: Create row with explicit ID (should insert)
    console.log("\n--- Test 3: Create Row with Explicit ID (Insert) ---");
    const tx3 = database.newTx();
    await tx3.begin(async () => {
        const newUserWithId = usersTable.newRow();
        const explicitId = `save-test-${timestamp}-2`;
        newUserWithId.setRowKeyValue("id", explicitId);
        newUserWithId.setRowKeyValue("email", `save-test-${timestamp}-2@example.com`);
        newUserWithId.setRowKeyValue("password_hash", "test-hash");
        newUserWithId.setRowKeyValue("display_name", "Save Test User 2");
        newUserWithId.setRowKeyValue("created_at", new Date());
        newUserWithId.setRowKeyValue("updated_at", new Date());
        
        console.log("Row has primary key:", explicitId);
        console.log("But is not cached:", usersTable.getCachedRowForId(explicitId) ? "CACHED" : "NOT CACHED");
        
        const result = await newUserWithId.save(tx3); // Should INSERT (not cached)
        console.log("✓ save() completed - operation was INSERT (explicit ID)");
    });
    
    // Test 4: Load and modify existing row (should update)
    console.log("\n--- Test 4: Load and Modify Existing Row (Update) ---");
    const tx4 = database.newTx();
    await tx4.begin(async () => {
        const testId = `save-test-${timestamp}-2`;
        
        // Query for the row (will be cached after this)
        const queriedRows = await usersTable.selectRows({ where: { id: testId } }, tx4);
        
        if (queriedRows.length > 0) {
            const loadedUser = queriedRows[0];
            console.log("Loaded row with email:", loadedUser.asDict().email);
            console.log("Row is now cached:", usersTable.getCachedRowForId(testId) ? "YES" : "NO");
            
            // Modify the loaded row
            loadedUser.setRowKeyValue("display_name", "Save Test User 2 - UPDATED");
            loadedUser.setRowKeyValue("updated_at", new Date());
            
            const result = await loadedUser.save(tx4); // Should UPDATE
            console.log("✓ save() completed - operation was UPDATE");
            console.log("Updated display_name:", loadedUser.asDict().display_name);
        } else {
            console.log("✗ No row found");
        }
    });
    
    // Test 5: Demonstrate cache consistency
    console.log("\n--- Test 5: Cache Consistency Check ---");
    const tx5 = database.newTx();
    await tx5.begin(async () => {
        const testId1 = `save-test-${timestamp}-1`;
        const testId2 = `save-test-${timestamp}-2`;
        
        // Get rows from cache and query - should be same instances
        const cached1 = usersTable.getCachedRowForId(testId1);
        const cached2 = usersTable.getCachedRowForId(testId2);
        
        const queried1 = await usersTable.selectRows({ where: { id: testId1 } }, tx5);
        const queried2 = await usersTable.selectRows({ where: { id: testId2 } }, tx5);
        
        console.log("User 1 - Cache vs Query same instance:", cached1 === queried1[0] ? "✓ YES" : "✗ NO");
        console.log("User 2 - Cache vs Query same instance:", cached2 === queried2[0] ? "✓ YES" : "✗ NO");
        
        if (cached1) {
            console.log("User 1 display_name:", cached1.asDict().display_name);
        }
        if (cached2) {
            console.log("User 2 display_name:", cached2.asDict().display_name);
        }
    });
    
    console.log("\n=== save() Method test completed ===");
}

// Run the test
testSaveMethod().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});