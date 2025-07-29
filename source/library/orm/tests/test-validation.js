/**
 * Test enhanced validation in setRowKeyValue
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testValidation() {
    console.log("=== Testing Enhanced Validation ===");
    
    const database = await SvDatabase.shared().setup();
    const usersTable = database.tableWithName("users");
    const apiUsageTable = database.tableWithName("api_usage");
    
    console.log("Database setup completed");
    
    // Test 1: Valid values should work
    console.log("\n--- Test 1: Valid Values ---");
    const user = usersTable.newRow();
    
    try {
        user.setRowKeyValue("id", "123e4567-e89b-12d3-a456-426614174000");
        console.log("✓ Valid UUID accepted");
        
        user.setRowKeyValue("email", "test@example.com");
        console.log("✓ Valid email string accepted");
        
        user.setRowKeyValue("created_at", new Date());
        console.log("✓ Valid Date object accepted");
        
        user.setRowKeyValue("email_verified", false);
        console.log("✓ Valid boolean for integer column accepted");
        
    } catch (error) {
        console.log("✗ Unexpected validation error:", error.message);
    }
    
    // Test 2: Invalid column names should fail
    console.log("\n--- Test 2: Invalid Column Names ---");
    try {
        user.setRowKeyValue("nonexistent_column", "value");
        console.log("✗ Should have failed for invalid column");
    } catch (error) {
        console.log("✓ Correctly rejected invalid column:", error.message);
    }
    
    // Test 3: Type mismatches should fail appropriately
    console.log("\n--- Test 3: Type Validation ---");
    
    // Invalid UUID
    try {
        user.setRowKeyValue("id", "not-a-uuid");
        console.log("✗ Should have failed for invalid UUID");
    } catch (error) {
        console.log("✓ Correctly rejected invalid UUID:", error.message);
    }
    
    // Invalid date string
    try {
        user.setRowKeyValue("created_at", "not-a-date");
        console.log("✗ Should have failed for invalid date");
    } catch (error) {
        console.log("✓ Correctly rejected invalid date:", error.message);
    }
    
    // Array where string expected
    try {
        user.setRowKeyValue("email", [1, 2, 3]);
        console.log("✗ Should have failed for array in string column");
    } catch (error) {
        console.log("✓ Correctly rejected array for string column:", error.message);
    }
    
    // Test 4: Edge cases and type coercion
    console.log("\n--- Test 4: Edge Cases ---");
    const apiUsage = apiUsageTable.newRow();
    
    try {
        // Number to string should be allowed
        apiUsage.setRowKeyValue("endpoint", 123);
        console.log("✓ Number to string conversion allowed");
        
        // Integer for float should be allowed  
        apiUsage.setRowKeyValue("cost_usd", 5);
        console.log("✓ Integer for float column allowed");
        
        // Boolean to integer (0/1)
        apiUsage.setRowKeyValue("status_code", true);
        console.log("✓ Boolean to integer conversion allowed");
        
    } catch (error) {
        console.log("✗ Unexpected validation error:", error.message);
    }
    
    // Test 5: Null value validation
    console.log("\n--- Test 5: Null Value Validation ---");
    try {
        // Most columns should allow null (check one that does)
        user.setRowKeyValue("last_login", null);
        console.log("✓ Null value accepted for nullable column");
        
        // Try null on a non-nullable column (ID is usually non-nullable)
        user.setRowKeyValue("id", null);
        console.log("✗ Should have failed for null on non-nullable column");
    } catch (error) {
        console.log("✓ Correctly rejected null for non-nullable column:", error.message);
    }
    
    // Test 6: Comprehensive dataType coverage
    console.log("\n--- Test 6: dataTypeForValue Coverage ---");
    const testValues = [
        { value: "string", expected: "String" },
        { value: 42, expected: "Integer" },
        { value: 3.14, expected: "Float" },
        { value: true, expected: "Boolean" },
        { value: new Date(), expected: "Date" },
        { value: null, expected: "Null" },
        { value: undefined, expected: "Undefined" },
        { value: BigInt(123), expected: "BigInt" },
        { value: [1, 2, 3], expected: "Array" },
        { value: { key: "value" }, expected: "Object" },
        { value: Buffer.from("test"), expected: "Buffer" },
        { value: NaN, expected: "NaN" },
        { value: Infinity, expected: "Infinity" },
    ];
    
    testValues.forEach(({ value, expected }) => {
        const column = user.table().columnWithName("id"); // Use any column for testing dataTypeForValue
        const result = column.dataTypeForValue(value);
        if (result === expected) {
            console.log(`✓ ${String(value).substring(0, 20).padEnd(20)} -> ${result}`);
        } else {
            console.log(`✗ ${String(value).substring(0, 20).padEnd(20)} -> ${result} (expected ${expected})`);
        }
    });
    
    console.log("\n=== Validation test completed ===");
}

testValidation().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});