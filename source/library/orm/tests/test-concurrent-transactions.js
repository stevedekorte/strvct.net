/**
 * Test script for concurrent multiple transactions
 */

"use strict";

const SvDatabase = require("../SvDatabase");

async function testConcurrentTransactions() {
    console.log("=== Testing Concurrent Multiple Transactions ===");
    
    // Get shared database instance and setup (handles initialization automatically)
    const database = await SvDatabase.shared().setup();
    console.log("Database setup completed");
    
    const usersTable = database.tableWithName("users");
    const timestamp = Date.now();
    
    console.log("Initial activeTxs count:", database.activeTxs().size);
    
    // Test concurrent transactions
    console.log("\n--- Test: Multiple Concurrent Transactions ---");
    
    // Create multiple transactions
    const tx1 = database.newTx();
    const tx2 = database.newTx(); 
    const tx3 = database.newTx();
    
    console.log("Created 3 transactions");
    console.log("activeTxs count after creation:", database.activeTxs().size);
    
    // Run transactions concurrently
    const results = await Promise.all([
        // Transaction 1: Insert user A
        tx1.begin(async () => {
            console.log("TX1: Starting");
            const userA = usersTable.newRow();
            userA.setRowKeyValue("id", `concurrent-test-${timestamp}-A`);
            userA.setRowKeyValue("email", `user-a-${timestamp}@example.com`);
            userA.setRowKeyValue("password_hash", "hash-a");
            userA.setRowKeyValue("display_name", "User A");
            userA.setRowKeyValue("created_at", new Date());
            userA.setRowKeyValue("updated_at", new Date());
            
            await userA.save(tx1);
            console.log("TX1: Saved user A");
            return "TX1 completed";
        }),
        
        // Transaction 2: Insert user B 
        tx2.begin(async () => {
            console.log("TX2: Starting");
            const userB = usersTable.newRow();
            userB.setRowKeyValue("id", `concurrent-test-${timestamp}-B`);
            userB.setRowKeyValue("email", `user-b-${timestamp}@example.com`);
            userB.setRowKeyValue("password_hash", "hash-b");
            userB.setRowKeyValue("display_name", "User B");
            userB.setRowKeyValue("created_at", new Date());
            userB.setRowKeyValue("updated_at", new Date());
            
            await userB.save(tx2);
            console.log("TX2: Saved user B");
            return "TX2 completed";
        }),
        
        // Transaction 3: Query existing users
        tx3.begin(async () => {
            console.log("TX3: Starting");
            const existingUsers = await usersTable.selectRows({ limit: 5 }, tx3);
            console.log(`TX3: Found ${existingUsers.length} existing users`);
            return `TX3 completed - found ${existingUsers.length} users`;
        })
    ]);
    
    console.log("All transactions completed:", results);
    console.log("Final activeTxs count:", database.activeTxs().size);
    
    // Verify users were created
    console.log("\n--- Verification: Check Created Users ---");
    const tx4 = database.newTx();
    await tx4.begin(async () => {
        const userA = await usersTable.selectRows({ 
            where: { id: `concurrent-test-${timestamp}-A` } 
        }, tx4);
        const userB = await usersTable.selectRows({ 
            where: { id: `concurrent-test-${timestamp}-B` } 
        }, tx4);
        
        console.log("User A created:", userA.length > 0 ? "✓ YES" : "✗ NO");
        console.log("User B created:", userB.length > 0 ? "✓ YES" : "✗ NO");
        
        if (userA.length > 0) {
            console.log("User A email:", userA[0].asDict().email);
        }
        if (userB.length > 0) {
            console.log("User B email:", userB[0].asDict().email);
        }
    });
    
    console.log("\n=== Concurrent Transactions test completed ===");
}

// Run the test
testConcurrentTransactions().then(() => {
    console.log("Test finished successfully");
    process.exit(0);
}).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
});