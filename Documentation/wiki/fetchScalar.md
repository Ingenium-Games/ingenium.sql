# exports['ingenium.sql']:fetchScalar

Execute a SELECT query that returns a single scalar value from the database.

## Description

The `fetchScalar` function is optimized for queries that return a single value, such as `COUNT(*)`, `SUM()`, `MAX()`, or selecting a single column from a single row. It returns just the first column value from the first row of the result set.

## Signature

```lua
value = exports['ingenium.sql']:fetchScalar(query, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the value |

## Returns

**Type:** `any` (typically `number`, `string`, or `nil`)

Returns the first column value from the first row. The return type depends on the column type (number for integers/decimals, string for text, etc.). Returns `nil` if no rows are found or if an error occurs.

## Example

### Get Row Count

```lua
-- Count all active users
local userCount = exports['ingenium.sql']:fetchScalar(
    'SELECT COUNT(*) FROM users WHERE active = ?',
    {1}
)

print('Active users: ' .. (userCount or 0))
```

### Get Account Balance

```lua
-- Get a player's bank balance
local balance = exports['ingenium.sql']:fetchScalar(
    'SELECT balance FROM accounts WHERE player_id = ?',
    {playerId}
)

if balance then
    print('Current balance: $' .. balance)
else
    print('Account not found')
end
```

### Using Named Parameters

```lua
-- Get the highest level in a specific zone
local maxLevel = exports['ingenium.sql']:fetchScalar(
    'SELECT MAX(level) FROM players WHERE zone = @zone AND active = @active',
    {
        zone = 'downtown',
        active = 1
    }
)

print('Highest level in zone: ' .. (maxLevel or 0))
```

### With Callback (Async Pattern)

```lua
-- Check if username is available
exports['ingenium.sql']:fetchScalar(
    'SELECT COUNT(*) FROM users WHERE username = ?',
    {username},
    function(count)
        if count and count > 0 then
            TriggerClientEvent('usernameCheck', src, false, 'Username already taken')
        else
            TriggerClientEvent('usernameCheck', src, true, 'Username available')
        end
    end
)
```

### Aggregate Functions

```lua
-- Get total money in circulation
local totalMoney = exports['ingenium.sql']:fetchScalar(
    'SELECT SUM(balance) FROM accounts'
)

-- Get average player level
local avgLevel = exports['ingenium.sql']:fetchScalar(
    'SELECT AVG(level) FROM players WHERE active = 1'
)

-- Get oldest player registration date
local oldestPlayer = exports['ingenium.sql']:fetchScalar(
    'SELECT MIN(created_at) FROM players'
)

print('Total money in economy: $' .. (totalMoney or 0))
print('Average player level: ' .. (avgLevel or 0))
print('Server opened: ' .. (oldestPlayer or 'Unknown'))
```

### Checking if Record Exists

```lua
-- Check if a license plate is already registered
function IsLicensePlateTaken(plate)
    local count = exports['ingenium.sql']:fetchScalar(
        'SELECT COUNT(*) FROM vehicles WHERE plate = ?',
        {plate}
    )
    return count and count > 0
end

-- Usage
if IsLicensePlateTaken('ABC123') then
    print('License plate is already registered')
else
    print('License plate is available')
end
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection. Never concatenate user input directly into query strings.
- Returns `nil` if no rows match, not 0 or an empty string.
- Only the first column of the first row is returned.
- For queries returning full rows, use [`fetchSingle`](fetchSingle.md) instead.
- For queries returning multiple rows, use [`query`](query.md) instead.
- Commonly used with aggregate functions: `COUNT()`, `SUM()`, `AVG()`, `MAX()`, `MIN()`.

## Performance Tips

- Always add `LIMIT 1` when selecting a single value from a table for better performance.
- Use appropriate indexes on columns in `WHERE` clauses and aggregate functions.
- `COUNT(*)` is typically faster than `COUNT(column_name)`.
- For repeatedly executed queries, consider using [`prepareQuery`](prepareQuery.md) and [`executePrepared`](executePrepared.md).

## Related Functions

- [`query`](query.md) - Get multiple rows from the database
- [`fetchSingle`](fetchSingle.md) - Get a single row from the database
- [`isReady`](isReady.md) - Check database connection status

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.FetchScalar`)
- Also available as: `scalar` (oxmysql compatibility alias)
