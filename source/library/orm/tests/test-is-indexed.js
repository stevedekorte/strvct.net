/**
 * Test script to verify isIndexed property is being set correctly
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testIsIndexed() {
    console.log("=== Testing isIndexed Property ===");
    
    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");
    
    // Test users table which should have indexes
    const usersTable = database.tableWithName("users");
    if (!usersTable) {
        throw new Error("Users table not found");
    }
    
    console.log("\n--- Users Table Column Index Information ---");
    usersTable.columns().forEach(column => {
        console.log(`Column: ${column.columnName().padEnd(20)} | Indexed: ${column.isIndexed() ? '✓' : '✗'}`);
    });
    
    // Test api_usage table which should also have indexes
    const apiUsageTable = database.tableWithName("api_usage");
    if (apiUsageTable) {
        console.log("\n--- API Usage Table Column Index Information ---");
        apiUsageTable.columns().forEach(column => {
            console.log(`Column: ${column.columnName().padEnd(20)} | Indexed: ${column.isIndexed() ? '✓' : '✗'}`);
        });
    }
    
    // Test the new helper methods
    console.log("\n--- Query Performance Analysis ---");
    usersTable.columns().slice(0, 6).forEach(column => {
        const perf = column.getQueryPerformance();
        const suitable = column.isSuitableForLookup();
        console.log(`${column.columnName().padEnd(20)} | ${perf.speed.padEnd(10)} | ${suitable ? '✓' : '✗'} | ${perf.note}`);
    });
    
    // Output JSON schema to see the isIndexed property
    const schema = database.asJsonSchema();
    const usersTableSchema = schema.tables.find(t => t.name === "users");
    
    console.log("\n--- Sample Column Schema (first 3 columns) ---");
    if (usersTableSchema) {
        usersTableSchema.columns.slice(0, 3).forEach(col => {
            console.log(`${col.name}:`, JSON.stringify({
                dataType: col.dataType,
                primaryKey: col.primaryKey,
                unique: col.unique,
                isIndexed: col.isIndexed
            }, null, 2));
        });
    }
    
    console.log("\n=== isIndexed test completed ===");
}

// Run the test
testIsIndexed().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});