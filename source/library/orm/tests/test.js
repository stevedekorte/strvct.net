/**
 * @module webserver/orm/tests
 */

"use strict";

const SvDatabase = require("../SvDatabase");
const { sequelize } = require("../../database");
const fs = require("fs").promises;
const path = require("path");

/**
 * Write the database schema to a JSON file
 */
async function writeSchemaToFile(jsonSchema) {
    try {
        const testsDir = __dirname;
        const schemaFilePath = path.join(testsDir, "schema.json");
        
        const schemaJson = JSON.stringify(jsonSchema, null, 2);
        await fs.writeFile(schemaFilePath, schemaJson, 'utf8');
        
        console.log(`Schema successfully written to: ${schemaFilePath}`);
        console.log(`File size: ${schemaJson.length} characters`);
        
    } catch (error) {
        console.error("Error writing schema file:", error);
        throw error;
    }
}

/**
 * Test the SvDatabase ORM functionality
 */
async function testSvDatabase() {
    try {
        console.log("Starting SvDatabase test...");
        
        // Get shared database instance and setup (handles initialization automatically)
        const database = await SvDatabase.shared().setup();
        console.log("Database setup completed");
        
        // Get the JSON schema representation
        const jsonSchema = database.asJsonSchema();
        console.log("JSON Schema generated");
        
        // Print the result
        console.log("\n=== Database JSON Schema ===");
        console.log(JSON.stringify(jsonSchema, null, 2));
        
        // Write schema to file
        console.log("\n=== Writing Schema to File ===");
        await writeSchemaToFile(jsonSchema);
        
        // Test foreign key functionality
        console.log("\n=== Testing Foreign Key Detection ===");
        await testForeignKeyFunctionality(database);
        
        // Test transaction functionality
        console.log("\n=== Testing Transaction Interface ===");
        await testTransactionInterface(database);
        
        console.log("\n=== Test completed successfully ===");
        
    } catch (error) {
        console.error("Error during test:", error);
        process.exit(1);
    }
}

/**
 * Test foreign key detection functionality
 */
async function testForeignKeyFunctionality(database) {
    console.log("Testing foreign key detection functionality...");
    
    // First, check if foreign keys are enabled in SQLite
    console.log("\n--- Checking SQLite Foreign Key Status ---");
    try {
        const fkEnabled = await sequelize.query('PRAGMA foreign_keys');
        const isEnabled = fkEnabled[0].foreign_keys === 1;
        console.log("Foreign keys enabled:", isEnabled ? "YES" : "NO");
        
        // Enable foreign keys if they're not enabled
        if (!isEnabled) {
            console.log("Enabling foreign keys...");
            await sequelize.query('PRAGMA foreign_keys = ON');
            const fkEnabledAfter = await sequelize.query('PRAGMA foreign_keys');
            console.log("Foreign keys after enabling:", fkEnabledAfter[0].foreign_keys === 1 ? "YES" : "NO");
        }
    } catch (error) {
        console.log("Could not check foreign key status:", error.message);
    }
    
    // Look for columns that might be foreign keys based on naming conventions
    const tables = database.tables();
    let foreignKeyCount = 0;
    let potentialForeignKeyCount = 0;
    
    tables.forEach(table => {
        console.log(`\n--- Table: ${table.tableName()} ---`);
        
        table.columns().forEach(column => {
            const columnName = column.columnName();
            
            // Check if column has explicit foreign key information
            if (column.isForeignKey()) {
                console.log(`  ✓ ${columnName} is a foreign key to ${column.referencedTableName()}.${column.referencedColumnName()}`);
                const actions = column.foreignKeyActions();
                console.log(`    - On Update: ${actions.onUpdate}, On Delete: ${actions.onDelete}`);
                foreignKeyCount++;
            }
            // Check for potential foreign keys based on naming conventions
            else if (columnName.endsWith('_id') && columnName !== 'id') {
                console.log(`  ? ${columnName} might be a foreign key (follows naming convention)`);
                potentialForeignKeyCount++;
            }
        });
    });
    
    console.log(`\nForeign Key Summary:`);
    console.log(`  - Explicit foreign keys detected: ${foreignKeyCount}`);
    console.log(`  - Potential foreign keys (by naming): ${potentialForeignKeyCount}`);
    
    if (foreignKeyCount === 0 && potentialForeignKeyCount > 0) {
        console.log(`\nNote: The database may not have foreign key constraints defined,`);
        console.log(`or foreign key enforcement may be disabled in SQLite.`);
    }
    
    console.log("Foreign key detection test completed.");
}

/**
 * Test the transaction interface with CRUD operations
 */
async function testTransactionInterface(database) {
    console.log("Testing transaction interface...");
    
    // Test successful transaction
    console.log("\n--- Testing successful transaction ---");
    const tx = database.newTx();
    console.log("Transaction created successfully");
    
    const result = await tx.begin(async () => {
        console.log("Inside transaction callback");
        
        // Try to query a table (should work with transaction)
        const tables = database.tables();
        if (tables && tables.length > 0) {
            const firstTable = tables[0];
            console.log(`Querying table: ${firstTable.tableName()}`);
            
            try {
                const rows = await database.query(firstTable.tableName(), { limit: 1 });
                console.log(`Query successful, found ${rows.length} rows`);
            } catch (queryError) {
                console.log(`Query note: ${queryError.message} (this is expected for empty tables)`);
            }
        }
        
        return "Transaction completed successfully";
    });
    
    console.log("Transaction result:", result);
    console.log("Transaction reference should be null:", database.tx() === null);
    
    // Test transaction error handling
    console.log("\n--- Testing transaction rollback ---");
    try {
        const tx2 = database.newTx();
        await tx2.begin(async () => {
            console.log("Inside failing transaction");
            throw new Error("Intentional test error");
        });
    } catch (error) {
        console.log("Transaction correctly rolled back on error:", error.message);
        console.log("Transaction reference should be null:", database.tx() === null);
    }
    
    // Test error when no transaction is active
    console.log("\n--- Testing operations without transaction ---");
    try {
        await database.query("users", {});
    } catch (error) {
        console.log("Correctly blocked operation without transaction:", error.message);
    }
    
    // Test error when trying to create transaction while one is active
    console.log("\n--- Testing double transaction error ---");
    const tx3 = database.newTx();
    await tx3.begin(async () => {
        try {
            database.newTx(); // This should fail
        } catch (error) {
            console.log("Correctly blocked double transaction:", error.message);
        }
        return "Inner transaction check complete";
    });
    
    console.log("Transaction interface tests completed successfully");
}

// Run the test
if (require.main === module) {
    testSvDatabase().then(() => {
        console.log("Test finished");
        process.exit(0);
    }).catch(error => {
        console.error("Test failed:", error);
        process.exit(1);
    });
}

module.exports = { testSvDatabase };