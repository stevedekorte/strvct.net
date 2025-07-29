# Custom Table and Row Classes

The STRVCT ORM automatically generates custom table and row classes for each database table, providing domain-specific convenience methods and extensibility points for application-specific logic.

## Overview

For each database table, the ORM creates two custom classes:

1. **Custom Table Class**: Extends the base table functionality with domain-specific query methods
2. **Custom Row Class**: Extends the base row functionality with domain-specific data methods

## Naming Conventions

The ORM follows a consistent naming pattern based on table names:

| Table Name | Custom Table Class | Custom Row Class | Generated Method |
|------------|-------------------|------------------|------------------|
| `users` | `PmUsers` | `PmUser` | `userWithId()` |
| `transactions` | `PmTransactions` | `PmTransaction` | `transactionWithId()` |
| `api_keys` | `PmApiKeys` | `PmApiKey` | `apiKeyWithId()` |
| `categories` | `PmCategories` | `PmCategory` | `categoryWithId()` |

### Pattern Rules

- **Table Name**: Must end with 's' (plural form)
- **Custom Table Class**: `{prefix}{TableName}` (e.g., `PmUsers`)
- **Custom Row Class**: `{prefix}{SingularTableName}` (e.g., `PmUser`)
- **Generated Method**: `{singularName}WithId()` (e.g., `userWithId()`)
- **Default Prefix**: `Pm` (configurable via `database.customClassPrefix()`)

## Automatic Generation

### Table Class Generation

When a table is processed, the ORM:

1. **Checks for existing custom class**: Looks for a user-defined class in `globalThis`
2. **Auto-generates if missing**: Creates a new class extending `SvDbCustomTable`
3. **Sets up prototype**: Calls `setupCustomPrototype()` to add convenience methods

```javascript
// Auto-generated for "users" table
class PmUsers extends SvDbCustomTable {
    // Automatically gets userWithId() method
    async userWithId(id) {
        return this.getRowForId(id);
    }
}
```

### Row Class Generation

Similarly for row classes:

1. **Checks for existing custom row class**: Looks for user-defined class
2. **Auto-generates if missing**: Creates a new class extending `SvDbCustomRow`
3. **Sets up relationship**: Associates the custom row class with the table

```javascript
// Auto-generated for "users" table
class PmUser extends SvDbCustomRow {
    // Domain-specific methods can be added here
}
```

## Usage Patterns

### Basic Usage

```javascript
const database = await SvDatabase.shared().setup();

// Get the custom table class instance
const usersTable = database.tableWithName("users");

// Use the generated convenience method
const user = await usersTable.userWithId("123");
console.log(user); // PmUser instance

// Traditional method still works
const sameUser = await usersTable.getRowForId("123");
```

### Multiple Tables

```javascript
const tx = database.newTx();
await tx.begin(async () => {
    // Each table gets its own custom methods
    const user = await database.tableWithName("users").userWithId("user-123");
    const transaction = await database.tableWithName("transactions").transactionWithId("tx-456");
    const apiKey = await database.tableWithName("api_keys").apiKeyWithId("key-789");
});
```

## Extensibility

### Custom Table Classes

You can provide your own custom table class before the ORM initializes:

```javascript
class PmUsers extends SvDbCustomTable {
    async userWithId(id) {
        // Override the default implementation
        const user = await super.getRowForId(id);
        if (!user) {
            throw new Error(`User ${id} not found`);
        }
        return user;
    }
    
    async activeUsers() {
        return this.selectRows({ 
            where: { account_status: 'active' } 
        });
    }
    
    async findByEmail(email) {
        const rows = await this.selectRows({ 
            where: { email: email } 
        });
        return rows[0] || null;
    }
}

// Register before database setup
globalThis.PmUsers = PmUsers;

// Now the ORM will use your custom class
const database = await SvDatabase.shared().setup();
```

### Custom Row Classes

Similarly for row classes:

```javascript
class PmUser extends SvDbCustomRow {
    fullName() {
        return `${this.getRowKey('first_name')} ${this.getRowKey('last_name')}`;
    }
    
    isActive() {
        return this.getRowKey('account_status') === 'active';
    }
    
    async deactivate() {
        this.setRowKeyValue('account_status', 'inactive');
        this.setRowKeyValue('updated_at', new Date());
        await this.save();
    }
}

globalThis.PmUser = PmUser;
```

## Implementation Details

### Setup Process

The custom class setup happens during database initialization:

```javascript
// In SvDatabase.setup()
this.setupCustomTableAndRowClasses();

// Which calls for each table:
table.setupCustomClass();
    table.setupCustomTableClass();  // Creates/finds table class
    table.setupCustomRowClass();    // Creates/finds row class
```

### Dynamic Method Creation

The `setupCustomPrototype()` method uses STRVCT's `addMethod()` to dynamically create methods:

```javascript
setupCustomPrototype() {
    const name = this.tableName().sansSuffix("s").uncapitalized();
    this.thisPrototype().addMethod(name + "WithId", async function(id) {
        return this.getRowForId(id);
    });
}
```

### Validation

The system validates that:

1. **Table names end in 's'**: Ensures predictable method generation
2. **Method names are valid JavaScript identifiers**: Prevents syntax errors
3. **No conflicts with existing methods**: Avoids overriding ORM functionality

## Error Handling

### Invalid Table Names

```javascript
// Table: "user" (doesn't end in 's')
// Error: Invalid table name 'user'. All table names must end with 's' 
//        to ensure consistent method generation in the ORM.
```

### Method Name Conflicts

If a generated method name would conflict with existing ORM methods, an error is thrown with guidance on renaming the table.

### Missing Classes

If custom classes can't be created (e.g., due to invalid identifiers), the system falls back to base classes with clear error messages.

## System Tables

The following tables are automatically excluded from custom class generation:

- `SequelizeMeta` (Sequelize migration tracking)
- `sqlite_sequence` (SQLite internal)
- `sqlite_master` (SQLite system)

These tables don't appear in the ORM schema and don't generate custom classes.

## Benefits

### Developer Experience

- **Intuitive Method Names**: `userWithId()` is more readable than `getRowForId()`
- **Type Safety**: Custom row classes provide domain-specific types
- **IDE Support**: Auto-completion works with generated methods
- **Consistency**: Uniform naming across all tables

### Extensibility

- **Progressive Enhancement**: Start with auto-generated, enhance with custom logic
- **Convention Over Configuration**: Zero boilerplate for common patterns
- **Override Capability**: Full control when needed

### Performance

- **Cache-First**: Generated methods use optimized lookup strategies
- **Lazy Loading**: Classes created only when tables are accessed
- **Minimal Overhead**: Dynamic method creation happens once during setup

## Best Practices

### Table Naming

```javascript
// ✅ Good - plural, ends in 's'
users, transactions, api_keys, categories

// ❌ Bad - singular or doesn't end in 's'
user, transaction, api_key, category
```

### Custom Class Design

```javascript
// ✅ Good - domain-specific, meaningful
class PmUser extends SvDbCustomRow {
    isAdmin() { /* ... */ }
    sendWelcomeEmail() { /* ... */ }
}

// ❌ Bad - generic, not domain-specific
class PmUser extends SvDbCustomRow {
    getData() { /* ... */ }
    process() { /* ... */ }
}
```

### Method Naming

When adding custom methods, follow the established patterns:
- Query methods: `findByEmail()`, `activeUsers()`
- Action methods: `deactivate()`, `sendNotification()`
- Computed properties: `fullName()`, `isActive()`

## Troubleshooting

### Common Issues

1. **"Invalid table name" error**: Ensure table names end with 's'
2. **"Method name collision" error**: Rename table to avoid conflicts
3. **Custom class not used**: Ensure class is in `globalThis` before database setup
4. **Method not found**: Check that table name generates valid JavaScript identifier

### Debug Logging

The ORM logs custom class creation:

```
created custom table class: PmUsers
created custom row class: PmUser
found custom table class: PmTransactions  // User-provided
```

Use these logs to verify that custom classes are being created or found as expected.