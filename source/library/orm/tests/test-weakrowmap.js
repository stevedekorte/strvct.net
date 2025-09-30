/**
 * Test script for WeakRowMap functionality
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testWeakRowMap () {
    console.log("=== Testing WeakRowMap Functionality ===");

    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");

    // Test with a transaction
    const tx = database.newTx();
    await tx.begin(async () => {
        console.log("\n--- Testing Row Insertion and WeakRowMap ---");

        // Get the users table
        const usersTable = database.tableWithName("users");
        console.log(`Testing with table: ${usersTable.tableName()}`);

        // Check initial state of weakRowMap
        const initialCount = usersTable.weakRowMap().count();
        console.log(`Initial weakRowMap count: ${initialCount}`);

        // Create a new row with unique values
        const timestamp = Date.now();
        const newUser = usersTable.newRow();
        newUser.setRowKeyValue("id", `test-uuid-${timestamp}-1`);
        newUser.setRowKeyValue("email", `test${timestamp}@example.com`);
        newUser.setRowKeyValue("password_hash", "test-hash");
        newUser.setRowKeyValue("display_name", "Test User");
        newUser.setRowKeyValue("created_at", new Date());
        newUser.setRowKeyValue("updated_at", new Date());

        console.log("Created new user row with id:", newUser.asDict().id);

        // Check weakRowMap before insert - should still be empty since no ID was assigned yet
        const beforeInsertCount = usersTable.weakRowMap().count();
        console.log(`WeakRowMap count before insert: ${beforeInsertCount}`);

        // Insert the row
        console.log("Inserting row...");
        await newUser.save(tx);

        // Check weakRowMap after insert - should contain the row
        const afterInsertCount = usersTable.weakRowMap().count();
        console.log(`WeakRowMap count after insert: ${afterInsertCount}`);

        // Verify the row is in the weakRowMap
        const testId1 = `test-uuid-${timestamp}-1`;
        const retrievedRow = usersTable.weakRowMap().get(testId1);
        if (retrievedRow) {
            console.log("✓ Row successfully found in weakRowMap");
            console.log(`  Retrieved row email: ${retrievedRow.asDict().email}`);
            console.log(`  Retrieved row display_name: ${retrievedRow.asDict().display_name}`);
        } else {
            console.log("✗ Row NOT found in weakRowMap");
        }

        // Test creating another row
        console.log("\n--- Testing Second Row Insertion ---");
        const newUser2 = usersTable.newRow();
        const testId2 = `test-uuid-${timestamp}-2`;
        newUser2.setRowKeyValue("id", testId2);
        newUser2.setRowKeyValue("email", `test${timestamp}-2@example.com`);
        newUser2.setRowKeyValue("password_hash", "test-hash-2");
        newUser2.setRowKeyValue("display_name", "Test User 2");
        newUser2.setRowKeyValue("created_at", new Date());
        newUser2.setRowKeyValue("updated_at", new Date());

        await newUser2.save(tx);

        const finalCount = usersTable.weakRowMap().count();
        console.log(`Final weakRowMap count: ${finalCount}`);

        // Verify both rows are in the weakRowMap
        const row1 = usersTable.weakRowMap().get(testId1);
        const row2 = usersTable.weakRowMap().get(testId2);

        if (row1 && row2) {
            console.log("✓ Both rows successfully found in weakRowMap");
        } else {
            console.log("✗ Not all rows found in weakRowMap");
        }

        // List all keys in the weakRowMap
        const keys = usersTable.weakRowMap().keysArray();
        console.log(`WeakRowMap keys: [${keys.join(", ")}]`);

        // Test with existing rows from database
        console.log("\n--- Testing Existing Rows from Database ---");
        const existingRows = await usersTable.selectRows({ limit: 3 }, tx);
        console.log(`Loaded ${existingRows.length} existing rows from database`);

        // Note: Existing rows loaded from database should NOT be automatically added to weakRowMap
        // since they didn't get their ID "assigned" during this session
        const countAfterSelect = usersTable.weakRowMap().count();
        console.log(`WeakRowMap count after loading existing rows: ${countAfterSelect}`);

        if (countAfterSelect === finalCount) {
            console.log("✓ Existing rows correctly NOT added to weakRowMap automatically");
        } else {
            console.log("? Existing rows were added to weakRowMap (unexpected behavior)");
        }

        // Test deletion
        console.log("\n--- Testing Row Deletion ---");
        console.log(`WeakRowMap count before deletion: ${usersTable.weakRowMap().count()}`);

        // Delete the first test row
        console.log(`Deleting row with ID: ${testId1}`);
        const deleteResult = await newUser.delete(tx);
        console.log(`Delete result: ${deleteResult}`);

        const countAfterDelete = usersTable.weakRowMap().count();
        console.log(`WeakRowMap count after deletion: ${countAfterDelete}`);

        // Verify the deleted row is no longer in the weakRowMap
        const deletedRowCheck = usersTable.weakRowMap().get(testId1);
        if (!deletedRowCheck) {
            console.log("✓ Deleted row successfully removed from weakRowMap");
        } else {
            console.log("✗ Deleted row still found in weakRowMap");
        }

        // Verify the second row is still there
        const remainingRowCheck = usersTable.weakRowMap().get(testId2);
        if (remainingRowCheck) {
            console.log("✓ Non-deleted row still found in weakRowMap");
        } else {
            console.log("✗ Non-deleted row missing from weakRowMap");
        }

        // List remaining keys
        const remainingKeys = usersTable.weakRowMap().keysArray();
        console.log(`Remaining weakRowMap keys: [${remainingKeys.join(", ")}]`);

        // Test caching functionality
        console.log("\n--- Testing Row Caching ---");

        // Query for the second row (which should still exist)
        console.log(`Querying for row with ID: ${testId2}`);
        const queriedRows = await usersTable.selectRows({ where: { id: testId2 } }, tx);

        if (queriedRows.length > 0) {
            const queriedRow = queriedRows[0];
            console.log(`Found row with email: ${queriedRow.asDict().email}`);

            // Check if this is the same object instance as the one in cache
            const cachedRow = usersTable.getCachedRowForId(testId2);
            if (queriedRow === cachedRow) {
                console.log("✓ Query returned the same cached row object instance");
            } else {
                console.log("✗ Query returned a different row object instance");
            }

            // Query again to double-check caching
            const secondQuery = await usersTable.selectRows({ where: { id: testId2 } }, tx);
            if (secondQuery.length > 0 && secondQuery[0] === queriedRow) {
                console.log("✓ Second query also returned the same cached row object instance");
            } else {
                console.log("✗ Second query returned a different row object instance");
            }
        } else {
            console.log("✗ Row not found in query results");
        }

        // Test getCachedRowForId directly
        console.log("\n--- Testing getCachedRowForId ---");
        const directCachedRow = usersTable.getCachedRowForId(testId2);
        if (directCachedRow) {
            console.log(`✓ getCachedRowForId returned row with email: ${directCachedRow.asDict().email}`);
        } else {
            console.log("✗ getCachedRowForId returned null");
        }

        // Test with non-existent ID
        const nonExistentRow = usersTable.getCachedRowForId("non-existent-id");
        if (!nonExistentRow) {
            console.log("✓ getCachedRowForId correctly returned null for non-existent ID");
        } else {
            console.log("✗ getCachedRowForId returned a row for non-existent ID");
        }
    });

    console.log("\n=== WeakRowMap test completed ===");
}

// Run the test
testWeakRowMap().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});
