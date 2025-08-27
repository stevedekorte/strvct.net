#!/usr/bin/env node

"use strict";

/**
 * Tests for Node.js implementation of SvIndexedDb using LevelDB
 * 
 * Database files are stored at: ./data/leveldb/{sanitized-path}/
 * For example:
 * - Path "/test/db1" → "./data/leveldb/_test_db1/"
 * - Path "/users/data" → "./data/leveldb/_users_data/"
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

// Test utilities
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.currentTest = null;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log(`${colors.blue}Starting SvIndexedDb Tests${colors.reset}\n`);
        console.log(`${colors.gray}Database files location: ./data/leveldb/{path}/${colors.reset}\n`);

        for (const test of this.tests) {
            this.currentTest = test.name;
            try {
                await test.fn();
                this.passed++;
                console.log(`${colors.green}✓${colors.reset} ${test.name}`);
            } catch (error) {
                this.failed++;
                console.log(`${colors.red}✗${colors.reset} ${test.name}`);
                console.log(`  ${colors.red}${error.message}${colors.reset}`);
                if (error.stack) {
                    console.log(`  ${colors.gray}${error.stack.split('\n').slice(1, 3).join('\n  ')}${colors.reset}`);
                }
            }
        }

        console.log(`\n${colors.blue}Results:${colors.reset}`);
        console.log(`  ${colors.green}Passed: ${this.passed}${colors.reset}`);
        if (this.failed > 0) {
            console.log(`  ${colors.red}Failed: ${this.failed}${colors.reset}`);
        }
        console.log('');

        // Show database files created
        await this.showDatabaseFiles();

        return this.failed === 0;
    }

    async showDatabaseFiles() {
        const dataDir = './data/leveldb';
        try {
            const dirs = await fs.readdir(dataDir);
            if (dirs.length > 0) {
                console.log(`${colors.blue}Database files created:${colors.reset}`);
                for (const dir of dirs) {
                    const fullPath = path.join(dataDir, dir);
                    const stats = await fs.stat(fullPath);
                    if (stats.isDirectory()) {
                        const files = await fs.readdir(fullPath);
                        const size = files.length;
                        console.log(`  ${colors.gray}${fullPath}/ (${size} files)${colors.reset}`);
                    }
                }
                console.log('');
            }
        } catch (e) {
            // Directory doesn't exist yet
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertDeepEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Objects not equal:\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
        }
    }
}

// Check if level module is installed
function checkLevelInstalled() {
    try {
        require('level');
        return true;
    } catch (e) {
        return false;
    }
}

// Install level if needed
async function ensureLevelInstalled() {
    if (!checkLevelInstalled()) {
        console.log(`${colors.yellow}Installing 'level' package...${colors.reset}`);
        try {
            execSync('npm install level', { stdio: 'inherit' });
            console.log(`${colors.green}Successfully installed 'level' package${colors.reset}\n`);
        } catch (error) {
            console.log(`${colors.red}Failed to install 'level' package. Please run: npm install level${colors.reset}`);
            process.exit(1);
        }
    }
}

// Clean up test databases
async function cleanupTestDatabases() {
    const dataDir = './data/leveldb';
    try {
        await fs.rm(dataDir, { recursive: true, force: true });
        console.log(`${colors.gray}Cleaned up test databases${colors.reset}`);
    } catch (e) {
        // Directory doesn't exist, that's fine
    }
}

// Load the STRVCT boot environment
async function loadStrvctEnvironment() {
    // Set up minimal globals for STRVCT
    global.SvGlobals = {
        globals: () => global,
        set: (key, value) => { global[key] = value; },
        get: (key) => global[key]
    };

    // Create mock Promise.clone if needed
    if (!Promise.clone) {
        Promise.clone = function() {
            let resolveFunc, rejectFunc;
            const promise = new Promise((resolve, reject) => {
                resolveFunc = resolve;
                rejectFunc = reject;
            });
            promise.callResolveFunc = function(value) { resolveFunc(value); };
            promise.callRejectFunc = function(error) { rejectFunc(error); };
            return promise;
        };
    }

    // Load required base classes
    const bootPath = path.join(__dirname, '..', '..');
    
    // Set up assert globally
    global.assert = (condition, message) => {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    };
    
    // Test if ClassicLevel loads correctly before STRVCT environment
    try {
        const { ClassicLevel: TestLevel } = require('classic-level');
        console.log(`${colors.green}✓ ClassicLevel loads correctly before STRVCT environment${colors.reset}`);
    } catch (e) {
        console.log(`${colors.red}✗ ClassicLevel failed to load before STRVCT:${colors.reset}`, e.message);
    }
    
    // Load SvBase
    eval(require('fs').readFileSync(path.join(bootPath, 'SvBase.js'), 'utf8'));
    
    // Need to set up initThisClass for the class pattern
    Object.prototype.initThisClass = function() {
        // Simple implementation for testing
        if (this.prototype && this.prototype.initPrototypeSlots) {
            this.prototype.initPrototypeSlots.call(this.prototype);
        }
        if (this.prototype && this.prototype.initPrototype) {
            this.prototype.initPrototype.call(this.prototype);
        }
        return this;
    };
    
    // Make ClassicLevel available globally for eval'd code
    global.ClassicLevel = require('classic-level').ClassicLevel;
    
    // Load the Node.js implementations (they are standalone, not categories)
    // Read the file content and replace the require statement with global reference
    let folderCode = require('fs').readFileSync(path.join(__dirname, '..', 'SvIndexedDbFolder.js'), 'utf8');
    folderCode = folderCode.replace(
        "const { ClassicLevel } = require('classic-level');",
        "const ClassicLevel = global.ClassicLevel;"
    );
    eval(folderCode);
    
    eval(require('fs').readFileSync(path.join(__dirname, '..', 'SvIndexedDbTx.js'), 'utf8'));
    
    // Test if ClassicLevel still works after STRVCT environment loaded
    try {
        const { ClassicLevel: TestLevel2 } = require('classic-level');
        console.log(`${colors.green}✓ ClassicLevel loads correctly after STRVCT environment${colors.reset}`);
        // Try to create an instance
        const testPath = './data/test-strvct-env';
        const testDb = new TestLevel2(testPath);
        console.log(`${colors.green}✓ ClassicLevel instance created successfully in test${colors.reset}`);
        testDb.close().catch(() => {}); // Clean up
        require('fs').rmSync(testPath, { recursive: true, force: true });
    } catch (e) {
        console.log(`${colors.red}✗ ClassicLevel failed after STRVCT:${colors.reset}`, e.message);
    }
}

// Main test suite
async function runTests() {
    await ensureLevelInstalled();
    await cleanupTestDatabases();
    await loadStrvctEnvironment();

    const runner = new TestRunner();
    const assert = runner.assert.bind(runner);
    const assertEqual = runner.assertEqual.bind(runner);
    const assertDeepEqual = runner.assertDeepEqual.bind(runner);

    // Test 1: Create and open database
    runner.test('Create and open database', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/db1/');
        await folder.promiseOpen();
        assert(folder.isOpen(), 'Database should be open');
        await folder.close();
    });

    // Test 2: Basic key-value operations
    runner.test('Basic put and get operations', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/basic/');
        
        await folder.promiseAtPut('key1', 'value1');
        const value = await folder.promiseAt('key1');
        assertEqual(value, 'value1', 'Retrieved value should match');
        
        await folder.close();
    });

    // Test 3: Key existence checks
    runner.test('Key existence checks', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/exists/');
        
        await folder.promiseAtPut('exists', 'yes');
        
        const hasKey1 = await folder.promiseHasKey('exists');
        assert(hasKey1, 'Key should exist');
        
        const hasKey2 = await folder.promiseHasKey('notexists');
        assert(!hasKey2, 'Key should not exist');
        
        await folder.close();
    });

    // Test 4: Remove operations
    runner.test('Remove operations', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/remove/');
        
        await folder.promiseAtPut('toremove', 'willbegone');
        await folder.promiseRemoveAt('toremove');
        
        const hasKey = await folder.promiseHasKey('toremove');
        assert(!hasKey, 'Key should be removed');
        
        await folder.close();
    });

    // Test 5: Transaction add operations
    runner.test('Transaction add operations', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/tx_add/');
        await folder.promiseOpen();
        
        const tx = await folder.promiseNewTx();
        tx.begin();
        tx.atAdd('tx_key1', 'tx_value1');
        tx.atAdd('tx_key2', 'tx_value2');
        await tx.promiseCommit();
        
        const value1 = await folder.promiseAt('tx_key1');
        assertEqual(value1, 'tx_value1');
        
        const value2 = await folder.promiseAt('tx_key2');
        assertEqual(value2, 'tx_value2');
        
        await folder.close();
    });

    // Test 6: Transaction update operations
    runner.test('Transaction update operations', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/tx_update/');
        await folder.promiseOpen();
        
        // First add a key
        await folder.promiseAtPut('update_key', 'original');
        
        // Update via transaction
        const tx = await folder.promiseNewTx();
        tx.begin();
        tx.atUpdate('update_key', 'updated');
        await tx.promiseCommit();
        
        const value = await folder.promiseAt('update_key');
        assertEqual(value, 'updated');
        
        await folder.close();
    });

    // Test 7: Transaction abort
    runner.test('Transaction abort', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/tx_abort/');
        await folder.promiseOpen();
        
        await folder.promiseAtPut('abort_key', 'original');
        
        const tx = await folder.promiseNewTx();
        tx.begin();
        tx.atUpdate('abort_key', 'should_not_be_saved');
        tx.abort();
        
        const value = await folder.promiseAt('abort_key');
        assertEqual(value, 'original', 'Value should not be changed after abort');
        
        await folder.close();
    });

    // Test 8: Duplicate key error (IndexedDB semantics)
    runner.test('Duplicate key error on add', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/duplicate/');
        await folder.promiseOpen();
        
        await folder.promiseAtPut('dup_key', 'first');
        
        const tx = await folder.promiseNewTx();
        tx.begin();
        tx.atAdd('dup_key', 'second');
        
        let errorThrown = false;
        try {
            await tx.promiseCommit();
        } catch (error) {
            errorThrown = true;
            assert(error.message.includes('Key already exists'), 'Should throw key exists error');
        }
        assert(errorThrown, 'Should throw error for duplicate key');
        
        await folder.close();
    });

    // Test 9: Get all keys
    runner.test('Get all keys', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/allkeys/');
        
        await folder.promiseAtPut('alpha', '1');
        await folder.promiseAtPut('beta', '2');
        await folder.promiseAtPut('gamma', '3');
        
        const keys = await folder.promiseAllKeys();
        assert(keys.includes('alpha'), 'Should include alpha');
        assert(keys.includes('beta'), 'Should include beta');
        assert(keys.includes('gamma'), 'Should include gamma');
        assertEqual(keys.length, 3, 'Should have 3 keys');
        
        await folder.close();
    });

    // Test 10: Get as Map
    runner.test('Get as Map', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/asmap/');
        
        await folder.promiseAtPut('one', 'first');
        await folder.promiseAtPut('two', 'second');
        
        const map = await folder.promiseAsMap();
        assert(map instanceof Map, 'Should return a Map');
        assertEqual(map.get('one'), 'first');
        assertEqual(map.get('two'), 'second');
        assertEqual(map.size, 2);
        
        await folder.close();
    });

    // Test 11: Count operations
    runner.test('Count operations', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/count/');
        
        await folder.promiseAtPut('c1', 'v1');
        await folder.promiseAtPut('c2', 'v2');
        await folder.promiseAtPut('c3', 'v3');
        
        const count = await folder.promiseCount();
        assertEqual(count, 3, 'Should have 3 entries');
        
        const countKey = await folder.promiseCount('c2');
        assertEqual(countKey, 1, 'Key should exist');
        
        const countMissing = await folder.promiseCount('missing');
        assertEqual(countMissing, 0, 'Missing key count should be 0');
        
        await folder.close();
    });

    // Test 12: Clear database
    runner.test('Clear database', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/clear/');
        
        await folder.promiseAtPut('clear1', 'v1');
        await folder.promiseAtPut('clear2', 'v2');
        
        await folder.promiseClear();
        
        const count = await folder.promiseCount();
        assertEqual(count, 0, 'Database should be empty after clear');
        
        await folder.close();
    });

    // Test 13: ArrayBuffer support
    runner.test('ArrayBuffer value support', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/arraybuffer/');
        
        const buffer = new ArrayBuffer(8);
        const view = new Uint8Array(buffer);
        view[0] = 42;
        view[1] = 255;
        
        await folder.promiseAtPut('binary', buffer);
        const retrieved = await folder.promiseAt('binary');
        
        // LevelDB returns a Buffer in Node.js, which we need to convert back
        assert(retrieved, 'Should retrieve value');
        // The implementation should handle the conversion
        
        await folder.close();
    });

    // Test 14: Path sanitization
    runner.test('Path sanitization', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/special!@#$%/');
        
        // Should sanitize special characters in path
        await folder.promiseAtPut('sanitized', 'works');
        const value = await folder.promiseAt('sanitized');
        assertEqual(value, 'works', 'Should work with sanitized path');
        
        await folder.close();
    });

    // Test 15: Delete database
    runner.test('Delete database', async () => {
        const folder = SvIndexedDbFolder.clone().setPath('/test/todelete/');
        
        await folder.promiseAtPut('temp', 'data');
        await folder.close();
        
        await folder.promiseDelete();
        
        // Try to reopen and check it's empty
        await folder.promiseOpen();
        const count = await folder.promiseCount();
        assertEqual(count, 0, 'Deleted database should be empty when reopened');
        
        await folder.close();
    });

    // Run all tests
    const success = await runner.run();
    
    // Clean up after tests
    await cleanupTestDatabases();
    
    process.exit(success ? 0 : 1);
}

// Change to the tests directory so relative paths work correctly
process.chdir(__dirname);

// Run the tests
runTests().catch(error => {
    console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
});