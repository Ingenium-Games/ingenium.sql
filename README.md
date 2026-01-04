# ingenium.sql

External MySQL connection pool resource for FiveM using mysql2.

## Overview

`ingenium.sql` is a standalone FiveM resource that provides MySQL database connectivity for the Ingenium framework. The resource folder should be named `ingenium.sql` and other resources should reference it as `exports['ingenium.sql']` when importing functionality. It replaces the previously internalized mysql2 implementation that had timeout issues, offering a robust, external SQL connector.

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

### From Lua (Other Resources)

```lua
-- Query - Get multiple rows
local users = exports['ingenium.sql']:query('SELECT * FROM users WHERE age > ?', {18})

-- FetchSingle - Get one row
local user = exports['ingenium.sql']:fetchSingle('SELECT * FROM users WHERE id = ?', {userId})

-- FetchScalar - Get single value
local count = exports['ingenium.sql']:fetchScalar('SELECT COUNT(*) FROM users WHERE active = ?', {1})

-- Insert - Returns insert ID
local insertId = exports['ingenium.sql']:insert('INSERT INTO users (name, age) VALUES (?, ?)', {'John', 25})

-- Update - Returns affected rows
local affected = exports['ingenium.sql']:update('UPDATE users SET age = ? WHERE id = ?', {26, userId})

-- Transaction - Multiple queries atomically
local result = exports['ingenium.sql']:transaction({
    {query = 'UPDATE accounts SET balance = balance - ? WHERE id = ?', parameters = {100, fromAccount}},
    {query = 'UPDATE accounts SET balance = balance + ? WHERE id = ?', parameters = {100, toAccount}}
})

-- Batch - Multiple queries without transaction
local results = exports['ingenium.sql']:batch({
    {query = 'SELECT * FROM users WHERE id = ?', parameters = {1}},
    {query = 'SELECT * FROM accounts WHERE user_id = ?', parameters = {1}}
})

-- Named Parameters
local user = exports['ingenium.sql']:fetchSingle(
    'SELECT * FROM users WHERE name = @name AND age > @age',
    {name = 'John', age = 18}
)

-- Prepared Statements
local queryId = exports['ingenium.sql']:prepareQuery('SELECT * FROM users WHERE id = ?')
local user = exports['ingenium.sql']:executePrepared(queryId, {userId})

-- Check Connection Status
if exports['ingenium.sql']:isReady() then
    print('Database is ready')
end

-- Get Statistics
local stats = exports['ingenium.sql']:getStats()
print(json.encode(stats))
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

## API Reference

### Core Query Functions

#### `query(query, parameters, callback)`
Execute a SELECT query returning multiple rows.
- **Parameters**: 
  - `query` (string): SQL query with `?` or `@named` parameters
  - `parameters` (table/array): Query parameters
  - `callback` (function, optional): Callback function(results)
- **Returns**: Array of result rows

#### `fetchSingle(query, parameters, callback)`
Execute a SELECT query returning a single row.
- **Returns**: Single row object or `nil`

#### `fetchScalar(query, parameters, callback)`
Execute a SELECT query returning a single value.
- **Returns**: Single scalar value

#### `insert(query, parameters, callback)`
Execute an INSERT query.
- **Returns**: Insert ID (number)

#### `update(query, parameters, callback)`
Execute an UPDATE or DELETE query.
- **Returns**: Number of affected rows

#### `transaction(queries, callback)`
Execute multiple queries in a transaction.
- **Parameters**:
  - `queries` (array): Array of `{query, parameters}` objects
  - `callback` (function, optional): Callback function(success, results)
- **Returns**: `{success: boolean, results: array}`

#### `batch(queries, callback)`
Execute multiple queries without transaction.
- **Parameters**: Same as transaction
- **Returns**: Array of results

### Prepared Statements

#### `prepareQuery(query)`
Prepare a query for later execution.
- **Returns**: Query ID (string)

#### `executePrepared(queryId, parameters, callback)`
Execute a prepared query.
- **Returns**: Result based on query type

### Utility Functions

#### `isReady()`
Check if the connection pool is ready.
- **Returns**: Boolean

#### `getStats()`
Get performance statistics.
- **Returns**: Statistics object

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

### Connection Timeouts

The previous implementation had issues with connections timing out despite being active. This version addresses this with:

- `enableKeepAlive: true` - Sends keep-alive packets
- `keepAliveInitialDelay: 10000` - Starts keep-alive after 10 seconds
- Proper connection pool management with automatic reconnection

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
2. **Batch Multiple Reads** instead of individual queries
3. **Use Transactions** for multiple writes
4. **Add Database Indexes** on frequently queried columns
5. **Increase Connection Limit** for high-traffic servers
6. **Monitor Stats** regularly to identify bottlenecks

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

**Create Database:**
```sql
CREATE DATABASE fivem CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fivem'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT SELECT, INSERT, UPDATE, DELETE ON fivem.* TO 'fivem'@'localhost';
FLUSH PRIVILEGES;
```

**Note:** The FiveM database user only requires SELECT, INSERT, UPDATE, and DELETE privileges for normal operation. Database schema updates and migrations should be run by a higher-privileged account separately, keeping the connection handler's scope limited for security.

## Support

For issues related to:
- **This resource**: Open an issue in this repository
- **Ingenium framework**: Contact the ingenium development team
- **MySQL/MariaDB**: Consult official documentation

## License

MIT License - See LICENSE file for details

## Credits

- Architecture inspired by [oxmysql](https://github.com/overextended/oxmysql)
- Built for the Ingenium Games framework
- Uses [mysql2](https://github.com/sidorares/node-mysql2) library

## Changelog

### Version 1.0.0
- Initial release as external resource
- Separated from ingenium core resource
- Full mysql2 connection pool implementation
- Support for all query types
- Transaction and batch operations
- Prepared statement support
- Performance monitoring
- Named and positional parameters
