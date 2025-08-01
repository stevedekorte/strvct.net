# STRVCT ORM Examples

This document provides practical examples of custom row classes using a simple two-table schema.

## Example Schema

### Tables

**users**
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)

**api_requests** 
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `url` (String)
- `cost` (Decimal)
- `created_at` (DateTime)

## Auto-Generated Classes (Default Behavior)

Without any custom code, the ORM automatically generates:

```javascript
// Auto-generated table classes
class PmUsers extends SvDbCustomTable {
    async userWithId(id) {
        return this.getRowForId(id);
    }
}

class PmApiRequests extends SvDbCustomTable {
    async apiRequestWithId(id) {
        return this.getRowForId(id);
    }
}

// Auto-generated row classes  
class PmUser extends SvDbCustomRow {
    // Basic STRVCT functionality only
}

class PmApiRequest extends SvDbCustomRow {
    // Basic STRVCT functionality only
}
```

## Custom Row Class Examples

### Enhanced User Class

```javascript
class PmUser extends SvDbCustomRow {
    
    // Computed properties
    displayName() {
        const name = this.getRowKey('name');
        const email = this.getRowKey('email');
        return name || email.split('@')[0];
    }
    
    domain() {
        const email = this.getRowKey('email');
        return email ? email.split('@')[1] : null;
    }
    
    // Validation methods
    isValidEmail() {
        const email = this.getRowKey('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Query methods for related data
    async getApiRequests() {
        const apiRequestsTable = this.table().database().tableWithName('api_requests');
        return await apiRequestsTable.selectRows({
            where: { user_id: this.getRowKey('id') },
            sort: 'created_at',
            order: 'DESC'
        });
    }
    
    async getTotalApiCost() {
        const requests = await this.getApiRequests();
        return requests.reduce((total, request) => {
            return total + parseFloat(request.getRowKey('cost') || 0);
        }, 0);
    }
    
    async getRecentApiRequests(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const apiRequestsTable = this.table().database().tableWithName('api_requests');
        const allRequests = await apiRequestsTable.selectRows({
            where: { user_id: this.getRowKey('id') }
        });
        
        return allRequests.filter(request => {
            const createdAt = new Date(request.getRowKey('created_at'));
            return createdAt >= cutoffDate;
        });
    }
    
    // Business logic methods
    async updateProfile(name, email) {
        if (!this.isValidEmail()) {
            throw new Error('Invalid email format');
        }
        
        this.setRowKeyValue('name', name);
        this.setRowKeyValue('email', email);
        await this.save();
    }
    
    async recordApiRequest(url, cost) {
        const apiRequestsTable = this.table().database().tableWithName('api_requests');
        const request = apiRequestsTable.newRow();
        
        request.setRowKeyValue('user_id', this.getRowKey('id'));
        request.setRowKeyValue('url', url);
        request.setRowKeyValue('cost', cost);
        request.setRowKeyValue('created_at', new Date());
        
        await request.save();
        return request;
    }
}
```

### Enhanced ApiRequest Class

```javascript
class PmApiRequest extends SvDbCustomRow {
    
    // Computed properties
    costInCents() {
        const cost = parseFloat(this.getRowKey('cost') || 0);
        return Math.round(cost * 100);
    }
    
    formattedCost() {
        const cost = parseFloat(this.getRowKey('cost') || 0);
        return `$${cost.toFixed(4)}`;
    }
    
    domain() {
        const url = this.getRowKey('url');
        try {
            return new URL(url).hostname;
        } catch (e) {
            return null;
        }
    }
    
    age() {
        const createdAt = new Date(this.getRowKey('created_at'));
        const now = new Date();
        const diffMs = now - createdAt;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'less than an hour ago';
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    }
    
    // Validation methods
    isExpensive() {
        const cost = parseFloat(this.getRowKey('cost') || 0);
        return cost > 0.10; // More than 10 cents
    }
    
    isValidUrl() {
        const url = this.getRowKey('url');
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Related data methods
    async getUser() {
        const usersTable = this.table().database().tableWithName('users');
        return await usersTable.getRowForId(this.getRowKey('user_id'));
    }
    
    async getUserEmail() {
        const user = await this.getUser();
        return user ? user.getRowKey('email') : null;
    }
    
    // Business logic methods
    async flagAsExpensive() {
        if (this.isExpensive()) {
            console.log(`Expensive API request: ${this.formattedCost()} for ${this.getRowKey('url')}`);
            // Could add a flag column or send notification
        }
    }
    
    async addNote(note) {
        // If you had a notes column, you could add to it
        const existingNote = this.getRowKey('note') || '';
        const timestamp = new Date().toISOString();
        const newNote = existingNote ? 
            `${existingNote}\n[${timestamp}] ${note}` : 
            `[${timestamp}] ${note}`;
        
        this.setRowKeyValue('note', newNote);
        await this.save();
    }
}
```

## Custom Table Class Examples

### Enhanced Users Table

```javascript
class PmUsers extends SvDbCustomTable {
    
    // Override the generated method with validation
    async userWithId(id) {
        const user = await this.getRowForId(id);
        if (!user) {
            throw new Error(`User with id ${id} not found`);
        }
        return user;
    }
    
    // Domain-specific query methods
    async findByEmail(email) {
        const users = await this.selectRows({
            where: { email: email }
        });
        return users[0] || null;
    }
    
    async getUsersByDomain(domain) {
        const allUsers = await this.selectRows();
        return allUsers.filter(user => user.domain() === domain);
    }
    
    async getHighSpendingUsers(minCost = 1.00) {
        const allUsers = await this.selectRows();
        const highSpenders = [];
        
        for (const user of allUsers) {
            const totalCost = await user.getTotalApiCost();
            if (totalCost >= minCost) {
                highSpenders.push({
                    user: user,
                    totalCost: totalCost
                });
            }
        }
        
        // Sort by cost descending
        return highSpenders.sort((a, b) => b.totalCost - a.totalCost);
    }
    
    // Bulk operations
    async createUser(name, email) {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error(`User with email ${email} already exists`);
        }
        
        const user = this.newRow();
        user.setRowKeyValue('id', crypto.randomUUID());
        user.setRowKeyValue('name', name);
        user.setRowKeyValue('email', email);
        
        if (!user.isValidEmail()) {
            throw new Error('Invalid email format');
        }
        
        await user.save();
        return user;
    }
}
```

### Enhanced ApiRequests Table

```javascript
class PmApiRequests extends SvDbCustomTable {
    
    // Override with validation
    async apiRequestWithId(id) {
        const request = await this.getRowForId(id);
        if (!request) {
            throw new Error(`API request with id ${id} not found`);
        }
        return request;
    }
    
    // Analytics methods
    async getTotalCost() {
        const allRequests = await this.selectRows();
        return allRequests.reduce((total, request) => {
            return total + parseFloat(request.getRowKey('cost') || 0);
        }, 0);
    }
    
    async getExpensiveRequests(minCost = 0.10) {
        const allRequests = await this.selectRows();
        return allRequests.filter(request => request.isExpensive());
    }
    
    async getRequestsByDomain(domain) {
        const allRequests = await this.selectRows();
        return allRequests.filter(request => request.domain() === domain);
    }
    
    async getRecentRequests(hours = 24) {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hours);
        
        const allRequests = await this.selectRows();
        return allRequests.filter(request => {
            const createdAt = new Date(request.getRowKey('created_at'));
            return createdAt >= cutoffDate;
        });
    }
    
    // Reporting methods
    async getDailyReport() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const allRequests = await this.selectRows();
        const todayRequests = allRequests.filter(request => {
            const createdAt = new Date(request.getRowKey('created_at'));
            return createdAt >= today;
        });
        
        const totalCost = todayRequests.reduce((sum, req) => 
            sum + parseFloat(req.getRowKey('cost') || 0), 0);
        
        const domains = {};
        todayRequests.forEach(request => {
            const domain = request.domain();
            if (domain) {
                domains[domain] = (domains[domain] || 0) + 1;
            }
        });
        
        return {
            date: today.toDateString(),
            requestCount: todayRequests.length,
            totalCost: totalCost,
            averageCost: todayRequests.length > 0 ? totalCost / todayRequests.length : 0,
            topDomains: Object.entries(domains)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
        };
    }
    
    // Bulk operations
    async recordRequest(userId, url, cost) {
        const request = this.newRow();
        request.setRowKeyValue('id', crypto.randomUUID());
        request.setRowKeyValue('user_id', userId);
        request.setRowKeyValue('url', url);
        request.setRowKeyValue('cost', cost);
        request.setRowKeyValue('created_at', new Date());
        
        if (!request.isValidUrl()) {
            throw new Error(`Invalid URL: ${url}`);
        }
        
        await request.save();
        
        // Auto-flag expensive requests
        await request.flagAsExpensive();
        
        return request;
    }
}
```

## Usage Examples

### Registering Custom Classes

```javascript
// Register all custom classes before database setup
globalThis.PmUser = PmUser;
globalThis.PmUsers = PmUsers;
globalThis.PmApiRequest = PmApiRequest;
globalThis.PmApiRequests = PmApiRequests;

// Initialize database - will use custom classes
const database = await SvDatabase.shared().setup();
```

### Using the Enhanced Classes

```javascript
const tx = database.newTx();
await tx.begin(async () => {
    const usersTable = database.tableWithName('users');
    const apiRequestsTable = database.tableWithName('api_requests');
    
    // Create a new user with validation
    const user = await usersTable.createUser('John Doe', 'john@example.com');
    console.log(`Created user: ${user.displayName()}`);
    
    // Record an API request
    const request = await user.recordApiRequest('https://api.openai.com/v1/chat/completions', 0.025);
    console.log(`API request cost: ${request.formattedCost()}`);
    
    // Get user's total spending
    const totalCost = await user.getTotalApiCost();
    console.log(`Total API cost: $${totalCost.toFixed(4)}`);
    
    // Find expensive requests
    const expensiveRequests = await apiRequestsTable.getExpensiveRequests();
    console.log(`Found ${expensiveRequests.length} expensive requests`);
    
    // Get daily report
    const report = await apiRequestsTable.getDailyReport();
    console.log('Daily Report:', report);
    
    // Find users by domain
    const exampleUsers = await usersTable.getUsersByDomain('example.com');
    console.log(`Users from example.com: ${exampleUsers.length}`);
});
```

## Benefits of Custom Classes

### **1. Domain-Specific Language**
```javascript
// Instead of generic ORM calls:
const cost = requests.reduce((sum, req) => sum + parseFloat(req.getRowKey('cost')), 0);

// You get readable domain methods:
const cost = await user.getTotalApiCost();
```

### **2. Validation & Business Logic**
```javascript
// Validation built into the model
if (!user.isValidEmail()) {
    throw new Error('Invalid email');
}

// Business rules encapsulated
if (request.isExpensive()) {
    await request.flagAsExpensive();
}
```

### **3. Computed Properties**
```javascript
// Clean interfaces for derived data
console.log(user.displayName());        // Name or email username
console.log(request.formattedCost());   // "$0.0250"
console.log(request.age());             // "2 hours ago"
```

### **4. Relationship Navigation**
```javascript
// Easy navigation between related objects
const user = await request.getUser();
const requests = await user.getApiRequests();
const recentRequests = await user.getRecentApiRequests(7);
```

This approach transforms a basic ORM into a rich domain model that makes your code more readable, maintainable, and expressive.