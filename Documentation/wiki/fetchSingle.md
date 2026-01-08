# exports['ingenium.sql']:fetchSingle

Execute a SELECT query that returns a single row from the database.

## Description

The `fetchSingle` function is optimized for queries that should return exactly one row (or no rows). It executes a SELECT query and returns only the first row of the result set, or `nil` if no rows match.

## Signature

```lua
result = exports['ingenium.sql']:fetchSingle(query, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the result |

## Returns

**Type:** `table` or `nil`

Returns a single table representing the first row found, where keys are column names and values are the column data. Returns `nil` if no matching row is found or if an error occurs.

## Example

### Check if Player Exists

```lua
-- Look up a player by identifier
local player = exports['ingenium.sql']:fetchSingle(
    'SELECT * FROM players WHERE identifier = ?',
    {identifier}
)

if player then
    print('Found player: ' .. player.name)
    print('Level: ' .. player.level)
    print('Last seen: ' .. player.last_seen)
else
    print('Player not found')
end
```

### Get User Profile with Named Parameters

```lua
-- Get a specific user's profile
local user = exports['ingenium.sql']:fetchSingle(
    'SELECT id, name, email, created_at FROM users WHERE id = @userId AND active = @active',
    {
        userId = 123,
        active = 1
    }
)

if user then
    print('User profile loaded for: ' .. user.name)
end
```

### With Callback (Async Pattern)

```lua
-- Load player data asynchronously
exports['ingenium.sql']:fetchSingle(
    'SELECT * FROM players WHERE id = ?',
    {playerId},
    function(player)
        if player then
            -- Update player position in memory
            playerData[playerId] = player
            TriggerClientEvent('updatePlayerData', playerId, player)
        else
            print('Player ' .. playerId .. ' not found in database')
        end
    end
)
```

### Checking Player Data on Join

```lua
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
        -- New player - create record
        print('New player joining: ' .. GetPlayerName(src))
        local insertId = exports['ingenium.sql']:insert(
            'INSERT INTO players (identifier, name, created_at) VALUES (?, ?, NOW())',
            {identifier, GetPlayerName(src)}
        )
        print('Created player record with ID: ' .. insertId)
    else
        -- Existing player - update last seen
        print('Player ' .. player.name .. ' (ID: ' .. player.id .. ') returned')
        exports['ingenium.sql']:update(
            'UPDATE players SET last_seen = NOW() WHERE id = ?',
            {player.id}
        )
    end
end)
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection. Never concatenate user input directly into query strings.
- Returns `nil` if no rows match, not an empty table.
- Only the first row is returned even if multiple rows match your query.
- Use `LIMIT 1` in your query for better performance when you know only one row is needed.
- For queries that should return multiple rows, use [`query`](query.md) instead.
- For queries that return a single value from a row, use [`fetchScalar`](fetchScalar.md) instead.

## Performance Tips

- Always add `LIMIT 1` to your query when you only need one result for better database performance.
- Add appropriate indexes on columns used in `WHERE` clauses.
- Avoid using `SELECT *` when you only need specific columns.
- For repeatedly executed queries, consider using [`prepareQuery`](prepareQuery.md) and [`executePrepared`](executePrepared.md).

## Related Functions

- [`query`](query.md) - Get multiple rows from the database
- [`fetchScalar`](fetchScalar.md) - Get a single value from the database
- [`insert`](insert.md) - Insert new records
- [`update`](update.md) - Update existing records

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.FetchSingle`)
- Also available as: `single` (oxmysql compatibility alias)
