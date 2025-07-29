/**
 * Test the new SvDbDataType utility class
 */

"use strict";

const SvDbDataType = require("../SvDbDataType");

function testSvDbDataType() {
    console.log("=== Testing SvDbDataType Class ===");
    
    // Test 1: dataTypeForValue static method
    console.log("\n--- Test 1: dataTypeForValue() ---");
    const testValues = [
        { value: "hello", expected: "String" },
        { value: 42, expected: "Integer" },
        { value: 3.14, expected: "Float" },
        { value: true, expected: "Boolean" },
        { value: new Date(), expected: "Date" },
        { value: null, expected: "Null" },
        { value: undefined, expected: "Undefined" },
        { value: BigInt(123), expected: "BigInt" },
        { value: [1, 2, 3], expected: "Array" },
        { value: Buffer.from("test"), expected: "Buffer" },
        { value: NaN, expected: "NaN" },
        { value: Infinity, expected: "Infinity" },
    ];
    
    testValues.forEach(({ value, expected }) => {
        const result = SvDbDataType.dataTypeForValue(value);
        if (result === expected) {
            console.log(`✓ ${String(value).substring(0, 20).padEnd(20)} -> ${result}`);
        } else {
            console.log(`✗ ${String(value).substring(0, 20).padEnd(20)} -> ${result} (expected ${expected})`);
        }
    });
    
    // Test 2: Type compatibility checking
    console.log("\n--- Test 2: Type Compatibility ---");
    const compatibilityTests = [
        { jsType: "String", dbType: "UUID", expected: true },
        { jsType: "Integer", dbType: "STRING", expected: true },
        { jsType: "Boolean", dbType: "INTEGER", expected: true },
        { jsType: "Array", dbType: "STRING", expected: false },
        { jsType: "Date", dbType: "DATE", expected: true },
        { jsType: "String", dbType: "DATE", expected: true },
        { jsType: "Float", dbType: "INTEGER", expected: false },
        { jsType: "Integer", dbType: "FLOAT", expected: true },
    ];
    
    compatibilityTests.forEach(({ jsType, dbType, expected }) => {
        const result = SvDbDataType.isJsTypeCompatibleWithDbType(jsType, dbType);
        const status = result === expected ? "✓" : "✗";
        console.log(`${status} ${jsType.padEnd(10)} with ${dbType.padEnd(8)} -> ${result}`);
    });
    
    // Test 3: Value validation
    console.log("\n--- Test 3: Value Validation ---");
    const validationTests = [
        { value: "123e4567-e89b-12d3-a456-426614174000", dbType: "UUID", allowNull: false, shouldPass: true },
        { value: "not-a-uuid", dbType: "UUID", allowNull: false, shouldPass: false },
        { value: "2023-12-25T10:30:00Z", dbType: "DATE", allowNull: false, shouldPass: true },
        { value: "not-a-date", dbType: "DATE", allowNull: false, shouldPass: false },
        { value: null, dbType: "STRING", allowNull: true, shouldPass: true },
        { value: null, dbType: "STRING", allowNull: false, shouldPass: false },
        { value: 42, dbType: "STRING", allowNull: false, shouldPass: true }, // Type coercion allowed
        { value: [1, 2, 3], dbType: "STRING", allowNull: false, shouldPass: false }, // Array not compatible
    ];
    
    validationTests.forEach(({ value, dbType, allowNull, shouldPass }, index) => {
        const result = SvDbDataType.validateValueForDbType(value, dbType, allowNull, `test_column_${index}`);
        const passed = result.valid === shouldPass;
        const status = passed ? "✓" : "✗";
        const valueStr = String(value).substring(0, 15).padEnd(15);
        console.log(`${status} ${valueStr} | ${dbType.padEnd(6)} | null:${allowNull} -> ${result.valid ? "PASS" : "FAIL"}`);
        if (!passed) {
            console.log(`    Expected: ${shouldPass}, Got: ${result.valid}, Error: ${result.error || "none"}`);
        }
    });
    
    // Test 4: UUID and Date specific validation
    console.log("\n--- Test 4: Specific Format Validation ---");
    
    // UUID validation
    const uuidTests = [
        { value: "123e4567-e89b-12d3-a456-426614174000", expected: true },
        { value: "invalid-uuid", expected: false },
        { value: "123e4567-e89b-12d3-a456-42661417400", expected: false }, // Too short
        { value: "123e4567-e89b-12d3-a456-426614174000-extra", expected: false }, // Too long
    ];
    
    uuidTests.forEach(({ value, expected }) => {
        const result = SvDbDataType.validateUuidFormat(value);
        const status = result.valid === expected ? "✓" : "✗";
        console.log(`${status} UUID: ${value.substring(0, 25).padEnd(25)} -> ${result.valid ? "VALID" : "INVALID"}`);
    });
    
    // Date validation  
    const dateTests = [
        { value: "2023-12-25T10:30:00Z", expected: true },
        { value: "2023-12-25", expected: true },
        { value: "invalid-date", expected: false },
        { value: "2023-13-45", expected: false }, // Invalid month/day
    ];
    
    dateTests.forEach(({ value, expected }) => {
        const result = SvDbDataType.validateDateFormat(value);
        const status = result.valid === expected ? "✓" : "✗";
        console.log(`${status} DATE: ${value.padEnd(25)} -> ${result.valid ? "VALID" : "INVALID"}`);
    });
    
    // Test 5: Compatible types lookup
    console.log("\n--- Test 5: Compatible Types Lookup ---");
    const dbTypes = ["UUID", "STRING", "INTEGER", "FLOAT", "DATE", "BOOLEAN", "BLOB"];
    
    dbTypes.forEach(dbType => {
        const compatibleTypes = SvDbDataType.getCompatibleJsTypesForDbType(dbType);
        console.log(`${dbType.padEnd(8)}: ${compatibleTypes.join(", ")}`);
    });
    
    console.log("\n=== SvDbDataType test completed ===");
}

testSvDbDataType();
console.log("Test finished successfully");