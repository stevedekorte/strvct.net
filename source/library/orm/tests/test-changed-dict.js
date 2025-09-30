/**
 * Test script to verify changedDict() behavior for insert and update operations
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testChangedDict () {
    console.log("=== Testing changedDict() for Insert/Update Optimization ===");

    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");

    const usersTable = database.tableWithName("users");
    const timestamp = Date.now();

    // Test 1: New row (should behave like asDict since no oldDict)
    console.log("\n--- Test 1: New Row changedDict() vs asDict() ---");
    const tx1 = database.newTx();
    await tx1.begin(async () => {
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", `changeddict-test-${timestamp}`);
        newUser.setRowKeyValue("email", `changeddict-test-${timestamp}@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "ChangedDict Test User");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());

        const fullDict = newUser.asDict();
        const changedDict = newUser.changedDict();

        console.log("Full dict keys:", Object.keys(fullDict).sort());
        console.log("Changed dict keys:", Object.keys(changedDict).sort());
        console.log("Keys match:", JSON.stringify(Object.keys(fullDict).sort()) === JSON.stringify(Object.keys(changedDict).sort()));

        // Insert using current method
        await newUser.save(tx1);
        console.log("✓ Row inserted successfully");
    });

    // Test 2: Modified existing row (should only return changed fields + primary key)
    console.log("\n--- Test 2: Modified Row changedDict() vs asDict() ---");
    const tx2 = database.newTx();
    await tx2.begin(async () => {
        const testId = `changeddict-test-${timestamp}`;

        // Get the cached row (will have oldDict set)
        const cachedUser = usersTable.getCachedRowForId(testId);
        if (cachedUser) {
            console.log("Found cached user with oldDict set");

            // Modify only a couple of fields
            cachedUser.setRowKeyValue("display_name", "UPDATED Name");
            cachedUser.setRowKeyValue("updated_at", new Date());

            const fullDict = cachedUser.asDict();
            const changedDict = cachedUser.changedDict();

            console.log("Full dict keys:", Object.keys(fullDict).sort());
            console.log("Changed dict keys:", Object.keys(changedDict).sort());
            console.log("Changed dict:", JSON.stringify(changedDict, null, 2));

            console.log("✓ changedDict contains only:", Object.keys(changedDict).join(", "));
            console.log("✓ Expected: id (primary key), display_name, updated_at");

            // Update using current method
            await cachedUser.save(tx2);
            console.log("✓ Row updated successfully");
        } else {
            console.log("✗ No cached row found for testing");
        }
    });

    // Test 3: Check the actual database query that would be generated
    console.log("\n--- Test 3: Database Query Optimization Analysis ---");
    const tx3 = database.newTx();
    await tx3.begin(async () => {
        const testId = `changeddict-test-${timestamp}`;
        const cachedUser = usersTable.getCachedRowForId(testId);

        if (cachedUser) {
            // Modify one field
            cachedUser.setRowKeyValue("display_name", "FINAL Update");

            const fullDict = cachedUser.asDict();
            const changedDict = cachedUser.changedDict();

            console.log("Current approach (full dict):");
            console.log(`  UPDATE users SET ${Object.keys(fullDict).map(k => `${k} = ?`).join(", ")} WHERE id = ?`);
            console.log(`  Parameters: ${Object.keys(fullDict).length + 1} total`);

            console.log("Optimized approach (changed dict):");
            console.log(`  UPDATE users SET ${Object.keys(changedDict).filter(k => k !== "id").map(k => `${k} = ?`).join(", ")} WHERE id = ?`);
            console.log(`  Parameters: ${Object.keys(changedDict).length} total`);

            const reduction = ((Object.keys(fullDict).length - Object.keys(changedDict).length) / Object.keys(fullDict).length * 100).toFixed(1);
            console.log(`  Optimization: ${reduction}% fewer fields to update`);
        }
    });

    console.log("\n=== changedDict() test completed ===");
}

// Run the test
testChangedDict().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});
