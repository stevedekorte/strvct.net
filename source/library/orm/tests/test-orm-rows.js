/**
 * @module webserver/orm/tests
 */

"use strict";

const SvDatabase = require("../SvDatabase");
const { v4: uuidv4 } = require('uuid');

/**
 * Test the ORM using the high-level row interface without touching Sequelize directly
 */
async function testOrmRowOperations() {
    try {
        console.log("Starting ORM Row Operations test...");
        
        // Get shared database instance and setup (handles initialization automatically)
        const database = await SvDatabase.shared().setup();
        console.log("Database setup completed");
        
        // Test the high-level ORM interface with transactions
        await testRowCrudOperations(database);
        
        console.log("\n=== ORM Row Operations test completed successfully ===");
        
    } catch (error) {
        console.error("Error during test:", error);
        process.exit(1);
    }
}

/**
 * Test row-based CRUD operations using the ORM
 */
async function testRowCrudOperations(database) {
    console.log("\n=== Testing Row-Based CRUD Operations ===");
    
    // Get the users table
    const usersTable = database.tableWithName("users");
    if (!usersTable) {
        throw new Error("Users table not found in database");
    }
    
    // Get the api_usage table
    const apiUsageTable = database.tableWithName("api_usage");
    if (!apiUsageTable) {
        throw new Error("API usage table not found in database");
    }
    
    console.log("Found tables: users, api_usage");
    
    // Create a transaction for all operations
    const tx = database.newTx();
    await tx.begin(async () => {
        console.log("\n--- Creating a new user row ---");
        
        // Create a new user row using the table's newRow() method
        const userRow = usersTable.newRow();
        
        // Set data on the row
        const userId = uuidv4();
        userRow.setRowKeyValue("id", userId);
        userRow.setRowKeyValue("email", "test@example.com");
        userRow.setRowKeyValue("password_hash", "hashed_password_123");
        userRow.setRowKeyValue("display_name", "Test User");
        userRow.setRowKeyValue("created_at", new Date());
        userRow.setRowKeyValue("updated_at", new Date());
        userRow.setRowKeyValue("account_status", "active");
        userRow.setRowKeyValue("email_verified", false);
        
        console.log("User row data set:", userRow.asDict());
        
        // Insert the row using the row's insert() method
        console.log("Inserting user row...");
        const insertedUserData = await userRow.insert();
        console.log("User inserted successfully:", insertedUserData);
        
        // Verify the row was updated with any database-generated values
        console.log("User row after insert:", userRow.asDict());
        
        console.log("\n--- Creating an API usage row ---");
        
        // Create an API usage row that references the user
        const apiUsageRow = apiUsageTable.newRow();
        
        const apiUsageId = uuidv4();
        apiUsageRow.setRowKeyValue("id", apiUsageId);
        apiUsageRow.setRowKeyValue("user_id", userId); // Foreign key reference
        apiUsageRow.setRowKeyValue("endpoint", "/test/endpoint");
        apiUsageRow.setRowKeyValue("created_at", new Date());
        apiUsageRow.setRowKeyValue("updated_at", new Date());
        apiUsageRow.setRowKeyValue("status_code", 200);
        apiUsageRow.setRowKeyValue("request_size", 1024);
        apiUsageRow.setRowKeyValue("response_size", 2048);
        apiUsageRow.setRowKeyValue("cost_usd", 0.01);
        
        console.log("API usage row data set:", apiUsageRow.asDict());
        
        // Insert the API usage row
        console.log("Inserting API usage row...");
        const insertedApiUsageData = await apiUsageRow.insert();
        console.log("API usage inserted successfully:", insertedApiUsageData);
        
        console.log("\n--- Testing row updates ---");
        
        // Update the user row
        userRow.setRowKeyValue("display_name", "Updated Test User");
        userRow.setRowKeyValue("updated_at", new Date());
        
        console.log("Updating user row...");
        const updatedUserData = await userRow.update();
        console.log("User updated successfully:", updatedUserData);
        
        console.log("\n--- Testing table-level queries ---");
        
        // Query users using the table's selectRows method
        const users = await usersTable.selectRows({ limit: 5 });
        console.log(`Found ${users.length} users`);
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`, user.asDict());
        });
        
        // Query API usage records
        const apiUsageRecords = await apiUsageTable.selectRows({ 
            where: { user_id: userId },
            limit: 10 
        });
        console.log(`Found ${apiUsageRecords.length} API usage records for user`);
        apiUsageRecords.forEach((record, index) => {
            console.log(`API Usage ${index + 1}:`, record.asDict());
        });
        
        console.log("\n--- Testing foreign key relationships ---");
        
        // Show foreign key information
        const userIdColumn = apiUsageTable.columnWithName("user_id");
        if (userIdColumn.isForeignKey()) {
            console.log("API usage user_id column foreign key info:");
            console.log(`  References: ${userIdColumn.referencedTableName()}.${userIdColumn.referencedColumnName()}`);
            console.log(`  Relationship type: ${userIdColumn.getRelationshipType()}`);
            const actions = userIdColumn.foreignKeyActions();
            console.log(`  On Update: ${actions.onUpdate}, On Delete: ${actions.onDelete}`);
            if (userIdColumn.constraintName()) {
                console.log(`  Constraint name: ${userIdColumn.constraintName()}`);
            }
        }
        
        console.log("\n--- Testing row deletion ---");
        
        // Delete the API usage row first (due to foreign key constraint)
        console.log("Deleting API usage row...");
        const apiUsageDeleted = await apiUsageRow.delete();
        console.log("API usage row deleted:", apiUsageDeleted);
        
        // Delete the user row
        console.log("Deleting user row...");
        const userDeleted = await userRow.delete();
        console.log("User row deleted:", userDeleted);
        
        console.log("\n--- Verifying deletions ---");
        
        // Verify the records are gone
        const remainingUsers = await usersTable.selectRows({ 
            where: { id: userId },
            limit: 1 
        });
        console.log(`Remaining users with deleted ID: ${remainingUsers.length}`);
        
        const remainingApiUsage = await apiUsageTable.selectRows({ 
            where: { id: apiUsageId },
            limit: 1 
        });
        console.log(`Remaining API usage with deleted ID: ${remainingApiUsage.length}`);
        
        return "All row operations completed successfully";
    });
    
    console.log("Row CRUD operations test completed");
}

// Run the test
if (require.main === module) {
    testOrmRowOperations().then(() => {
        console.log("Test finished");
        process.exit(0);
    }).catch(error => {
        console.error("Test failed:", error);
        process.exit(1);
    });
}

module.exports = { testOrmRowOperations };