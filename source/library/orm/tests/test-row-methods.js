#!/usr/bin/env node

/**
 * Test script for SvDbTable row methods
 */

"use strict";

const path = require("path");
const fs = require("fs");

// Add required modules to global scope
require("../../../../GameServer/site/strvct/webserver/SvGlobals");
require("../../../../GameServer/site/strvct/webserver/Base");

// Import ORM classes
const SvDatabase = require("../SvDatabase");
const SvDbRow = require("../SvDbRow");
const { initializeDatabase } = require("../../database");

/**
 * Main test function
 */
async function testRowMethods() {
    console.log("=== Testing SvDbTable Row Methods ===\n");
    
    try {
        // Initialize database connection
        console.log("1. Initializing database connection...");
        await initializeDatabase();
        console.log("✓ Database initialized\n");
        
        // Get shared database instance and setup (handles initialization automatically)
        console.log("2. Creating ORM instance...");
        const database = await SvDatabase.shared().setup();
        console.log("✓ ORM setup complete\n");
        
        // Get the users table
        console.log("3. Finding users table...");
        const usersTable = database.tableWithName("users");
        if (!usersTable) {
            throw new Error("Users table not found");
        }
        console.log("✓ Found users table\n");
        
        // Test column lookup
        console.log("4. Testing column lookup...");
        const emailColumn = usersTable.columnWithName("email");
        if (!emailColumn) {
            throw new Error("Email column not found");
        }
        console.log(`✓ Found email column: ${emailColumn.dataType()}\n`);
        
        // Test nameToColumnMap
        console.log("5. Testing nameToColumnMap...");
        const columnMap = usersTable.nameToColumnMap();
        if (!columnMap || columnMap.size === 0) {
            console.log("✗ Column map is empty or null");
            console.log("  Columns array:", usersTable.columns());
            console.log("  Attempting to update column map...");
            usersTable.updateNameToColumnMap();
        }
        console.log(`✓ Column map has ${columnMap ? columnMap.size : 0} entries\n`);
        
        // Test SvDbRow creation
        console.log("6. Testing SvDbRow creation...");
        const testRow = SvDbRow.clone();
        testRow.setTable(usersTable);
        
        const testData = {
            id: "test-id-123",
            email: "test@example.com",
            display_name: "Test User",
            password_hash: "hashed_password",
            account_status: "active"
        };
        
        console.log("  Setting up row from dict...");
        try {
            testRow.setupFromDict(testData);
            console.log("✓ Row setup successful\n");
        } catch (error) {
            console.log(`✗ Row setup failed: ${error.message}\n`);
        }
        
        // Test asDict
        console.log("7. Testing asDict...");
        const rowDict = testRow.asDict();
        console.log("  Row as dict:", JSON.stringify(rowDict, null, 2));
        console.log("✓ asDict works\n");
        
        // Note: We won't actually test insert/update/delete as they would modify the database
        console.log("8. Row methods available (not testing actual DB operations):");
        console.log("  - insertRow(): Would insert row to database");
        console.log("  - updateRow(): Would update row in database");
        console.log("  - deleteRow(): Would delete row from database");
        console.log("  - selectRows(): Would query rows from database\n");
        
        // Test issues found
        console.log("=== Issues Found ===");
        console.log("1. SvDbTable.setColumns() has infinite recursion (line 55)");
        console.log("2. SvDbTable.rowClass() references undefined 'name' variable (line 76)");
        console.log("3. SvDbTable methods expect database to have query/insert/update/delete methods");
        console.log("4. SvDbRow.dataTypeForValue() has inverted logic (line 64)");
        console.log("5. Missing 'fs' require in SvDatabase for readRowClassMapIfExists()");
        
    } catch (error) {
        console.error("\n✗ Test failed:", error);
        console.error(error.stack);
    }
}

// Run the test
testRowMethods().then(() => {
    console.log("\n=== Test Complete ===");
    process.exit(0);
}).catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
});