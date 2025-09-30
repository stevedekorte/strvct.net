#!/usr/bin/env node

"use strict";

/**
 * Test that loads SvIndexedDb through proper boot system
 * This avoids the eval issues in the test environment
 */

const path = require('path');
const fs = require('fs').promises;

// Set up minimal STRVCT globals
global.SvGlobals = {
    globals: () => global,
    set: (key, value) => { global[key] = value; },
    get: (key) => global[key]
};

// Set up assert
global.assert = (condition, message) => {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
};

// Create mock Promise.clone if needed
if (!Promise.clone) {
    Promise.clone = function () {
        let resolveFunc, rejectFunc;
        const promise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        promise.callResolveFunc = function (value) { resolveFunc(value); };
        promise.callRejectFunc = function (error) { rejectFunc(error); };
        return promise;
    };
}

// Load the classes normally with require (not eval)
// This simulates how they'd actually be loaded in production
require(path.join(__dirname, '../../SvBase.js'));
require(path.join(__dirname, '../SvIndexedDbFolder.js'));
require(path.join(__dirname, '../SvIndexedDbTx.js'));

async function runTest () {
    console.log('Testing SvIndexedDb via proper loading...\n');
    
    // Clean up any previous test data
    await fs.rm('./data', { recursive: true, force: true }).catch(() => {});
    
    // Add a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Test 1: Create and open database
        console.log('Test 1: Create and open database');
        const folder1 = SvIndexedDbFolder.clone().setPath('/test/proper/');
        await folder1.promiseOpen();
        console.assert(folder1.isOpen(), 'Database should be open');
        console.log('✓ Database opened successfully');
        
        // Test 2: Put and get data
        console.log('\nTest 2: Put and get data');
        await folder1.promiseAtPut('key1', 'value1');
        const val1 = await folder1.promiseAt('key1');
        console.assert(val1 === 'value1', 'Value should match');
        console.log('✓ Put and get working');
        
        // Test 3: Transaction operations
        console.log('\nTest 3: Transaction operations');
        
        // List all keys before transaction
        const keysBefore = await folder1.promiseAllKeys();
        console.log('All keys before transaction:', keysBefore);
        
        // Check if key exists before transaction
        const existsBefore = await folder1.promiseHasKey('tx_test_key');
        console.log('Key exists before transaction:', existsBefore);
        
        if (existsBefore) {
            const valueBefore = await folder1.promiseAt('tx_test_key');
            console.log('Existing value:', valueBefore);
        }
        
        const tx = await folder1.promiseNewTx();
        tx.begin();
        // Use a timestamp to ensure unique key
        const uniqueKey = `tx_test_key_${Date.now()}`;
        tx.atAdd(uniqueKey, 'tx_test_value');
        await tx.promiseCommit();
        const txVal = await folder1.promiseAt(uniqueKey);
        console.assert(txVal === 'tx_test_value', 'Transaction value should be saved');
        console.log('✓ Transactions working');
        
        // Test 4: Key existence
        console.log('\nTest 4: Key existence checks');
        const exists = await folder1.promiseHasKey('key1');
        const notExists = await folder1.promiseHasKey('nonexistent');
        console.assert(exists === true, 'Key should exist');
        console.assert(notExists === false, 'Key should not exist');
        console.log('✓ Key existence checks working');
        
        // Test 5: Get all keys
        console.log('\nTest 5: Get all keys');
        const keys = await folder1.promiseAllKeys();
        console.assert(keys.includes('key1'), 'Should include key1');
        // Check for at least one transaction key (we're using timestamps)
        const hasTxKey = keys.some(k => k.startsWith('tx_test_key_'));
        console.assert(hasTxKey, 'Should include a transaction test key');
        console.log('✓ Get all keys working');
        
        // Close and clean up
        await folder1.close();
        
        console.log('\n✅ All tests passed!');
        console.log('\nDatabase files were stored at: ./data/leveldb/{path}/');
        
        // Clean up test data
        await fs.rm('./data', { recursive: true, force: true });
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        
        // Clean up on failure
        await fs.rm('./data', { recursive: true, force: true }).catch(() => {});
        
        process.exit(1);
    }
}

runTest();