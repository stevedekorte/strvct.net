#!/usr/bin/env node

// Simple test to verify Level module works correctly

const { ClassicLevel } = require('classic-level');
const path = require('path');
const fs = require('fs').promises;

async function testLevel () {
    const dbPath = './data/test-simple-level';
    
    // Clean up any previous test
    try {
        await fs.rm(dbPath, { recursive: true, force: true });
    } catch (e) {}
    
    console.log('Creating Level database at:', dbPath);
    
    // Create database - no encoding specified initially
    const db = new ClassicLevel(dbPath);
    
    console.log('Opening database...');
    await db.open();
    
    console.log('Writing test data...');
    await db.put('key1', 'value1');
    await db.put('key2', 'value2');
    
    console.log('Reading test data...');
    const val1 = await db.get('key1');
    console.log('key1 =', val1);
    
    const val2 = await db.get('key2');
    console.log('key2 =', val2);
    
    console.log('Listing all keys...');
    for await (const key of db.keys()) {
        console.log('  -', key);
    }
    
    console.log('Closing database...');
    await db.close();
    
    console.log('✓ Level module works correctly!');
    
    // Clean up
    await fs.rm(dbPath, { recursive: true, force: true });
}

testLevel().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});