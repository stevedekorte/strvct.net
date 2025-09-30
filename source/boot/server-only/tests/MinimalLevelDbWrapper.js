#!/usr/bin/env node

// Minimal wrapper around LevelDB to test our implementation approach

const { ClassicLevel } = require('classic-level');
const path = require('path');
const fs = require('fs').promises;

class MinimalIndexedDbFolder {
    constructor () {
        this.path = '/';
        this.db = null;
        this.levelDb = null;
        this.dataDir = './data/leveldb/';
    }
    
    setPath (aPath) {
        this.path = aPath;
        return this;
    }
    
    dbPath () {
        const safePath = this.path.replace(/[^a-zA-Z0-9-_/]/g, '_');
        return path.join(this.dataDir, safePath);
    }
    
    isOpen () {
        return this.levelDb !== null && this.levelDb.status === 'open';
    }
    
    async promiseOpen () {
        if (this.isOpen()) return;
        
        const dbPath = this.dbPath();
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        
        console.log('Opening DB at:', dbPath);
        this.levelDb = new ClassicLevel(dbPath);
        await this.levelDb.open();
        this.db = this.levelDb;
    }
    
    async close () {
        if (this.levelDb) {
            await this.levelDb.close();
            this.levelDb = null;
            this.db = null;
        }
    }
    
    async promiseAtPut (key, value) {
        await this.promiseOpen();
        await this.levelDb.put(key, value);
    }
    
    async promiseAt (key) {
        await this.promiseOpen();
        try {
            return await this.levelDb.get(key);
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return undefined;
            }
            throw error;
        }
    }
    
    async promiseHasKey (key) {
        const val = await this.promiseAt(key);
        return val !== undefined;
    }
    
    static clone () {
        return new MinimalIndexedDbFolder();
    }
}

// Test it
async function test () {
    console.log('Testing minimal wrapper...');
    
    const folder = MinimalIndexedDbFolder.clone().setPath('/test/minimal/');
    
    console.log('Writing data...');
    await folder.promiseAtPut('test_key', 'test_value');
    
    console.log('Reading data...');
    const value = await folder.promiseAt('test_key');
    console.log('Read value:', value);
    
    console.log('Check key exists...');
    const exists = await folder.promiseHasKey('test_key');
    console.log('Key exists:', exists);
    
    await folder.close();
    console.log('✓ Minimal wrapper works!');
    
    // Clean up
    await fs.rm('./data', { recursive: true, force: true });
}

test().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});