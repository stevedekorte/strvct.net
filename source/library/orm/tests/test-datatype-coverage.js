/**
 * Test to analyze dataTypeForValue() coverage
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testDataTypeCoverage () {
    console.log("=== Testing dataTypeForValue() Coverage ===");

    const database = await SvDatabase.shared().setup();
    const usersTable = database.tableWithName("users");
    const apiUsageTable = database.tableWithName("api_usage");

    // Test with real values we might encounter
    const testValues = [
        // Basic types
        "hello world",
        123,
        45.67,
        true,
        false,

        // Database-specific types
        new Date(),
        new Date().toISOString(),
        null,
        undefined,

        // UUID strings
        "123e4567-e89b-12d3-a456-426614174000",

        // Arrays and objects (shouldn't be stored but could be passed)
        [1, 2, 3],
        { key: "value" },

        // Special numbers
        0,
        -1,
        Infinity,
        NaN,

        // Empty/whitespace strings
        "",
        "   ",

        // Serialized data
        JSON.stringify({ test: "data" }),

        // Large integers (might come from database)
        9007199254740991, // MAX_SAFE_INTEGER
        BigInt(123),

        // Buffer (binary data)
        Buffer.from("test"),
    ];

    const row = usersTable.newRow();

    console.log("Value Analysis:");
    console.log("=".repeat(80));

    testValues.forEach((value, index) => {
        const jsType = typeof value;
        const constructor = value?.constructor?.name || "null";
        const column = row.table().columnWithName("id"); // Use any column for testing dataTypeForValue
        const ormType = column.dataTypeForValue(value);
        const valueStr = String(value).substring(0, 30);

        console.log(`${String(index + 1).padStart(2)}. ${valueStr.padEnd(32)} | JS: ${jsType.padEnd(9)} | Constructor: ${constructor.padEnd(10)} | ORM: ${ormType}`);
    });

    console.log("=".repeat(80));
    console.log("\nDatabase Column Types vs JavaScript Types:");

    // Check what types our actual database columns expect
    const columnTypeMapping = new Map();

    [usersTable, apiUsageTable].forEach(table => {
        table.columns().forEach(col => {
            const dbType = col.dataType();
            if (!columnTypeMapping.has(dbType)) {
                columnTypeMapping.set(dbType, []);
            }
            columnTypeMapping.get(dbType).push(`${table.tableName()}.${col.columnName()}`);
        });
    });

    columnTypeMapping.forEach((columns, dbType) => {
        console.log(`\n${dbType}:`);
        columns.slice(0, 3).forEach(col => {
            console.log(`  - ${col}`);
        });
        if (columns.length > 3) {
            console.log(`  - ... and ${columns.length - 3} more`);
        }
    });

    console.log("\n=== Analysis Complete ===");
}

testDataTypeCoverage().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});
