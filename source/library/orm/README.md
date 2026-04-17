# STRVCT ORM

A comprehensive Object-Relational Mapping system built on the STRVCT framework for Node.js applications requiring robust data integrity, high performance, and concurrent access patterns.

## Features

- **Zone.js Integration**: Automatic transaction context tracking eliminates the need to pass transaction parameters
- **Concurrent Transactions**: Multiple transactions can run simultaneously with full isolation
- **Intelligent Caching**: Object identity consistency with memory-efficient weak reference caching
- **Advanced Data Integrity**: Record-level transaction locking and automatic state restoration on rollbacks
- **Performance Optimized**: Only writes modified fields, reducing database load by 50-80%
- **Custom Class Generation**: Automatic domain-specific convenience methods for each table with extensibility for custom implementations
- **Multiple Database Support**: SQLite for development, PostgreSQL for production
- **Schema Introspection**: Complete database metadata reading with foreign key relationship detection
- **Active Record Pattern**: Clean, intuitive API with automatic insert/update detection

## Quick Start

### 1. Setup Database Connection

```javascript
const SvDatabase = require("./SvDatabase");

// Initialize the ORM with automatic schema reading
const database = await SvDatabase.shared().setup();
```

### 2. Basic Operations with Zone.js Context

```javascript
const tx = database.newTx();
await tx.begin(async () => {
  const usersTable = database.tableWithName("users");
  
  // Create new user
  const user = usersTable.newRow();
  user.setRowKeyValue("email", "user@example.com");
  user.setRowKeyValue("name", "John Doe");
  await user.save(); // Zone.js automatically provides transaction context
  
  // Query users
  const activeUsers = await usersTable.selectRows({ 
    where: { status: "active" },
    limit: 10 
  }); // No transaction parameter needed
  
  // Get user by ID (cache-first lookup)
  const specificUser = await usersTable.getRowForId(userId);
});
```

### 3. Domain-Specific Convenience Methods

The ORM automatically generates custom classes with convenience methods:

```javascript
const tx = database.newTx();
await tx.begin(async () => {
  // Generated convenience methods for each table
  const user = await database.tableWithName("users").userWithId("123");
  const transaction = await database.tableWithName("transactions").transactionWithId("tx-456");
  const apiKey = await database.tableWithName("api_keys").apiKeyWithId("key-789");
});
```

## Key Concepts

### Zone.js Transaction Context

All database operations automatically use Zone.js to track transaction context:

- **No Transaction Parameters**: Methods like `save()`, `selectRows()`, `getRowForId()` work without explicit `tx` parameters
- **Automatic Context**: Zone.js provides the current transaction to all operations within `tx.begin()`
- **Isolation**: Each transaction maintains its own Zone context for concurrent operations

### Intelligent Caching

- **Object Identity**: Multiple queries for the same record return identical JavaScript objects
- **Cache-First Lookup**: `getRowForId()` checks cache before database queries
- **Automatic Management**: Cache is updated on insert/update/delete operations
- **Memory Efficient**: Uses weak references for automatic garbage collection

### Record-Level Transaction Locking

- **Conflict Prevention**: Only one transaction can modify a record at a time
- **Automatic Rollback**: Changes are reverted if transactions fail
- **State Tracking**: `editingTx` slot tracks which transaction is modifying each row

### Custom Class Generation

The ORM provides a flexible class generation system that supports both automatic generation and developer customization:

#### **Automatic Generation (Fallback)**
For each database table, the ORM automatically creates:
- **Custom Table Classes**: Domain-specific query methods (e.g., `PmUsers` with `userWithId()`)
- **Custom Row Classes**: Domain-specific data methods (e.g., `PmUser` instances)
- **Zero Configuration**: Works out-of-the-box with sensible defaults

#### **Developer Extensibility (Preferred)**
Developers can provide their own custom implementations:

```javascript
// Define custom table class before ORM initialization
class PmUsers extends SvDbCustomTable {
    async userWithId(id) {
        const user = await super.getRowForId(id);
        if (!user) throw new Error(`User ${id} not found`);
        return user;
    }
    
    async activeUsers() {
        return this.selectRows({ where: { status: 'active' } });
    }
}

// Define custom row class with domain logic
class PmUser extends SvDbCustomRow {
    fullName() {
        return `${this.getRowKey('first_name')} ${this.getRowKey('last_name')}`;
    }
    
    async deactivate() {
        this.setRowKeyValue('status', 'inactive');
        await this.save();
    }
}

// Register classes before database setup
globalThis.PmUsers = PmUsers;
globalThis.PmUser = PmUser;

// ORM will use your custom classes instead of auto-generating
const database = await SvDatabase.shared().setup();
```

#### **Progressive Enhancement**
- **Start Simple**: Use auto-generated classes for rapid development
- **Enhance Gradually**: Add custom implementations as domain logic emerges
- **No Breaking Changes**: Custom classes extend the same base functionality

See [Custom Classes Documentation](docs/CustomClasses.md) for detailed information.

## Architecture

### Core Classes

- **SvDatabase**: Top-level database representation with transaction management
- **SvDbTable**: Table representation with CRUD operations and caching
- **SvDbColumn**: Column metadata with validation and foreign key detection
- **SvDbRow**: Active Record pattern with automatic transaction integration
- **SvDbTx**: Transaction management with Zone.js context and listener system
- **SvDbSchema**: Database introspection and schema validation

### Transaction System

The ORM uses an observer pattern with automatic context tracking:

```javascript
// SvDbRow automatically implements transaction listeners
class SvDbRow extends SvBase {
    onTxCommit(tx) {
        // Update state to reflect committed changes
        this.copyOldDictFromDict();
        this.setEditingTx(null);
    }
    
    onTxRollback(tx) {
        // Revert to original state
        this.setDict(Object.assign({}, this.oldDict()));
        this.setEditingTx(null);
    }
}
```

### Schema Validation

The ORM enforces naming conventions to ensure reliable code generation:

- **Table Names**: Must end with 's' (plural form) for consistent method generation
- **System Tables**: Automatically excluded (e.g., `SequelizeMeta`, `sqlite_sequence`)
- **Valid Identifiers**: Generated method names must be valid JavaScript identifiers

## Database Support

### Development: SQLite
```javascript
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});
```

### Production: PostgreSQL
```javascript
const sequelize = new Sequelize(database, username, password, {
  host: 'localhost',
  dialect: 'postgres'
});
```

## Advanced Features

### Concurrent Transactions

```javascript
const results = await Promise.all([
  // Transaction 1: User operations
  database.newTx().begin(async () => {
    const user = await usersTable.userWithId(userId);
    user.setRowKeyValue("updated_at", new Date());
    await user.save(); // Zone.js provides tx1 context
    return "user updated";
  }),
  
  // Transaction 2: Order processing operations  
  database.newTx().begin(async () => {
    const order = ordersTable.newRow();
    order.setRowKeyValue("customerId", customerId);
    order.setRowKeyValue("totalAmount", 99.99);
    await order.save(); // Zone.js provides tx2 context
    return "order created";
  })
]);
```

### Performance Optimization

The ORM includes several performance optimizations:

- **Changed Field Detection**: Only updates modified fields in database
- **Cache-First Queries**: `getRowForId()` checks memory before database
- **Weak Reference Caching**: Automatic garbage collection of unused objects
- **Batch Operations**: Multiple operations within single transactions

### Foreign Key Relationships

```javascript
// Automatic foreign key detection and validation
const apiUsageTable = database.tableWithName("api_usage");
const userIdColumn = apiUsageTable.columnWithName("user_id");

if (userIdColumn.isForeignKey()) {
  console.log("References:", userIdColumn.referencedTableName()); // "users"
  console.log("Column:", userIdColumn.referencedColumnName());    // "id"
  console.log("On Delete:", userIdColumn.foreignKeyActions().onDelete); // "CASCADE"
}
```

## Testing

Run the comprehensive test suite:

```bash
node tests/test.js
```

Tests cover:
- Schema introspection and validation
- Transaction management and rollback
- CRUD operations with caching
- Custom class generation
- Concurrent transaction handling
- Zone.js context tracking

## Required Naming Conventions

The STRVCT ORM enforces strict naming conventions to ensure reliable code generation and maintain consistency across the application. **These conventions are automatically validated during database initialization and will throw descriptive error messages if not followed.**

### 1. Table Names
- **Format**: Capitalized CamelCase with plural 's' suffix
- **Pattern**: `{CamelCaseName}s`
- **Examples**: 
  - ✅ `Users`, `Products`, `Orders`
  - ❌ `users`, `api_requests`, `User`, `ApiRequest`

### 2. Column Names  
- **Format**: Uncapitalized camelCase
- **Pattern**: `{lowerCamelCase}`
- **Examples**:
  - ✅ `email`, `firstName`, `createdAt`, `accountStatus`
  - ❌ `Email`, `first_name`, `created_at`, `order_status`

### 3. Foreign Key Columns
- **Format**: Uncapitalized camelCase table name + "Id"
- **Pattern**: `{lowerCamelCaseTableName}Id`
- **Examples**:
  - ✅ `userId` (references Users table), `orderId` (references Orders table)
  - ❌ `user_id`, `UserID`, `order_id`

### 4. Primary Key Columns
- **Format**: Simple lowercase "id"
- **Pattern**: `id`
- **Examples**:
  - ✅ `id`
  - ❌ `ID`, `userId`, `user_id`, `pk_id`

### Examples

```sql
-- ✅ Correct naming convention
CREATE TABLE Users (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP
);

CREATE TABLE ApiRequests (
    id UUID PRIMARY KEY,
    userId UUID REFERENCES Users(id),  -- Foreign key follows convention
    requestUrl VARCHAR(500),
    statusCode INTEGER,
    createdAt TIMESTAMP
);

-- ❌ Incorrect naming convention  
CREATE TABLE user (  -- Should be "Users"
    ID UUID PRIMARY KEY,  -- Should be "id"
    Email VARCHAR(255),  -- Should be "email"
    first_name VARCHAR(100),  -- Should be "firstName"
    user_id UUID REFERENCES user(ID)  -- Should be table "Users", column "id"
);
```

### Convention Benefits

- **Predictable Method Generation**: `Users` table automatically gets `userWithId()` method
- **Consistent Code Style**: All generated code follows the same patterns
- **Clear Relationships**: Foreign keys are immediately recognizable (e.g., `userId` clearly points to `Users` table)
- **IDE Support**: CamelCase naming enables better auto-completion
- **Cross-Platform Compatibility**: Avoids database-specific naming restrictions
- **Early Error Detection**: Validation happens at startup, not at runtime

### Validation Errors

The ORM provides detailed error messages when naming conventions are violated:

```javascript
// Table name validation error
Invalid table name 'User'. All table names must end with 's' to ensure consistent method generation in the ORM.
Please rename your table to 'Users' or choose another plural form ending in 's'.
Examples: 'users', 'transactions', 'api_keys', 'categories'

// Column name validation errors
Invalid column name 'first_name' in table 'Users'. Column names must use camelCase format, not snake_case.
Please rename 'first_name' to 'firstName'. Examples: 'firstName', 'createdAt', 'userId'

Invalid column name 'Email' in table 'Users'. Column names must start with lowercase letter (camelCase), not uppercase (PascalCase).
Please rename 'Email' to 'email'. Examples: 'firstName', 'createdAt', 'userId'

Invalid foreign key column name 'User_Id' in table 'ApiRequests'. Foreign key columns must follow the pattern '{camelCaseTableName}Id'.
The table reference part should be camelCase (lowercase first letter). Examples: 'userId', 'orderId', 'productId'
```

## Configuration

### Custom Class Prefix

```javascript
const database = SvDatabase.clone();
database.setCustomClassPrefix("App"); // Default: "Pm"
await database.setup();

// Now generates: AppUsers, AppUser, etc.
```

### Table Name Validation

The ORM automatically validates that all application table names follow the required conventions:

```javascript
// ✅ Valid table names (CamelCase + 's')
Users, Products, Orders, Categories

// ❌ Invalid table names (will throw validation errors)
users, api_requests, User, ApiRequest, category
```

## Documentation

- **[Custom Classes](docs/CustomClasses.md)**: Detailed guide to automatic class generation and customization
- **[CLAUDE.md](CLAUDE.md)**: Complete API reference and implementation details
- **[Transaction Notes](docs/SequelizeTransactionNotes.md)**: Low-level transaction implementation details

## Dependencies

- **Node.js** 14+
- **Sequelize** 6+ - Database abstraction layer
- **Zone.js** - Async context tracking for transaction management
- **STRVCT Framework** - Base class system and patterns

## Migration from Other ORMs

The STRVCT ORM is designed for applications that need:

- **Strict Data Consistency**: All operations require transactions
- **High Concurrency**: Multiple simultaneous transactions with proper isolation
- **Performance**: Intelligent caching and optimized database operations
- **Type Safety**: Custom classes provide domain-specific interfaces
- **Developer Experience**: Clean API with automatic context management

If you're coming from other ORMs, key differences include:
- **Mandatory Transactions**: All operations require active transaction context
- **Zone.js Integration**: No need to pass transaction parameters explicitly
- **Custom Class Generation**: Automatic domain-specific convenience methods
- **Record Locking**: Built-in prevention of concurrent modification conflicts

## Examples

See the `tests/` directory for comprehensive examples of:
- Basic CRUD operations
- Complex transaction scenarios
- Custom class usage
- Performance optimization patterns
- Error handling strategies

## License

This project is part of the STRVCT framework ecosystem.