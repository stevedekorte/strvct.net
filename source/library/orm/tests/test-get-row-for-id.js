/**
 * Test script for getRowForId() cache-first lookup
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testGetRowForId () {
    console.log("=== Testing getRowForId() Cache-First Lookup ===");

    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");

    const usersTable = database.tableWithName("users");
    const timestamp = Date.now();

    // Test 1: Cache miss (row doesn't exist)
    console.log("\n--- Test 1: Cache Miss (Non-existent Row) ---");
    const tx1 = database.newTx();
    await tx1.begin(async () => {
        const nonExistentId = `non-existent-${timestamp}`;
        const result = await usersTable.getRowForId(nonExistentId, tx1);
        console.log("getRowForId() for non-existent ID:", result ? "FOUND" : "NULL");
    });

    // Test 2: Cache miss (row exists in database)
    console.log("\n--- Test 2: Cache Miss (Database Lookup) ---");
    const testId = `cache-test-${timestamp}`;

    // First create a user directly in database (bypassing cache)
    const tx2 = database.newTx();
    await tx2.begin(async () => {
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", testId);
        newUser.setRowKeyValue("email", `cache-test-${timestamp}@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "Cache Test User");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());

        await newUser.save(tx2);
        console.log("Created user with ID:", testId);
    });

    // Clear cache to simulate fresh lookup
    console.log("Cache before lookup:", usersTable.getCachedRowForId(testId) ? "CACHED" : "NOT CACHED");

    // Now test getRowForId - should hit database and cache the result
    const tx3 = database.newTx();
    await tx3.begin(async () => {
        console.log("Calling getRowForId() - expecting database lookup");
        const user1 = await usersTable.getRowForId(testId, tx3);

        if (user1) {
            console.log("✓ getRowForId() found user:", user1.asDict().email);
            console.log("Cache after lookup:", usersTable.getCachedRowForId(testId) ? "CACHED" : "NOT CACHED");
        } else {
            console.log("✗ getRowForId() did not find user");
        }
    });

    // Test 3: Cache hit (row is now cached)
    console.log("\n--- Test 3: Cache Hit ---");
    const tx4 = database.newTx();
    await tx4.begin(async () => {
        console.log("Calling getRowForId() again - expecting cache hit");
        const user2 = await usersTable.getRowForId(testId, tx4);

        if (user2) {
            console.log("✓ getRowForId() found cached user:", user2.asDict().email);

            // Verify it's the same object instance
            const cachedUser = usersTable.getCachedRowForId(testId);
            if (user2 === cachedUser) {
                console.log("✓ Returned same cached object instance");
            } else {
                console.log("✗ Returned different object instance");
            }
        } else {
            console.log("✗ getRowForId() did not find user");
        }
    });

    // Test 4: Performance comparison
    console.log("\n--- Test 4: Performance Comparison ---");
    const tx5 = database.newTx();
    await tx5.begin(async () => {
        // Direct database query
        const startDbQuery = Date.now();
        const dbResult = await usersTable.selectRows({
            where: { id: testId }
        }, tx5);
        const dbQueryTime = Date.now() - startDbQuery;

        // Cache lookup
        const startCacheQuery = Date.now();
        const cacheResult = await usersTable.getRowForId(testId, tx5);
        const cacheQueryTime = Date.now() - startCacheQuery;

        console.log(`Database query time: ${dbQueryTime}ms`);
        console.log(`Cache lookup time: ${cacheQueryTime}ms`);
        console.log(`Performance improvement: ${dbQueryTime > 0 ? Math.round((dbQueryTime - cacheQueryTime) / dbQueryTime * 100) : "N/A"}%`);

        console.log("Both methods found user:", dbResult.length > 0 && cacheResult ? "✓ YES" : "✗ NO");
        console.log("Same object returned:", dbResult[0] === cacheResult ? "✓ YES" : "✗ NO");
    });

    // Test 5: Null/undefined handling
    console.log("\n--- Test 5: Null/Undefined Handling ---");
    const tx6 = database.newTx();
    await tx6.begin(async () => {
        const nullResult = await usersTable.getRowForId(null, tx6);
        const undefinedResult = await usersTable.getRowForId(undefined, tx6);

        console.log("getRowForId(null):", nullResult === null ? "✓ NULL" : "✗ NOT NULL");
        console.log("getRowForId(undefined):", undefinedResult === null ? "✓ NULL" : "✗ NOT NULL");
    });

    console.log("\n=== getRowForId() test completed ===");
}

// Run the test
(async () => {
    try {
        await testGetRowForId();
        console.log("Test finished successfully");
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
})();
