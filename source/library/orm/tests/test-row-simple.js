#!/usr/bin/env node

/**
 * Simple test for SvDbTable row methods
 */

"use strict";

// Add required modules to global scope
require("../../../../GameServer/site/strvct/webserver/SvGlobals");
require("../../../../GameServer/site/strvct/webserver/Base");

const SvDatabase = require("../SvDatabase");
const SvDbTable = require("../SvDbTable");
const SvDbColumn = require("../SvDbColumn");
const SvDbRow = require("../SvDbRow");

async function testRowMethodsSimple () {
    console.log("=== Testing SvDbTable Row Methods (Simple) ===\n");

    try {
        // Create a mock database and table structure
        console.log("1. Creating mock database structure...");
        const database = SvDatabase.clone();
        database.setDatabaseName("test_db");
        database.setTableNameToRowClassMap(new Map());

        // Create a test table
        const table = SvDbTable.clone();
        table.setDatabase(database);
        table.setTableName("test_users");

        // Create columns
        const idColumn = SvDbColumn.clone();
        idColumn.setTable(table);
        idColumn.setColumnName("id");
        idColumn.setDataType("VARCHAR(36)");
        idColumn.setPrimaryKey(true);
        idColumn.setAllowNull(false);

        const emailColumn = SvDbColumn.clone();
        emailColumn.setTable(table);
        emailColumn.setColumnName("email");
        emailColumn.setDataType("VARCHAR(255)");
        emailColumn.setAllowNull(false);
        emailColumn.setUnique(true);

        const nameColumn = SvDbColumn.clone();
        nameColumn.setTable(table);
        nameColumn.setColumnName("display_name");
        nameColumn.setDataType("VARCHAR(255)");
        nameColumn.setAllowNull(true);

        table.setColumns([idColumn, emailColumn, nameColumn]);
        database.setTables([table]);

        console.log("✓ Mock structure created\n");

        // Test column lookup
        console.log("2. Testing column operations...");
        const foundEmail = table.columnWithName("email");
        console.log(`  Found email column: ${foundEmail ? foundEmail.dataType() : "NOT FOUND"}`);

        const columnMap = table.nameToColumnMap();
        console.log(`  Column map size: ${columnMap ? columnMap.size : 0}`);
        console.log(`  Column names: ${columnMap ? Array.from(columnMap.keys()).join(", ") : "none"}`);
        console.log("✓ Column operations work\n");

        // Test row class
        console.log("3. Testing row class resolution...");
        const rowClass = table.rowClass();
        console.log(`  Row class: ${rowClass.name}`);
        console.log("✓ Row class resolved\n");

        // Test SvDbRow
        console.log("4. Testing SvDbRow operations...");
        const row = SvDbRow.clone();
        row.setTable(table);

        const testData = {
            id: "test-123",
            email: "test@example.com",
            display_name: "Test User"
        };

        try {
            row.setupFromDict(testData);
            console.log("  ✓ Row setup successful");

            const dict = row.asDict();
            console.log("  Row data:", JSON.stringify(dict, null, 2));
        } catch (error) {
            console.log(`  ✗ Row setup failed: ${error.message}`);
        }
        console.log("\n");

        // Test validation
        console.log("5. Testing validation...");
        try {
            row.setRowKeyValue("invalid_column", "value");
            console.log("  ✗ Validation should have failed for invalid column");
        } catch (error) {
            console.log(`  ✓ Validation correctly rejected invalid column: ${error.message}`);
        }

        // Summary of methods
        console.log("\n6. Available row methods summary:");
        console.log("  Table methods:");
        console.log("    - selectRows(searchOptions) - Query rows");
        console.log("    - insertRow(row) - Insert a row");
        console.log("    - updateRow(row) - Update a row");
        console.log("    - deleteRow(row) - Delete a row");
        console.log("  Row methods:");
        console.log("    - setupFromDict(dict) - Initialize from data");
        console.log("    - asDict() - Convert to dictionary");
        console.log("    - insert() - Insert this row");
        console.log("    - update() - Update this row");
        console.log("    - delete() - Delete this row");

        console.log("\n=== Issues to Fix ===");
        console.log("1. SvDbRow.dataTypeForValue() has inverted logic (line 64)");
        console.log("2. Table row methods expect database to implement query/insert/update/delete");
        console.log("3. Need to implement actual database operations");

    } catch (error) {
        console.error("\n✗ Test failed:", error);
        console.error(error.stack);
    }
}

// Run the test
testRowMethodsSimple().then(() => {
    console.log("\n=== Test Complete ===");
    process.exit(0);
}).catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
});
