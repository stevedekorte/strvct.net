#!/usr/bin/env node

const { ClassicLevel } = require('classic-level');
const fs = require('fs').promises;

async function test() {
    // Clean up
    await fs.rm('./data', { recursive: true, force: true }).catch(() => {});
    
    const db = new ClassicLevel('./data/debug-test');
    await db.open();
    
    console.log('Testing non-existent key...');
    try {
        const val = await db.get('nonexistent');
        console.log('Value found (unexpected):', val);
        console.log('Type:', typeof val);
        console.log('Is undefined?', val === undefined);
        console.log('Is string "undefined"?', val === 'undefined');
    } catch (error) {
        console.log('Error (expected):', error.code);
    }
    
    console.log('\nStoring a value...');
    await db.put('test', 'value');
    
    console.log('\nGetting existing key...');
    const val2 = await db.get('test');
    console.log('Value:', val2);
    
    await db.close();
    await fs.rm('./data', { recursive: true, force: true });
}

test().catch(console.error);