# STRVCT ORM

A comprehensive Object-Relational Mapping (ORM) system built on the STRVCT framework for database introspection and management with full transaction support.

## Overview

This ORM provides a structured way to represent and interact with database schemas using STRVCT's object-oriented patterns. It reads database metadata via Sequelize, creates a hierarchical object model for programmatic access, and provides managed database operations with automatic transaction enforcement.

## Architecture

### Core Classes

- **SvDatabase** - Top-level database representation with transaction management and CRUD operations
- **SvDbTable** - Individual table representation with column collection management and row object caching
- **SvDbColumn** - Column metadata and properties with foreign key relationship detection
- **SvDbRow** - Row data management with Active Record pattern
- **SvDbTx** - Transaction management with automatic commit/rollback
- **SvDbDataType** - Centralized data type detection, validation, and compatibility logic

### Class Hierarchy

```
SvDatabase
├── tables: Array<SvDbTable>
│   ├── tableName: string
│   ├── columns: Array<SvDbColumn>
│   │   ├── columnName: string
│   │   ├── dataType: string (SQL type)
│   │   ├── allowNull: boolean
│   │   ├── primaryKey: boolean
│   │   ├── autoIncrement: boolean
│   │   ├── unique: boolean
│   │   ├── defaultValue: any
│   │   ├── isIndexed: boolean (true if column has database indexes)
│   │   └── foreignKey: object (with referencedTable, referencedColumn, onUpdate, onDelete, constraintName)
│   ├── weakRowMap: EnumerableWeakMap (cached row objects by primary key)
│   └── database: SvDatabase (parent reference)
├── databaseName: string
└── activeTxs: Set<SvDbTx> (active transactions)

SvDbTx
├── database: SvDatabase (parent reference)
├── txRef: Sequelize.Transaction (underlying transaction)
└── isActive: boolean
```

## Usage

### Basic Setup

```javascript
const SvDatabase = require("./SvDatabase");

// Get shared database instance and setup (handles initialization automatically)
const database = await SvDatabase.shared().setup();

// Get structured JSON representation
const schema = database.asJsonSchema();
```

### Transaction-Based Operations with Zone.js Context

All database operations require an active transaction. The ORM uses Zone.js to automatically track transaction context, eliminating the need to pass transaction parameters:

```javascript
// Create and use a transaction with automatic context tracking
const tx = database.newTx();
await tx.begin(async () => {
  // Get table references
  const customersTable = database.tableWithName("customers");
  const ordersTable = database.tableWithName("orders");
  
  // Query using table objects (tx automatically obtained from Zone context)
  const customers = await customersTable.selectRows({ limit: 10 });
  
  // Create and insert new records using row objects
  const orderRow = ordersTable.newRow();
  orderRow.setRowKeyValue("customerId", customers[0].id);
  orderRow.setRowKeyValue("orderNumber", "ORD-12345");
  orderRow.setRowKeyValue("totalAmount", 99.99);
  orderRow.setRowKeyValue("status", "pending");
  
  await orderRow.save(); // No tx parameter needed - automatically uses Zone context!
  // Transaction automatically commits on success
});

// Transaction automatically rolls back on error
try {
  const tx2 = database.newTx();
  await tx2.begin(async () => {
    const invalidTable = database.tableWithName("invalid_table");
    if (!invalidTable) throw new Error("Table not found");
    // Will fail and rollback
  });
} catch (error) {
  console.log("Transaction rolled back:", error.message);
}
```

### Foreign Key Inspection

```javascript
// Check foreign key relationships
const table = database.tableWithName("orderItems");
const orderIdColumn = table.columnWithName("orderId");

if (orderIdColumn.isForeignKey()) {
  console.log("References:", orderIdColumn.referencedTableName()); // "orders"
  console.log("Column:", orderIdColumn.referencedColumnName());    // "id"
  console.log("Relationship:", orderIdColumn.getRelationshipType()); // "one-to-many"
  console.log("Constraint:", orderIdColumn.constraintName());     // PostgreSQL only
  
  const actions = orderIdColumn.foreignKeyActions();
  console.log("On Update:", actions.onUpdate); // "CASCADE"
  console.log("On Delete:", actions.onDelete); // "CASCADE"
}
```

### Complete CRUD Operations with Zone.js Context

```javascript
// Create a transaction for all operations (Zone.js handles context automatically)
const tx = database.newTx();
await tx.begin(async () => {
  const customersTable = database.tableWithName("customers");
  
  // CREATE - Insert a new customer using row objects
  const newCustomer = customersTable.newRow();
  newCustomer.setRowKeyValue("id", "123e4567-e89b-12d3-a456-426614174000");
  newCustomer.setRowKeyValue("email", "john@example.com");
  newCustomer.setRowKeyValue("firstName", "John");
  newCustomer.setRowKeyValue("lastName", "Doe");
  newCustomer.setRowKeyValue("createdAt", new Date());
  newCustomer.setRowKeyValue("updatedAt", new Date());
  
  await newCustomer.save(); // Zone.js automatically provides transaction context
  console.log("Inserted customer:", newCustomer.asDict());
  
  // READ - Query customers with filtering
  const customers = await customersTable.selectRows({ 
    where: { status: "active" },
    limit: 5,
    sort: "createdAt",
    order: "DESC"
  }); // No tx parameter needed
  console.log(`Found ${customers.length} active customers`);
  
  // READ SINGLE - Get customer by ID (recommended for single record lookups)
  const customerId = "123e4567-e89b-12d3-a456-426614174000";
  const specificCustomer = await customersTable.getRowForId(customerId); // No tx parameter
  console.log("Found customer:", specificCustomer ? specificCustomer.asDict().email : "not found");
  
  // UPDATE - Modify existing customer
  const customerToUpdate = customers[0];
  customerToUpdate.setRowKeyValue("lastName", "Smith");
  customerToUpdate.setRowKeyValue("updatedAt", new Date());
  
  await customerToUpdate.save(); // Zone.js context automatically used
  console.log("Updated customer:", customerToUpdate.asDict());
  
  // DELETE - Remove customer (if no foreign key constraints)
  const customerToDelete = customers[customers.length - 1];
  const deleted = await customerToDelete.delete(); // No tx parameter needed
  console.log("Customer deleted:", deleted);
});
```

### Working with Related Data via Foreign Keys

```javascript
const tx = database.newTx();
await tx.begin(async () => {
  const ordersTable = database.tableWithName("orders");
  const orderItemsTable = database.tableWithName("orderItems");
  
  // Get an order (prefer getRowForId when you have the ID)
  const orders = await ordersTable.selectRows({ limit: 1 }); // No tx parameter needed
  const order = orders[0];
  
  // Create related order item record
  const orderItem = orderItemsTable.newRow();
  orderItem.setRowKeyValue("id", "987fcdeb-51a2-43d1-b456-426614174111");
  orderItem.setRowKeyValue("orderId", order.asDict().id); // Foreign key reference
  orderItem.setRowKeyValue("productId", "prod-456");
  orderItem.setRowKeyValue("quantity", 3);
  orderItem.setRowKeyValue("unitPrice", 29.99);
  orderItem.setRowKeyValue("createdAt", new Date());
  orderItem.setRowKeyValue("updatedAt", new Date());
  
  await orderItem.save(); // Zone.js automatically provides transaction context
  
  // Query related records
  const orderItems = await orderItemsTable.selectRows({
    where: { orderId: order.asDict().id },
    sort: "createdAt",
    order: "DESC"
  }); // No tx parameter needed
  
  console.log(`Order ${order.asDict().orderNumber} has ${orderItems.length} items`);
});
```

### Multiple Concurrent Transactions

The ORM supports multiple concurrent transactions for improved performance and flexibility:

```javascript
// Create multiple transactions
const tx1 = database.newTx();
const tx2 = database.newTx();
const tx3 = database.newTx();

// Run transactions concurrently
const results = await Promise.all([
  // Transaction 1: Insert customer data
  tx1.begin(async () => {
    const newCustomer = customersTable.newRow();
    newCustomer.setRowKeyValue("email", "customer1@example.com");
    await newCustomer.save(); // Zone.js automatically provides tx1 context
    return "Customer created";
  }),
  
  // Transaction 2: Update API usage
  tx2.begin(async () => {
    const items = await orderItemsTable.selectRows({ limit: 1 }); // tx2 context automatic
    if (usage.length > 0) {
      items[0].setRowKeyValue("quantity", 5);
      await usage[0].save(); // Zone.js automatically provides tx2 context
    }
    return "Usage updated";
  }),
  
  // Transaction 3: Query statistics
  tx3.begin(async () => {
    const customers = await customersTable.selectRows({ limit: 10 }); // tx3 context automatic
    return `Found ${customers.length} customers`;
  })
]);

console.log("All transactions completed:", results);
```

**Key Features:**
- **Concurrent Execution**: Multiple transactions can run simultaneously
- **Isolation**: Each transaction operates independently with its own Sequelize transaction
- **Automatic Cleanup**: Transactions are automatically removed from tracking on commit/rollback
- **Error Handling**: Failed transactions don't affect other concurrent transactions
- **Resource Management**: Active transaction tracking prevents memory leaks

**Transaction Validation:**
- All database operations use Zone.js context to automatically get the current transaction
- Transactions must be active and registered with the database
- Clear error messages for invalid transaction states
- Operations outside transaction scope will throw meaningful errors

### JSON Schema Format

The ORM outputs a collection-based JSON schema format with complete foreign key metadata:

```json
{
  "database": "database_name",
  "tables": [
    {
      "name": "orderItems",
      "columns": [
        {
          "name": "id",
          "dataType": "UUID",
          "allowNull": false,
          "primaryKey": true,
          "autoIncrement": false,
          "unique": true,
          "defaultValue": null
        },
        {
          "name": "orderId",
          "dataType": "UUID",
          "allowNull": false,
          "primaryKey": false,
          "autoIncrement": false,
          "unique": false,
          "foreignKey": {
            "referencedTable": "orders",
            "referencedColumn": "id",
            "onUpdate": "CASCADE",
            "onDelete": "CASCADE",
            "constraintName": "orderItems_customerId_fkey"
          }
        }
      ]
    }
  ]
}
```

## Implementation Details

### STRVCT Framework Integration

All classes follow STRVCT patterns:
- Use `initPrototypeSlots()` for property definitions
- Use `initPrototype()` for class configuration
- Include `.initThisClass()` for proper framework integration
- Use automatic getter/setter methods (e.g., `setColumnName()`, `columnName()`)

### Database Integration

- **Database Connection**: Uses Sequelize connection for database access
- **Schema Reading**: Leverages Sequelize's `QueryInterface` for table introspection
- **Foreign Key Detection**: Multi-database support using appropriate SQL dialect queries
- **Transaction Management**: Managed transactions with automatic commit/rollback
- **CRUD Operations**: Insert, update, delete, and query operations with transaction enforcement
- **Error Handling**: Gracefully handles problematic tables and continues processing
- **Database Support**: SQLite (development/testing) and PostgreSQL (production)

### Recursive Object Creation

The setup process follows a recursive pattern:

1. **SvDatabase.setup()** - Entry point, calls `readSchemaJson()` then `setupFromSchemaJson()`
2. **SvDatabase.setupFromSchemaJson()** - Creates SvDbTable instances for each table
3. **SvDbTable.setupFromSchemaJson()** - Creates SvDbColumn instances for each column
4. **SvDbColumn.setupFromSchemaJson()** - Sets individual column properties

## Testing

### Running Tests

```bash
cd /path/to/orm
node tests/test.js
```

### Test Coverage

The test suite validates:
- Database connection establishment
- Schema reading from all tables with foreign key detection
- Object hierarchy creation with complete metadata
- JSON schema generation with foreign key information
- Transaction interface with commit/rollback functionality
- CRUD operations within transaction scope
- Foreign key relationship analysis and constraint detection
- Error handling for problematic tables and failed operations

## File Structure

```
orm/
├── CLAUDE.md           # This documentation
├── SvDatabase.js       # Main database class with transaction management and CRUD operations
├── SvDbTable.js        # Table representation with column collection management
├── SvDbColumn.js       # Column metadata with foreign key relationship detection
├── SvDbRow.js          # Row data management with Active Record pattern
├── SvDbTx.js          # Transaction management with automatic commit/rollback
├── SvDbDataType.js     # Centralized data type detection, validation, and compatibility logic
├── SvDbSchema.js       # Database schema introspection utilities
├── external-libs/
│   └── zonejs/
│       ├── ZoneJS_init.js  # Zone.js Node.js compatibility module
│       └── zone.js.js      # Zone.js library
└── tests/
    ├── test.js               # Comprehensive test suite
    ├── test-validation.js    # Enhanced validation testing
    ├── test-datatype-coverage.js  # Data type detection coverage testing
    ├── test-datatype-class.js     # SvDbDataType class testing
    ├── test-tx-listeners.js       # Transaction listener system testing
    └── schema.json         # Generated database schema with foreign key metadata
```

## Key Features

### Database Introspection
- Reads complete table schemas via Sequelize across multiple database dialects
- Extracts column metadata (types, constraints, defaults, foreign keys)
- Handles indexes and foreign key relationships with full constraint information
- Multi-database support (SQLite for development, PostgreSQL for production)
- Foreign key constraint name detection (PostgreSQL only)

### Transaction Management
- **Zone.js Context Integration**: Automatic transaction context tracking eliminates the need to pass transaction parameters
- Mandatory transaction enforcement for all database operations
- Automatic commit on successful completion
- Automatic rollback on errors or exceptions
- Prevents orphaned operations and ensures data consistency
- Multiple concurrent transactions supported for improved performance
- Transaction isolation and independent execution per operation
- **Observer Pattern Listeners**: Object-oriented listener system for transaction lifecycle events

#### Transaction Listener System
The ORM uses an observer pattern with listeners that receive `onTxCommit` and `onTxRollback` messages:

**Basic Listener Object**: Responds to transaction lifecycle events
```javascript
const cacheManager = {
  onTxCommit: (tx) => {
    cache.invalidate("user_data");
    console.log("Cache cleared after commit");
  },
  
  onTxRollback: (tx) => {
    temporaryFile.delete();
    console.log("Cleanup performed after rollback");
  }
};

const tx = database.newTx();
tx.addListener(cacheManager);

await tx.begin(async () => {
  // Database operations with Zone.js context...
  await userRow.save(); // No tx parameter needed
});
// Listener automatically receives onTxCommit message after successful commit
```

**Partial Listeners**: Objects can implement only the messages they need
```javascript
// Commit-only listener
const commitListener = {
  onTxCommit: (tx) => console.log("Transaction committed successfully")
  // No onTxRollback method needed
};

// Rollback-only listener  
const rollbackListener = {
  onTxRollback: (tx) => console.log("Transaction rolled back")
  // No onTxCommit method needed
};

tx.addListener(commitListener);
tx.addListener(rollbackListener);
```

**Multiple Listeners**: Support for multiple listener objects
```javascript
tx.addListener(cacheManager);
tx.addListener(auditLogger);
tx.addListener(metricsCollector);
// All listeners receive appropriate messages when transaction completes
```

**Listener Management**: Add and remove listeners dynamically
```javascript
tx.addListener(myListener);
tx.removeListener(myListener); // Remove specific listener
tx.clearListeners(); // Remove all listeners
```

**Modern Listener System**: Clean object-oriented design with no deprecated methods
```javascript
// SvDbRow automatically implements listener interface
const customerRow = customersTable.newRow();
customerRow.setRowKeyValue("firstName", "John");
// Row automatically becomes a listener when modified within transaction
```

### CRUD Operations
- `query()` - SELECT operations with filtering, pagination, and sorting
- `insert()` - INSERT operations with automatic primary key handling
- `update()` - UPDATE operations with primary key-based record location
- `delete()` - DELETE operations with affected row count verification
- All operations require active transactions for data integrity

### Performance Optimization with changedDict()
The ORM includes an intelligent `changedDict()` method for optimizing INSERT and UPDATE operations:

**How it works:**
- **For new rows**: `changedDict()` returns all fields (identical to `asDict()`)
- **For existing rows**: `changedDict()` returns only modified fields plus the primary key
- **Change tracking**: Compares current `dict()` against `oldDict()` to identify modifications

**Performance benefits:**
- **Optimized UPDATE statements**: Only updates fields that actually changed
- **Reduced SQL complexity**: Simpler prepared statements with fewer parameters
- **Lower network overhead**: Fewer values transmitted to database
- **Faster execution**: Less work for database to perform
- **Better concurrency**: Reduced lock time on database rows

**Example optimization:**
```javascript
// Current approach generates:
// UPDATE customers SET email = ?, firstName = ?, lastName = ?, phoneNumber = ?, createdAt = ?, updatedAt = ? WHERE id = ?

// changedDict() optimization would generate:
// UPDATE customers SET lastName = ?, updatedAt = ? WHERE id = ?
// (50-80% reduction in fields updated for typical modifications)
```

**Future enhancement**: Table `insertRow()` and `updateRow()` methods could use `row.changedDict()` instead of `row.asDict()` for automatic optimization without breaking existing functionality.

### Cache-First Lookup
- **getRowForId()** - Optimized method for single record retrieval by primary key
- Checks cache first before querying database for maximum performance
- Recommended for all single record lookups (customer profiles, order lookups, etc.)
- Transparent caching with automatic cache population and management
- Significant performance improvement for frequently accessed records

### Foreign Key Analysis
- Automatic detection of foreign key relationships
- Relationship type inference (one-to-one vs one-to-many)
- Referential action inspection (CASCADE, RESTRICT, etc.)
- Cross-table relationship mapping and navigation
- Constraint name access (PostgreSQL only)

### Index Analysis and Query Performance
The ORM automatically detects database indexes and provides query performance guidance:

**Index Detection:**
- **`isIndexed` property**: Boolean flag on each column indicating presence of database indexes
- **Comprehensive coverage**: Detects primary key indexes, unique indexes, foreign key indexes, and custom indexes
- **Multi-database support**: Works with both SQLite (PRAGMA queries) and PostgreSQL (information_schema)

**Performance Helper Methods:**
```javascript
// Check if column is suitable for efficient queries
const isEfficient = column.isSuitableForLookup(); // true for indexed, primary key, or unique columns

// Get detailed performance characteristics
const perf = column.getQueryPerformance();
// Returns: { type: "primary-key", speed: "fastest", note: "Primary key lookup" }
//      or: { type: "index", speed: "fast", note: "Index scan" }
//      or: { type: "table-scan", speed: "slow", note: "Full table scan required" }
```

**Real-world benefits:**
- **Query optimization guidance**: Know which columns are efficient for WHERE clauses before writing queries
- **Performance debugging**: Identify potential slow queries during development
- **Schema documentation**: Complete metadata about database performance characteristics
- **Future query builders**: Foundation for automatic query optimization based on available indexes

**Example usage:**
```javascript
const customersTable = database.tableWithName("customers");
const emailColumn = customersTable.columnWithName("email");

if (emailColumn.isIndexed()) {
    console.log("Email lookups will be fast"); // true - email has unique index
}

const phoneColumn = customersTable.columnWithName("phoneNumber");
console.log(passwordColumn.getQueryPerformance());
// { type: "table-scan", speed: "slow", note: "Full table scan required" }
```

### Object-Oriented Design
- Clean separation of concerns (database → table → column → row)
- Parent-child relationships maintained throughout object hierarchy
- STRVCT framework integration with proper `.clone()` instantiation
- Automatic getter/setter generation via `newSlot()`

### Row Object Caching
- **Object Identity Consistency**: Multiple queries for the same database record return the identical JavaScript object instance
- **Memory-Efficient Caching**: Uses `EnumerableWeakMap` for automatic garbage collection of unused row objects
- **Cache-First Query Strategy**: `selectRows()` automatically checks cache before creating new row instances
- **Automatic Cache Management**: 
  - Rows added to cache when inserted (`insertRow()` → `onAssignedIdToRow()`)
  - Rows removed from cache when deleted (`deleteRow()`)
  - Cached objects updated in-place when refreshed from database
- **Primary Key-Based Indexing**: Fast O(1) lookup by primary key value via `getCachedRowForId(id)`
- **Prevents Data Inconsistency**: Eliminates multiple object instances representing the same database row
- **Seamless Integration**: Works transparently with all ORM operations without requiring special handling

**Benefits:**
- **Data Consistency**: Changes to a row object are immediately visible to all code holding references
- **Memory Optimization**: Reduces memory usage by preventing duplicate row objects
- **Performance**: Faster subsequent queries for the same records (no object creation overhead)
- **Simplified State Management**: No need to manually synchronize multiple instances of the same data
- **Garbage Collection Friendly**: Weak references allow automatic cleanup when objects are no longer referenced

**Cache Lifecycle:**
```javascript
// Must be within a transaction context
const tx = database.newTx();
await tx.begin(async () => {
  // 1. Create new row (not cached yet - no ID)
  const newCustomer = customersTable.newRow();
  newCustomer.setRowKeyValue("email", "customer@example.com");

  // 2. Insert row (automatically added to cache with ID)
  await newCustomer.insert(); // Zone.js provides tx context → onAssignedIdToRow() → weakRowMap.set(id, row)

  // 3. Query returns same cached object
  const queriedCustomers = await customersTable.selectRows({ where: { email: "customer@example.com" } });
  // queriedCustomers[0] === newCustomer (same object instance)

  // 4. Direct cache access
  const cachedCustomer = customersTable.getCachedRowForId(customerId); // Same object instance

  // 5. Delete removes from cache
  await newCustomer.delete(); // Zone.js provides tx context → weakRowMap.delete(id)
});
```

### JSON Schema Export
- Collection-based format with complete metadata preservation
- Foreign key information included in column definitions
- Human-readable structure ready for API consumption
- Supports both development (SQLite) and production (PostgreSQL) schemas

### Error Resilience
- Continues processing when individual tables fail during introspection
- Detailed error logging and warnings for diagnostic purposes
- Graceful degradation for unsupported database features
- Transaction rollback protection against partial data corruption

## Future Enhancements

### Planned Features
- **SvDbRow** implementation for Active Record pattern data manipulation
- **Query builder** integration with fluent interface for complex queries
- **Connection pooling** and multi-database connection management
- **Schema caching** for improved performance on repeated introspection
- **Batch operations** for efficient bulk insert/update/delete
- **Migration integration** for automated schema versioning

### Potential Extensions
- **Model generation** from database schema with automatic class creation
- **Data validation** based on column constraints and foreign key relationships
- **Lazy loading** for related data via foreign key relationships
- **Performance optimization** for large schemas with selective table loading
- **Real-time schema change detection** and automatic model regeneration
- **Advanced relationship mapping** including many-to-many through junction tables

## Dependencies

- **STRVCT Framework** - Base class system and patterns
- **Sequelize** - Database connection and introspection
- **Zone.js** - Async context tracking for transaction management

## Related Documentation

- **STRVCT Framework Documentation** - Base framework patterns and usage
- **Sequelize Documentation** - Database abstraction layer
- **Zone.js Documentation** - Async context tracking


## Coding Guidelines

### STRVCT Framework Compliance
- Always use `ClassName.clone()` instead of `new ClassName()` when creating instances of classes inheriting from Base
- Don't access instance variables directly, use their auto-generated getters and setters (via `newSlot()`)
- Use `initThisClass()` to complete the setup of classes
- Use `Base` as the base class, not `Object`
- Follow the `_ivarName`, `ivarName()`, `setIvarName()` naming pattern

### ORM Method Naming
- Use `row.setRowKeyValue(key, value)` to set field values on database rows
- This method provides validation and change tracking for database operations
- Method name distinguishes ORM row operations from generic key-value operations

### Database Compatibility
- Support both SQLite (for development/testing) and PostgreSQL (for production)
- Handle database dialect differences gracefully in foreign key detection and CRUD operations
- Use appropriate SQL syntax for each database type (PRAGMA vs information_schema)
- Test against both database types when possible

### Transaction Safety
- All database operations use Zone.js context to automatically obtain the current transaction
- Never allow direct database access without transaction enforcement
- Provide clear error messages when operations are attempted outside transaction context
- Ensure proper cleanup of transaction references on commit/rollback
- Support multiple concurrent transactions with proper isolation
- Zone.js provides transaction context isolation between concurrent operations

### Schema Independence
- The ORM code should be general and not specific to any particular schema
- Avoid hardcoding table names, column names, or relationships
- Support dynamic schema discovery and adaptation
- Handle missing tables, columns, or constraints gracefully

### Error Handling
- Continue processing when individual components fail during introspection
- Provide detailed logging for diagnostic purposes
- Fail gracefully with meaningful error messages
- Protect against partial state corruption through transaction rollbacks

### Data Type Management
The ORM includes a dedicated `SvDbDataType` utility class that centralizes all data type logic:

#### Core Functionality
- **JavaScript Type Detection**: `SvDbDataType.dataTypeForValue(value)` provides detailed type classification
- **Database Compatibility**: Maps JavaScript types to compatible database column types
- **Value Validation**: Comprehensive validation including format-specific checks (UUID, dates)
- **Type Coercion Support**: Handles automatic type conversions (numbers to strings, booleans to integers)

#### Static Methods
```javascript
// Detect JavaScript type with detailed classification
const jsType = SvDbDataType.dataTypeForValue(42); // "Integer"
const jsType = SvDbDataType.dataTypeForValue(3.14); // "Float" 
const jsType = SvDbDataType.dataTypeForValue(NaN); // "NaN"

// Check type compatibility
const compatible = SvDbDataType.isValueCompatibleWithDbType("hello", "STRING"); // true
const compatible = SvDbDataType.isJsTypeCompatibleWithDbType("Integer", "FLOAT"); // true

// Get compatible types for database column
const types = SvDbDataType.getCompatibleJsTypesForDbType("STRING"); // ["String", "Integer", "Float"]

// Comprehensive validation
const validation = SvDbDataType.validateValueForDbType(
    "123e4567-e89b-12d3-a456-426614174000", 
    "UUID", 
    false, 
    "orderId"
);
// Returns: { valid: true } or { valid: false, error: "..." }

// Format-specific validation
const uuidCheck = SvDbDataType.validateUuidFormat("not-a-uuid"); // { valid: false, error: "..." }
const dateCheck = SvDbDataType.validateDateFormat("2023-12-25"); // { valid: true }
```

#### Integration with ORM Classes
- **SvDbColumn**: Uses `SvDbDataType.validateValueForDbType()` for all validation
- **SvDbRow**: Delegates type detection to `SvDbDataType.dataTypeForValue()`
- **Centralized Logic**: All type-related functionality consolidated in one place for maintainability

#### Benefits
- **Consistency**: Single source of truth for all data type logic
- **Extensibility**: Easy to add new database types or validation rules
- **Testing**: Comprehensive test coverage for all type scenarios
- **Performance**: Optimized static methods avoid object instantiation overhead
