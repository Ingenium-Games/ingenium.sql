# exports['ingenium.sql']:fetchAll

Alias for [`query`](query.md) - provided for mysql-async compatibility.

## Description

The `fetchAll` function is a compatibility alias that maps to [`query`](query.md). It exists to maintain compatibility with codebases migrating from mysql-async. For new code, it is recommended to use [`query`](query.md) directly for clarity.

## Signature

```lua
results = exports['ingenium.sql']:fetchAll(query, parameters, callback)
```

## Parameters

Identical to [`query`](query.md):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the results |

## Returns

**Type:** `table` (array)

Returns an array of result rows. Each row is a table where keys are column names. See [`query`](query.md) for details.

## Example

### mysql-async Style Usage

```lua
-- mysql-async compatibility
local players = exports['ingenium.sql']:fetchAll('SELECT * FROM players WHERE level > ?', {10})

for _, player in ipairs(players) do
    print('Player: ' .. player.name .. ', Level: ' .. player.level)
end
```

### Recommended: Use query Instead

```lua
-- Recommended for new code (more explicit)
local players = exports['ingenium.sql']:query('SELECT * FROM players WHERE level > ?', {10})

for _, player in ipairs(players) do
    print('Player: ' .. player.name .. ', Level: ' .. player.level)
end
```

## Migration from mysql-async

If you're migrating from mysql-async, the `fetchAll` export works exactly the same:

```lua
-- Old mysql-async code
MySQL.Async.fetchAll('SELECT * FROM users WHERE active = @active', {
    ['@active'] = 1
}, function(results)
    print('Found ' .. #results .. ' users')
end)

-- Works with ingenium.sql (with provide directive)
exports['ingenium.sql']:fetchAll('SELECT * FROM users WHERE active = @active', {
    active = 1  -- Note: @ prefix not needed in parameter table
}, function(results)
    print('Found ' .. #results .. ' users')
end)

-- Or use the native function name
exports['ingenium.sql']:query('SELECT * FROM users WHERE active = @active', {
    active = 1
}, function(results)
    print('Found ' .. #results .. ' users')
end)
```

### Parameter Syntax Note

mysql-async requires `@` prefix in both query and parameter table keys:
```lua
-- mysql-async style
MySQL.Async.fetchAll('SELECT * FROM users WHERE id = @userId', {
    ['@userId'] = 123  -- @ prefix required in table key
})
```

ingenium.sql only requires `@` prefix in the query string:
```lua
-- ingenium.sql style (cleaner)
exports['ingenium.sql']:fetchAll('SELECT * FROM users WHERE id = @userId', {
    userId = 123  -- No @ prefix in table key
})
```

## Important Notes

- ⚠️ **This is a compatibility alias**: For new code, use [`query`](query.md) for better clarity.
- The functionality is identical to [`query`](query.md).
- Using `fetchAll` instead of `query` does not affect performance.
- Both names are available in all versions of ingenium.sql.
- Named parameter syntax is cleaner than mysql-async (no `@` prefix needed in parameter table).

## Compatibility

This export enables compatibility with resources expecting mysql-async. When using the `provide` directive in fxmanifest.lua:

```lua
provide 'mysql-async'
```

Resources that depend on mysql-async will automatically use ingenium.sql and can call `MySQL.Async.fetchAll()` or similar patterns.

## Related Functions

- **[`query`](query.md)** - The native ingenium.sql function (recommended)
- [`fetchSingle`](fetchSingle.md) - Get a single row
- [`fetchScalar`](fetchScalar.md) - Get a single value
- [`execute`](execute.md) - Smart router for any query type

## Source

- Implemented in: `server.js` (as alias to `query`)
- Compatibility export for mysql-async
