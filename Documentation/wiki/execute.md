# exports['ingenium.sql']:execute

Smart query router that automatically detects query type and routes to the appropriate handler.

## Description

The `execute` function is a compatibility wrapper that provides automatic query type detection and routing. It analyzes the SQL query to determine if it's a SELECT, INSERT, UPDATE, or DELETE statement, then routes it to the appropriate handler function. This provides compatibility with both oxmysql and mysql-async libraries.

## Signature

```lua
result = exports['ingenium.sql']:execute(query, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the result |

## Returns

**Type:** Varies based on query type

- **SELECT queries**: Array of rows (like [`query`](query.md))
- **INSERT queries**: Insert ID number (like [`insert`](insert.md))
- **UPDATE/DELETE queries**: Number of affected rows (like [`update`](update.md))

## Query Type Detection

The function detects query type by analyzing the first SQL keyword:

- `SELECT` → Routes to [`query`](query.md)
- `INSERT` → Routes to [`insert`](insert.md)
- `UPDATE` → Routes to [`update`](update.md)
- `DELETE` → Routes to [`update`](update.md)
- Unknown types → Defaults to [`query`](query.md) with a warning

## Example

### Automatic Query Routing

```lua
-- SELECT query - returns array of rows
local users = exports['ingenium.sql']:execute('SELECT * FROM users WHERE active = ?', {1})
print('Found ' .. #users .. ' users')

-- INSERT query - returns insert ID
local insertId = exports['ingenium.sql']:execute(
    'INSERT INTO players (name, level) VALUES (?, ?)',
    {'John', 1}
)
print('Created player with ID: ' .. insertId)

-- UPDATE query - returns affected rows
local affected = exports['ingenium.sql']:execute(
    'UPDATE players SET level = ? WHERE id = ?',
    {5, insertId}
)
print('Updated ' .. affected .. ' player(s)')

-- DELETE query - returns affected rows
local deleted = exports['ingenium.sql']:execute(
    'DELETE FROM logs WHERE created_at < ?',
    {'2024-01-01'}
)
print('Deleted ' .. deleted .. ' log entries')
```

### Migration from oxmysql

```lua
-- Old oxmysql code using execute
local result = exports.oxmysql:execute('SELECT * FROM users WHERE id = ?', {userId})

-- Works identically with ingenium.sql
local result = exports['ingenium.sql']:execute('SELECT * FROM users WHERE id = ?', {userId})
```

### Migration from mysql-async

```lua
-- Old mysql-async code
MySQL.Async.execute('UPDATE users SET coins = ? WHERE id = ?', {100, userId}, function(affected)
    print('Updated ' .. affected .. ' rows')
end)

-- Works with ingenium.sql execute
exports['ingenium.sql']:execute('UPDATE users SET coins = ? WHERE id = ?', {100, userId}, function(affected)
    print('Updated ' .. affected .. ' rows')
end)
```

### With Callback Pattern

```lua
-- SELECT with callback
exports['ingenium.sql']:execute(
    'SELECT * FROM inventory WHERE player_id = ?',
    {playerId},
    function(items)
        print('Player has ' .. #items .. ' items')
    end
)

-- INSERT with callback
exports['ingenium.sql']:execute(
    'INSERT INTO vehicles (owner_id, model) VALUES (?, ?)',
    {playerId, 'adder'},
    function(insertId)
        print('Vehicle created with ID: ' .. insertId)
    end
)
```

### Generic Query Handler

```lua
-- Useful when query type is determined at runtime
function ExecuteQuery(queryType, params)
    local queries = {
        getUser = 'SELECT * FROM users WHERE id = ?',
        createUser = 'INSERT INTO users (name, email) VALUES (?, ?)',
        updateUser = 'UPDATE users SET name = ? WHERE id = ?',
        deleteUser = 'DELETE FROM users WHERE id = ?'
    }
    
    local query = queries[queryType]
    if query then
        return exports['ingenium.sql']:execute(query, params)
    end
end

-- The execute function handles routing automatically
local user = ExecuteQuery('getUser', {123})
local insertId = ExecuteQuery('createUser', {'John', 'john@example.com'})
local affected = ExecuteQuery('updateUser', {'Jane', 123})
```

### Named Parameters

```lua
-- Works with named parameters too
local players = exports['ingenium.sql']:execute(
    'SELECT * FROM players WHERE level >= @minLevel AND zone = @zone',
    {minLevel = 10, zone = 'downtown'}
)
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection.
- ⚠️ **Query type caching**: The function caches query type detection for performance.
- **Compatibility**: Provides compatibility with both oxmysql and mysql-async usage patterns.
- **Performance**: Slightly slower than calling specific functions directly due to type detection overhead.
- **Recommendation**: For new code, prefer using specific functions ([`query`](query.md), [`insert`](insert.md), [`update`](update.md)) for better clarity and slightly better performance.

## When to Use Execute

✅ **Use execute when:**
- Migrating from oxmysql or mysql-async
- Query type is determined at runtime
- You need a generic query handler
- Maintaining compatibility with existing code

✅ **Use specific functions when:**
- Writing new code (use [`query`](query.md), [`insert`](insert.md), etc.)
- Query type is known at development time
- Maximum performance is needed
- Code clarity is important

## Performance

The `execute` function includes optimizations:
- Query type detection results are cached (up to 1000 unique query patterns)
- Normalized query patterns allow caching even with different parameter values
- Cache reduces overhead for frequently executed query patterns

## Compatibility

This export enables compatibility with resources expecting oxmysql or mysql-async. When using the `provide` directive in fxmanifest.lua:

```lua
provide 'oxmysql'
provide 'mysql-async'
```

Resources that depend on either library will automatically use ingenium.sql.

## Related Functions

- [`query`](query.md) - Execute SELECT queries directly (recommended for new code)
- [`insert`](insert.md) - Execute INSERT queries directly (recommended for new code)
- [`update`](update.md) - Execute UPDATE/DELETE queries directly (recommended for new code)
- [`fetchSingle`](fetchSingle.md) - Get single row (more specific than execute)
- [`fetchScalar`](fetchScalar.md) - Get single value (more specific than execute)

## Source

- Implemented in: `server.js`
- Uses cached query type detection for performance
- Compatibility export for oxmysql and mysql-async
