#!/usr/bin/env node

/**
 * Test database operations with Sequelize
 */

"use strict";

// Add required modules to global scope
require("../../../../GameServer/site/strvct/webserver/SvGlobals");
require("../../../../GameServer/site/strvct/webserver/Base");

const SvDatabase = require("../SvDatabase");
const SvDbRow = require("../SvDbRow");
const { initializeDatabase, sequelize } = require("../../database");
const { v4: uuidv4 } = require("uuid");

async function testDatabaseOperations () {
    console.log("=== Testing Database Operations ===\n");

    let testCustomerId = null;
    let testProductId = null;

    try {
        // Initialize database
        console.log("1. Initializing database...");
        await initializeDatabase();
        console.log("✓ Database initialized\n");

        // Get shared database instance and setup (handles initialization automatically)
        console.log("2. Loading database schema...");
        const database = await SvDatabase.shared().setup();
        console.log("✓ Schema loaded\n");

        // Get orders table (simpler than customers table)
        console.log("3. Finding orders table...");
        const ordersTable = database.tableWithName("orders");
        if (!ordersTable) {
            throw new Error("Orders table not found");
        }
        console.log("✓ Found orders table\n");

        // First, we need a test customer
        console.log("4. Creating test customer...");
        testCustomerId = uuidv4();
        const now = new Date().toISOString();
        await sequelize.query(
            `INSERT INTO customers (id, email, passwordHash, firstName, lastName, status, createdAt, updatedAt) 
             VALUES (:id, :email, :passwordHash, :firstName, :lastName, :status, :createdAt, :updatedAt)`,
            {
                replacements: {
                    id: testCustomerId,
                    email: `test-${Date.now()}@example.com`,
                    passwordHash: "hashed",
                    firstName: "Test",
                    lastName: "Customer",
                    status: "active",
                    createdAt: now,
                    updatedAt: now
                }
            }
        );
        console.log(`✓ Created test customer: ${testCustomerId}\n`);

        // Test INSERT
        console.log("5. Testing INSERT operation...");
        const newRow = SvDbRow.clone();
        newRow.setTable(ordersTable);

        const orderData = {
            id: uuidv4(),
            customerId: testCustomerId,
            orderNumber: `ORD-${Date.now()}`,
            totalAmount: 199.99,
            status: "pending",
            createdAt: now,
            updatedAt: now
        };

        newRow.setupFromDict(orderData);
        const insertResult = await newRow.insert();
        console.log("  Inserted:", JSON.stringify(insertResult, null, 2));
        console.log("✓ INSERT successful\n");

        // Test SELECT
        console.log("6. Testing SELECT operation...");
        const rows = await ordersTable.selectRows({
            where: { customerId: testCustomerId }
        });
        console.log(`  Found ${rows.length} rows`);
        if (rows.length > 0) {
            console.log("  First row:", JSON.stringify(rows[0].asDict(), null, 2));
        }
        console.log("✓ SELECT successful\n");

        // Test UPDATE
        console.log("7. Testing UPDATE operation...");
        if (rows.length > 0) {
            const rowToUpdate = rows[0];
            rowToUpdate.setRowKeyValue("status", "processing");
            rowToUpdate.setRowKeyValue("totalAmount", 249.99);

            const updateResult = await rowToUpdate.update();
            console.log("  Updated:", JSON.stringify(updateResult, null, 2));
            console.log("✓ UPDATE successful\n");
        }

        // Test SELECT with pagination
        console.log("8. Testing SELECT with pagination...");
        const pagedRows = await ordersTable.selectRows({
            limit: 5,
            page: 1,
            sort: "createdAt",
            order: "desc"
        });
        console.log(`  Found ${pagedRows.length} rows with pagination`);
        console.log("✓ Paginated SELECT successful\n");

        // Test DELETE
        console.log("9. Testing DELETE operation...");
        if (rows.length > 0) {
            const rowToDelete = rows[0];
            const deleteResult = await rowToDelete.delete();
            console.log(`  Delete result: ${deleteResult}`);

            // Verify deletion
            const afterDelete = await ordersTable.selectRows({
                where: { id: rowToDelete.asDict().id }
            });
            console.log(`  Rows after delete: ${afterDelete.length}`);
            console.log("✓ DELETE successful\n");
        }

        console.log("=== All Operations Successful ===");

    } catch (error) {
        console.error("\n✗ Test failed:", error);
        console.error(error.stack);
    } finally {
        // Cleanup: Delete test data
        if (testCustomerId) {
            console.log("\nCleaning up test data...");
            try {
                await sequelize.query("DELETE FROM orders WHERE customerId = :customerId", {
                    replacements: { customerId: testCustomerId }
                });
                await sequelize.query("DELETE FROM customers WHERE id = :id", {
                    replacements: { id: testCustomerId }
                });
                console.log("✓ Cleanup complete");
            } catch (cleanupError) {
                console.error("Cleanup failed:", cleanupError.message);
            }
        }
    }
}

// Run the test
testDatabaseOperations().then(() => {
    console.log("\n=== Test Complete ===");
    process.exit(0);
}).catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
});
