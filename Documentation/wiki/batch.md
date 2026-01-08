# exports['ingenium.sql']:batch

Execute multiple queries efficiently without transaction overhead.

## Description

The `batch` function allows you to execute multiple queries in sequence without the overhead of a transaction. Unlike [`transaction`](transaction.md), queries are not wrapped in BEGIN/COMMIT, so each query is independent. This is useful for loading related data from multiple tables when atomicity is not required.

## Signature

```lua
results = exports['ingenium.sql']:batch(queries, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queries` | table (array) | Yes | Array of query objects, each with `query` and `parameters` fields |
| `callback` | function | No | Optional callback function that receives the results array |

### Query Object Structure

Each query in the array should be a table with:
- `query` (string): The SQL query
- `parameters` (table/array): The query parameters

## Returns

**Type:** `table` (array)

Returns an array of results, one for each query in the same order they were provided. Each result corresponds to what the individual query function would return (array for SELECT, number for INSERT/UPDATE, etc.).

## Example

### Load Player Data from Multiple Tables

```lua
-- Load all player-related data at once
function LoadPlayerData(playerId)
    local results = exports['ingenium.sql']:batch({
        {
            query = 'SELECT * FROM players WHERE id = ?',
            parameters = {playerId}
        },
        {
            query = 'SELECT * FROM inventory WHERE player_id = ? ORDER BY slot',
            parameters = {playerId}
        },
        {
            query = 'SELECT * FROM accounts WHERE player_id = ?',
            parameters = {playerId}
        },
        {
            query = 'SELECT * FROM vehicles WHERE owner_id = ?',
            parameters = {playerId}
        }
    })
    
    -- Access results by index
    local player = results[1][1]      -- First query, first row
    local inventory = results[2]       -- Second query, all rows
    local accounts = results[3]        -- Third query, all rows
    local vehicles = results[4]        -- Fourth query, all rows
    
    return {
        player = player,
        inventory = inventory,
        accounts = accounts,
        vehicles = vehicles
    }
end

-- Usage
local data = LoadPlayerData(123)
print('Player: ' .. data.player.name)
print('Inventory items: ' .. #data.inventory)
print('Vehicles: ' .. #data.vehicles)
```

### Fetch Statistics from Multiple Tables

```lua
-- Get server statistics efficiently
function GetServerStats()
    local results = exports['ingenium.sql']:batch({
        {query = 'SELECT COUNT(*) as count FROM players'},
        {query = 'SELECT COUNT(*) as count FROM players WHERE is_online = 1'},
        {query = 'SELECT AVG(level) as avg_level FROM players'},
        {query = 'SELECT SUM(balance) as total FROM accounts'},
        {query = 'SELECT COUNT(*) as count FROM vehicles'}
    })
    
    return {
        totalPlayers = results[1][1].count,
        onlinePlayers = results[2][1].count,
        avgLevel = math.floor(results[3][1].avg_level or 0),
        totalMoney = results[4][1].total or 0,
        totalVehicles = results[5][1].count
    }
end

-- Usage
local stats = GetServerStats()
print('Online: ' .. stats.onlinePlayers .. '/' .. stats.totalPlayers)
print('Economy: $' .. stats.totalMoney)
```

### With Callback (Async Pattern)

```lua
-- Load player data asynchronously
function LoadPlayerDataAsync(playerId, callback)
    exports['ingenium.sql']:batch({
        {query = 'SELECT * FROM players WHERE id = ?', parameters = {playerId}},
        {query = 'SELECT * FROM inventory WHERE player_id = ?', parameters = {playerId}},
        {query = 'SELECT balance FROM accounts WHERE player_id = ?', parameters = {playerId}}
    }, function(results)
        local playerData = {
            info = results[1][1],
            inventory = results[2],
            balance = results[3][1] and results[3][1].balance or 0
        }
        
        callback(playerData)
    end)
end

-- Usage
LoadPlayerDataAsync(playerId, function(data)
    TriggerClientEvent('receivePlayerData', playerId, data)
end)
```

### Load Leaderboard Data

```lua
-- Get multiple leaderboards at once
function GetLeaderboards()
    local results = exports['ingenium.sql']:batch({
        {
            query = 'SELECT name, level FROM players ORDER BY level DESC LIMIT 10',
            parameters = {}
        },
        {
            query = 'SELECT p.name, a.balance FROM players p JOIN accounts a ON p.id = a.player_id ORDER BY a.balance DESC LIMIT 10',
            parameters = {}
        },
        {
            query = 'SELECT name, kills FROM players ORDER BY kills DESC LIMIT 10',
            parameters = {}
        }
    })
    
    return {
        topLevels = results[1],
        richest = results[2],
        topKillers = results[3]
    }
end
```

### Initialize New Player Data

```lua
-- Create starter data for new player (independent operations)
function InitializePlayer(playerId, name)
    -- Note: These are independent - if one fails, others still succeed
    -- Use transaction() if you need all-or-nothing behavior
    local results = exports['ingenium.sql']:batch({
        {
            query = 'INSERT INTO inventory (player_id, item_name, quantity, slot) VALUES (?, ?, ?, ?)',
            parameters = {playerId, 'phone', 1, 1}
        },
        {
            query = 'INSERT INTO inventory (player_id, item_name, quantity, slot) VALUES (?, ?, ?, ?)',
            parameters = {playerId, 'id_card', 1, 2}
        },
        {
            query = 'INSERT INTO inventory (player_id, item_name, quantity, slot) VALUES (?, ?, ?, ?)',
            parameters = {playerId, 'bread', 5, 3}
        },
        {
            query = 'INSERT INTO accounts (player_id, balance, account_type) VALUES (?, ?, ?)',
            parameters = {playerId, 5000, 'checking'}
        }
    })
    
    print('Initialized starter inventory and account for player ' .. playerId)
end
```

### Bulk Data Retrieval

```lua
-- Fetch data for multiple players at once
function GetPlayersData(playerIds)
    local queries = {}
    
    for _, id in ipairs(playerIds) do
        table.insert(queries, {
            query = 'SELECT id, name, level FROM players WHERE id = ?',
            parameters = {id}
        })
    end
    
    local results = exports['ingenium.sql']:batch(queries)
    
    local players = {}
    for i, result in ipairs(results) do
        if result[1] then
            players[playerIds[i]] = result[1]
        end
    end
    
    return players
end

-- Usage
local playerData = GetPlayersData({1, 2, 3, 4, 5})
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection.
- ⚠️ **No atomicity**: Unlike [`transaction`](transaction.md), if one query fails, others still execute.
- **Performance**: Faster than transactions because there's no BEGIN/COMMIT overhead.
- **Independence**: Each query is independent - perfect for reading data from multiple tables.
- **Order**: Results are returned in the same order as the queries array.

## When to Use Batch

✅ **Use batch when:**
- Loading related data from multiple tables
- Queries are independent of each other
- Performance is important and atomicity is not required
- Reading data (SELECT queries)
- Initializing non-critical data

❌ **Don't use batch when:**
- Operations must succeed or fail together - use [`transaction`](transaction.md) instead
- One query depends on the result of another
- Data integrity is critical (e.g., money transfers)

## Performance Tips

- Batch is generally faster than executing queries one at a time.
- Still slower than a single well-designed JOIN query - consider SQL optimization first.
- Use appropriate indexes on all queried columns.
- Limit result set sizes when possible.

## Related Functions

- [`transaction`](transaction.md) - Execute multiple queries atomically
- [`query`](query.md) - Execute single SELECT query
- [`prepareQuery`](prepareQuery.md) - Prepare queries for repeated execution

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.Batch`)
