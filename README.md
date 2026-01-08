# ingenium.sql

External MySQL connection pool resource for FiveM using mysql2.
https://ingenium-games.gitbook.io/ingenium.sql/

## Overview

`ingenium.sql` is a standalone FiveM resource that provides MySQL database connectivity for the Ingenium framework. The resource folder should be named `ingenium.sql` and other resources should reference it as `exports['ingenium.sql']` when importing functionality.

## ⚠️ Important Notice

**This repository is actively maintained and open to community contributions.**

When reporting issues, **you MUST use the provided issue template**. Issues that do not follow the template will be automatically closed without review. This helps us help you more efficiently.

**📝 [Report a Bug](https://github.com/Ingenium-Games/ingenium.sql/issues/new/choose)** | **📖 [Installation Guide](INSTALLATION.md)** | **🤝 [Contributing Guide](CONTRIBUTING.md)**

## Features

- **Connection Pooling**: Efficient connection management using mysql2's built-in pooling
- **Named & Positional Parameters**: Supports both `?` placeholders and `@named` parameters
- **Prepared Statements**: Pre-compile queries for repeated execution
- **Transactions**: Execute multiple queries atomically
- **Batch Operations**: Run multiple queries efficiently without transaction overhead
- **Performance Monitoring**: Track query statistics and identify slow queries
- **Auto-reconnect**: Maintains persistent connections with keep-alive
- **Comprehensive API**: Multiple query types (SELECT, INSERT, UPDATE, DELETE)

## Installation

You can install `ingenium.sql` in two ways:

### Option 1: Download from Releases (Recommended)
1. Download the latest release from the [Releases page](https://github.com/Ingenium-Games/ingenium.sql/releases)
2. Extract the contents to your FiveM `resources` folder
3. Ensure the folder is named `ingenium.sql`
4. Install Node.js dependencies:
   ```bash
   cd resources/ingenium.sql
   npm install
   ```
5. Configure your MySQL connection in `server.cfg` (see Configuration below)

### Option 2: Build from Source
1. Clone or download this repository to your FiveM `resources` folder
2. Ensure the folder is named `ingenium.sql`
3. Install Node.js dependencies:
   ```bash
   cd resources/ingenium.sql
   npm install
   ```
4. Configure your MySQL connection in `server.cfg`:
   ```cfg
   # Connection String Method (recommended)
   set mysql_connection_string "mysql://username:password@localhost:3306/database"
   
   # OR Individual Settings Method
   set mysql_host "localhost"
   set mysql_port "3306"
   set mysql_user "root"
   set mysql_password "yourpassword"
   set mysql_database "fivem"
   
   # Optional Settings
   set mysql_connection_limit "10"
   set mysql_charset "utf8mb4"
   ```
5. Add to your `server.cfg`:
   ```cfg
   ensure ingenium.sql
   ```

## Usage

### Quick Start Example

Here's a simple example to get you started:

```lua
-- Check if database is ready before using it
if exports['ingenium.sql']:isReady() then
    -- Get a user from the database
    local user = exports['ingenium.sql']:fetchSingle(
        'SELECT * FROM users WHERE id = ?',
        {1}  -- Parameters go here
    )
    
    -- Check if user was found
    if user then
        print('Found user: ' .. user.name)
    else
        print('User not found')
    end
end
```

### Common Use Cases

#### 1. Player Data Management

```lua
-- Get player data when they join
RegisterNetEvent('playerJoining')
AddEventHandler('playerJoining', function()
    local src = source
    local identifier = GetPlayerIdentifier(src, 0)
    
    -- Try to find existing player
    local player = exports['ingenium.sql']:fetchSingle(
        'SELECT * FROM players WHERE identifier = ?',
        {identifier}
    )
    
    if not player then
        -- Create new player if not found
        local insertId = exports['ingenium.sql']:insert(
            'INSERT INTO players (identifier, name, first_joined) VALUES (?, ?, NOW())',
            {identifier, GetPlayerName(src)}
        )
        print('Created new player with ID: ' .. insertId)
    else
        -- Update last seen
        exports['ingenium.sql']:update(
            'UPDATE players SET last_seen = NOW() WHERE id = ?',
            {player.id}
        )
        print('Player ' .. player.name .. ' returned!')
    end
end)
```

#### 2. Inventory System

```lua
-- Get all items in player's inventory
function GetPlayerInventory(playerId)
    local items = exports['ingenium.sql']:query(
        'SELECT * FROM inventory WHERE player_id = ? ORDER BY slot',
        {playerId}
    )
    
    -- Returns array of items, or empty array if none found
    return items or {}
end

-- Add item to inventory
function AddItem(playerId, itemName, quantity)
    -- Check if player already has this item
    local existing = exports['ingenium.sql']:fetchSingle(
        'SELECT * FROM inventory WHERE player_id = ? AND item_name = ?',
        {playerId, itemName}
    )
    
    if existing then
        -- Update quantity
        local affected = exports['ingenium.sql']:update(
            'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
            {quantity, existing.id}
        )
        return affected > 0
    else
        -- Insert new item
        local insertId = exports['ingenium.sql']:insert(
            'INSERT INTO inventory (player_id, item_name, quantity) VALUES (?, ?, ?)',
            {playerId, itemName, quantity}
        )
        return insertId > 0
    end
end

-- Remove item from inventory
function RemoveItem(playerId, itemName, quantity)
    local affected = exports['ingenium.sql']:update(
        'UPDATE inventory SET quantity = quantity - ? WHERE player_id = ? AND item_name = ? AND quantity >= ?',
        {quantity, playerId, itemName, quantity}
    )
    
    if affected > 0 then
        -- Clean up items with 0 quantity
        exports['ingenium.sql']:update(
            'DELETE FROM inventory WHERE player_id = ? AND quantity <= 0',
            {playerId}
        )
        return true
    end
    
    return false  -- Not enough items
end
```

#### 3. Banking System with Transactions

```lua
-- Transfer money between accounts (atomic operation)
function TransferMoney(fromAccount, toAccount, amount)
    -- Get current balances first to validate
    local fromBalance = exports['ingenium.sql']:fetchScalar(
        'SELECT balance FROM accounts WHERE id = ?',
        {fromAccount}
    )
    
    if not fromBalance or fromBalance < amount then
        return false, 'Insufficient funds'
    end
    
    -- Execute transfer as a transaction (all or nothing)
    local result = exports['ingenium.sql']:transaction({
        {
            query = 'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            parameters = {amount, fromAccount}
        },
        {
            query = 'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            parameters = {amount, toAccount}
        },
        {
            query = 'INSERT INTO transactions (from_account, to_account, amount, timestamp) VALUES (?, ?, ?, NOW())',
            parameters = {fromAccount, toAccount, amount}
        }
    })
    
    if result.success then
        return true, 'Transfer completed'
    else
        return false, 'Transaction failed'
    end
end

-- Get account balance
function GetBalance(accountId)
    local balance = exports['ingenium.sql']:fetchScalar(
        'SELECT balance FROM accounts WHERE id = ?',
        {accountId}
    )
    return balance or 0
end

-- Get transaction history
function GetTransactionHistory(accountId, limit)
    limit = limit or 10
    local transactions = exports['ingenium.sql']:query(
        'SELECT * FROM transactions WHERE from_account = ? OR to_account = ? ORDER BY timestamp DESC LIMIT ?',
        {accountId, accountId, limit}
    )
    return transactions or {}
end
```

### Error Handling Examples

```lua
-- Example 1: Basic error handling with pcall
local success, result = pcall(function()
    return exports['ingenium.sql']:fetchSingle(
        'SELECT * FROM users WHERE id = ?',
        {userId}
    )
end)

if success then
    if result then
        print('User found: ' .. result.name)
    else
        print('User not found')
    end
else
    print('Database error: ' .. tostring(result))
end

-- Example 2: With callback for async operations
exports['ingenium.sql']:query(
    'SELECT * FROM users WHERE active = ?',
    {1},
    function(results)
        if results then
            print('Found ' .. #results .. ' active users')
            for _, user in ipairs(results) do
                print('- ' .. user.name)
            end
        else
            print('Query failed or returned no results')
        end
    end
)

-- Example 3: Validating before operations
function SafeUpdateUser(userId, newName)
    -- Check if database is ready
    if not exports['ingenium.sql']:isReady() then
        return false, 'Database not ready'
    end
    
    -- Validate input
    if not userId or not newName or newName == '' then
        return false, 'Invalid parameters'
    end
    
    -- Check if user exists
    local exists = exports['ingenium.sql']:fetchScalar(
        'SELECT COUNT(*) FROM users WHERE id = ?',
        {userId}
    )
    
    if exists == 0 then
        return false, 'User not found'
    end
    
    -- Perform update
    local affected = exports['ingenium.sql']:update(
        'UPDATE users SET name = ? WHERE id = ?',
        {newName, userId}
    )
    
    if affected > 0 then
        return true, 'User updated'
    else
        return false, 'Update failed'
    end
end
```

### Named Parameters vs Positional Parameters

```lua
-- Positional parameters (?) - slightly faster
local user = exports['ingenium.sql']:fetchSingle(
    'SELECT * FROM users WHERE name = ? AND age > ?',
    {'John', 18}  -- Order must match the ? placeholders
)

-- Named parameters (@name) - more readable for complex queries
local user = exports['ingenium.sql']:fetchSingle(
    'SELECT * FROM users WHERE name = @name AND age > @minAge',
    {name = 'John', minAge = 18}  -- Order doesn't matter
)

-- Named parameters are especially useful for complex queries
local results = exports['ingenium.sql']:query(
    [[
        SELECT u.*, a.balance 
        FROM users u 
        LEFT JOIN accounts a ON u.id = a.user_id 
        WHERE u.name LIKE @searchName 
        AND u.age BETWEEN @minAge AND @maxAge 
        AND a.balance > @minBalance
    ]],
    {
        searchName = '%John%',
        minAge = 18,
        maxAge = 65,
        minBalance = 1000
    }
)
```

### Batch Operations for Performance

```lua
-- Instead of multiple separate queries (slow):
local user = exports['ingenium.sql']:fetchSingle('SELECT * FROM users WHERE id = ?', {userId})
local inventory = exports['ingenium.sql']:query('SELECT * FROM inventory WHERE player_id = ?', {userId})
local accounts = exports['ingenium.sql']:query('SELECT * FROM accounts WHERE user_id = ?', {userId})

-- Use batch to execute all at once (faster):
local results = exports['ingenium.sql']:batch({
    {query = 'SELECT * FROM users WHERE id = ?', parameters = {userId}},
    {query = 'SELECT * FROM inventory WHERE player_id = ?', parameters = {userId}},
    {query = 'SELECT * FROM accounts WHERE user_id = ?', parameters = {userId}}
})

-- Access results by index
local user = results[1][1]  -- First query, first row
local inventory = results[2]  -- Second query, all rows
local accounts = results[3]  -- Third query, all rows
```

### Prepared Statements for Repeated Queries

```lua
-- For queries executed many times, prepare them once
local getUserQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM users WHERE id = ?'
)

-- Then execute multiple times with different parameters
for i = 1, 100 do
    local user = exports['ingenium.sql']:executePrepared(getUserQuery, {i})
    if user then
        print('Found user: ' .. user.name)
    end
end

-- This is more efficient than calling query() 100 times
```

### Advanced: Checking Connection Status and Statistics

```lua
-- Check if database is ready before critical operations
if not exports['ingenium.sql']:isReady() then
    print('WARNING: Database not ready, waiting...')
    -- Wait or retry logic here
    return
end

-- Get performance statistics (useful for monitoring)
local stats = exports['ingenium.sql']:getStats()
print('Total queries: ' .. stats.totalQueries)
print('Failed queries: ' .. stats.failedQueries)
print('Average query time: ' .. stats.avgQueryTime .. 'ms')
print('Slowest query: ' .. stats.slowestQuery .. 'ms')

-- Log slow queries for optimization
if stats.slowestQuery > 500 then
    print('WARNING: Slow queries detected, check database indexes')
end
```

### From Ingenium Core (ig.sql namespace)

If you're using this with the ingenium framework, the `_handler.lua` wrapper provides convenient access through the `ig.sql` namespace:

```lua
-- These functions are available automatically in ingenium resources
local users = ig.sql.Query('SELECT * FROM users WHERE age > ?', {18})
local user = ig.sql.FetchSingle('SELECT * FROM users WHERE id = ?', {userId})
local count = ig.sql.FetchScalar('SELECT COUNT(*) FROM users')
local insertId = ig.sql.Insert('INSERT INTO users (name) VALUES (?)', {'John'})
local affected = ig.sql.Update('UPDATE users SET age = ? WHERE id = ?', {26, userId})

-- With callbacks
ig.sql.Query('SELECT * FROM users', {}, function(results)
    for _, user in ipairs(results) do
        print(user.name)
    end
end)
```

## API Documentation

For detailed documentation on each export, please refer to the [Wiki Documentation](Documentation/wiki/).

### Available Exports

#### Core Query Functions
The following exports provide the primary database functionality:

- **[query](Documentation/wiki/query.md)** - Execute SELECT queries returning multiple rows
- **[fetchSingle](Documentation/wiki/fetchSingle.md)** - Execute SELECT query returning a single row
- **[fetchScalar](Documentation/wiki/fetchScalar.md)** - Execute SELECT query returning a single value
- **[insert](Documentation/wiki/insert.md)** - Execute INSERT queries and return the insert ID
- **[update](Documentation/wiki/update.md)** - Execute UPDATE or DELETE queries and return affected rows
- **[transaction](Documentation/wiki/transaction.md)** - Execute multiple queries atomically
- **[batch](Documentation/wiki/batch.md)** - Execute multiple queries efficiently without transaction

#### Prepared Statements
For improved performance with repeated queries:

- **[prepareQuery](Documentation/wiki/prepareQuery.md)** - Prepare a query for later execution
- **[executePrepared](Documentation/wiki/executePrepared.md)** - Execute a prepared query

#### Utility Functions
Helper functions for connection management and monitoring:

- **[isReady](Documentation/wiki/isReady.md)** - Check if the connection pool is ready
- **[getStats](Documentation/wiki/getStats.md)** - Get performance statistics

#### Compatibility Aliases
For compatibility with oxmysql and mysql-async:

- **[single](Documentation/wiki/single.md)** - Alias for `fetchSingle`
- **[scalar](Documentation/wiki/scalar.md)** - Alias for `fetchScalar`
- **[prepare](Documentation/wiki/prepare.md)** - Alias for `prepareQuery`
- **[execute](Documentation/wiki/execute.md)** - Smart router for query type detection
- **[fetchAll](Documentation/wiki/fetchAll.md)** - Alias for `query`

### Quick Reference

```lua
-- Basic usage
local users = exports['ingenium.sql']:query('SELECT * FROM users WHERE age > ?', {18})
local user = exports['ingenium.sql']:fetchSingle('SELECT * FROM users WHERE id = ?', {userId})
local count = exports['ingenium.sql']:fetchScalar('SELECT COUNT(*) FROM users')
local insertId = exports['ingenium.sql']:insert('INSERT INTO users (name) VALUES (?)', {'John'})
local affected = exports['ingenium.sql']:update('UPDATE users SET name = ? WHERE id = ?', {'Jane', userId})

-- Ingenium framework integration (ig.sql namespace)
local users = ig.sql.Query('SELECT * FROM users WHERE age > ?', {18})
local user = ig.sql.FetchSingle('SELECT * FROM users WHERE id = ?', {userId})
```

See the usage examples earlier in this README and the [Wiki Documentation](Documentation/wiki/) for detailed information on each function.

## Architecture

This resource follows the oxmysql architecture pattern:

1. **Connection Pool** (`_pool.js`): Manages MySQL connections with automatic reconnection
2. **Query Handler** (`server.js`): Implements all query types and parameter processing
3. **Lua Wrapper** (`_handler.lua`): Optional Lua interface for ingenium framework integration

### Connection Pool Features

- Automatic connection management
- Keep-alive to prevent timeouts
- Configurable connection limits
- Connection reuse for performance
- Timezone normalization (UTC)
- BigInt and date string support

### Query Processing

- Parameter sanitization (prevents SQL injection)
- Named parameter conversion (`@name` → `?`)
- Query performance tracking
- Slow query detection (>150ms)
- Automatic error handling

## Configuration Options

| ConVar | Default | Description |
|--------|---------|-------------|
| `mysql_connection_string` | - | Full connection string (preferred) |
| `mysql_host` | `localhost` | Database host |
| `mysql_port` | `3306` | Database port |
| `mysql_user` | `root` | Database username |
| `mysql_password` | - | Database password |
| `mysql_database` | `fivem` | Database name |
| `mysql_connection_limit` | `10` | Max concurrent connections |
| `mysql_charset` | `utf8mb4` | Character encoding |

## Troubleshooting

### Slow Queries

Queries taking longer than 150ms are logged as warnings. Check your:
- Database indexes
- Query complexity
- Server performance
- Connection pool size

### Connection Refused

Ensure:
- MySQL/MariaDB is running
- Credentials are correct in `server.cfg`
- Database exists
- User has proper permissions
- No firewall blocking connections

## Performance Tips

1. **Use Prepared Statements** for repeated queries
   - The resource automatically caches query type detection for better performance
   - mysql2 internally caches prepared statements for faster execution
   
2. **Batch Multiple Reads** instead of individual queries
   - Use the `batch()` function to execute multiple queries efficiently
   - Reduces network round-trips and connection overhead
   
3. **Use Transactions** for multiple writes
   - Ensures atomicity and improves performance for related operations
   - Single connection is used for all queries in the transaction
   
4. **Add Database Indexes** on frequently queried columns
   - Dramatically improves SELECT query performance
   - Check slow query logs to identify which columns need indexing
   
5. **Increase Connection Limit** for high-traffic servers
   - Default is 10 concurrent connections
   - Adjust `mysql_connection_limit` based on your server load
   - Monitor connection pool usage with `getStats()`
   
6. **Monitor Stats** regularly to identify bottlenecks
   - Use `exports['ingenium.sql']:getStats()` to get performance metrics
   - Watch for slow queries (>150ms) and optimize them
   - Track average query time and failed queries

7. **Optimize Parameter Usage**
   - Named parameters (@param) are automatically cached for efficiency
   - Use positional parameters (?) for slightly better performance
   - Avoid excessive parameter substitutions in a single query

8. **Query Caching Considerations**
   - The resource caches up to 100 unique query type detections
   - Regex patterns for named parameters are cached indefinitely
   - This improves performance for repeated query patterns

## Performance Optimizations (v1.0.0+)

This resource includes several performance optimizations:

- **Cached Regex Patterns**: Named parameter regex patterns are compiled once and reused
- **Query Type Caching**: Query type detection results are cached for repeated queries
- **Incremental Statistics**: Average query time is calculated incrementally, not on every request
- **Exponential Backoff**: Lua's AwaitReady function uses exponential backoff to reduce CPU usage
- **mysql2 Prepared Statements**: Automatically leverages mysql2's internal prepared statement cache
- **Early Exit Optimization**: Parameter processing exits early when no named parameters are present


## Differences from oxmysql

While inspired by oxmysql, this resource is tailored for the ingenium framework:

- Resource name is `ingenium.sql` instead of `oxmysql`
- Includes `_handler.lua` for `ig.sql` namespace integration with ingenium core
- Provides compatibility with oxmysql and mysql-async via `provide` directives
- Includes compatibility exports: `single`, `scalar`, `prepare`, `execute`, `fetchAll`
- Simplified export structure
- Custom initialization events
- Adapted for ingenium resource patterns

## Compatibility with oxmysql and mysql-async

This resource can be used as a drop-in replacement for oxmysql or mysql-async by using the `provide` directive. Resources expecting oxmysql or mysql-async will automatically use this resource instead.

**Compatibility exports provided:**
- `single` (alias for `fetchSingle`) - oxmysql compatibility
- `scalar` (alias for `fetchScalar`) - oxmysql compatibility
- `prepare` (alias for `prepareQuery`) - oxmysql compatibility
- `execute` (smart router) - oxmysql/mysql-async compatibility
- `fetchAll` (alias for `query`) - mysql-async compatibility

The `execute` function automatically detects the query type (SELECT, INSERT, UPDATE, DELETE) and routes to the appropriate handler, providing compatibility with both libraries' usage patterns.

## Database Recommendations

### MariaDB vs MySQL

**MariaDB** is recommended over MySQL for:
- Better performance with FiveM
- Improved connection handling
- Drop-in MySQL replacement
- Active development

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mariadb-server
sudo mysql_secure_installation
```

**Windows:**
Download from [MariaDB.org](https://mariadb.org/download/)

**Create Database User with limited permissions:**
```sql
CREATE USER 'fivem'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT SELECT, INSERT, UPDATE, DELETE ON fivem.* TO 'fivem'@'localhost';
FLUSH PRIVILEGES;
```

**Note:** The FiveM database user should only really need SELECT, INSERT, UPDATE, and DELETE privileges for normal operation. Database schema updates and migrations should be run by a higher-privileged account separately, keeping the connection handler's scope limited for security.

## Support

**Need help?** We're here to assist!

- **🐛 Found a bug?** [Report it using our Bug Report template](https://github.com/Ingenium-Games/ingenium.sql/issues/new/choose)
  - **Important**: Issues must follow the template or they will be closed without review
- **📖 Installation help?** Check our [Installation Guide](INSTALLATION.md) with step-by-step instructions
- **💬 Questions or discussions?** Visit [GitHub Discussions](https://github.com/Ingenium-Games/ingenium.sql/discussions)
- **🤝 Want to contribute?** Read our [Contributing Guide](CONTRIBUTING.md)
- **📚 Ingenium framework issues?** Contact the Ingenium development team
- **🔧 MySQL/MariaDB issues?** Consult the [official documentation](https://mariadb.com/kb/en/documentation/)

**Before asking for help:**
1. Read the [Installation Guide](INSTALLATION.md) and try troubleshooting steps
2. Search existing issues to see if your problem has been solved
3. Make sure you're using a supported version (Node.js 16+, MySQL 5.7+/MariaDB 10.3+)

## License

MIT License - See LICENSE file for details

## Credits

- Architecture inspired by [oxmysql](https://github.com/overextended/oxmysql)
- Built for the Ingenium Games framework
- Uses [mysql2](https://github.com/sidorares/node-mysql2) library

## Changelog

### Version 1.0.2
- First public stable release
- Updated installation documentation with two clear installation options
- Clarified dependency installation process for both download and build methods

### Version 1.0.0
- Initial release as external resource
- Separated from ingenium core resource
- Full mysql2 connection pool implementation
- Support for all query types
- Transaction and batch operations
- Prepared statement support
- Performance monitoring
- Named and positional parameters
