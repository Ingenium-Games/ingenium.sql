# exports['ingenium.sql']:prepareQuery

Prepare a query for repeated execution with different parameters.

## Description

The `prepareQuery` function creates a prepared statement that can be executed multiple times with different parameters. This is useful for queries that are executed frequently, as it improves performance by caching the query plan and reducing parsing overhead.

## Signature

```lua
queryId = exports['ingenium.sql']:prepareQuery(query)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL query with `?` placeholders or `@named` parameters |

## Returns

**Type:** `string`

Returns a unique query ID string (e.g., `"prepared_1"`) that can be used with [`executePrepared`](executePrepared.md) to execute the query. Returns `nil` if preparation fails.

## Example

### Basic Prepared Query

```lua
-- Prepare a frequently used query
local getUserQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM users WHERE id = ?'
)

-- Execute it multiple times with different parameters
for i = 1, 100 do
    local user = exports['ingenium.sql']:executePrepared(getUserQuery, {i})
    if user then
        print('User ' .. i .. ': ' .. user.name)
    end
end
```

### Preparing Multiple Queries

```lua
-- Prepare commonly used queries at resource start
local Queries = {}

Citizen.CreateThread(function()
    -- Wait for database to be ready
    while not exports['ingenium.sql']:isReady() do
        Citizen.Wait(100)
    end
    
    -- Prepare all common queries
    Queries.getPlayer = exports['ingenium.sql']:prepareQuery(
        'SELECT * FROM players WHERE identifier = ?'
    )
    
    Queries.updatePosition = exports['ingenium.sql']:prepareQuery(
        'UPDATE players SET x = ?, y = ?, z = ? WHERE id = ?'
    )
    
    Queries.getInventory = exports['ingenium.sql']:prepareQuery(
        'SELECT * FROM inventory WHERE player_id = ? ORDER BY slot'
    )
    
    Queries.addMoney = exports['ingenium.sql']:prepareQuery(
        'UPDATE accounts SET balance = balance + ? WHERE player_id = ?'
    )
    
    print('All queries prepared and ready')
end)

-- Use prepared queries throughout your resource
RegisterNetEvent('playerJoining')
AddEventHandler('playerJoining', function()
    local src = source
    local identifier = GetPlayerIdentifier(src, 0)
    
    -- Execute prepared query
    local player = exports['ingenium.sql']:executePrepared(
        Queries.getPlayer,
        {identifier}
    )
    
    if player then
        print('Player loaded: ' .. player.name)
    end
end)
```

### Prepared Query for Inventory System

```lua
-- Global prepared queries for inventory operations
InventoryQueries = {}

function InitializeInventoryQueries()
    InventoryQueries.getItem = exports['ingenium.sql']:prepareQuery(
        'SELECT * FROM inventory WHERE player_id = ? AND item_name = ?'
    )
    
    InventoryQueries.addItem = exports['ingenium.sql']:prepareQuery(
        'INSERT INTO inventory (player_id, item_name, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?'
    )
    
    InventoryQueries.removeItem = exports['ingenium.sql']:prepareQuery(
        'UPDATE inventory SET quantity = quantity - ? WHERE player_id = ? AND item_name = ? AND quantity >= ?'
    )
    
    InventoryQueries.getAll = exports['ingenium.sql']:prepareQuery(
        'SELECT * FROM inventory WHERE player_id = ?'
    )
end

-- Initialize on resource start
Citizen.CreateThread(function()
    if exports['ingenium.sql']:isReady() then
        InitializeInventoryQueries()
    end
end)

-- Use prepared queries in your functions
function AddItemToPlayer(playerId, itemName, quantity)
    local affected = exports['ingenium.sql']:executePrepared(
        InventoryQueries.addItem,
        {playerId, itemName, quantity, quantity}
    )
    return affected > 0
end
```

### Prepared Query with Named Parameters

```lua
-- Prepare query with named parameters
local searchPlayersQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM players WHERE level >= @minLevel AND zone = @zone AND active = @active'
)

-- Execute with different parameter values
local downtownPlayers = exports['ingenium.sql']:executePrepared(
    searchPlayersQuery,
    {minLevel = 10, zone = 'downtown', active = 1}
)

local upsideDownPlayers = exports['ingenium.sql']:executePrepared(
    searchPlayersQuery,
    {minLevel = 15, zone = 'upside_down', active = 1}
)
```

### Batch Operations with Prepared Query

```lua
-- Prepare query for batch updates
local updateHealthQuery = exports['ingenium.sql']:prepareQuery(
    'UPDATE players SET health = ?, armor = ? WHERE id = ?'
)

-- Update health for all online players efficiently
function SaveAllPlayerHealth()
    local players = GetPlayers() -- FiveM native
    
    for _, playerSrc in ipairs(players) do
        local ped = GetPlayerPed(playerSrc)
        local health = GetEntityHealth(ped)
        local armor = GetPedArmour(ped)
        local playerId = GetPlayerDatabaseId(playerSrc) -- Your function
        
        exports['ingenium.sql']:executePrepared(
            updateHealthQuery,
            {health, armor, playerId}
        )
    end
end

-- Call periodically
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(60000) -- Every minute
        SaveAllPlayerHealth()
    end
end)
```

### High-Frequency Query Optimization

```lua
-- For queries executed very frequently (e.g., every tick or frame)
local checkBalanceQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT balance FROM accounts WHERE player_id = ?'
)

-- This query is now much faster when called repeatedly
RegisterCommand('balance', function(source)
    local playerId = GetPlayerDatabaseId(source)
    local balance = exports['ingenium.sql']:executePrepared(
        checkBalanceQuery,
        {playerId}
    )
    
    if balance then
        TriggerClientEvent('showBalance', source, balance)
    end
end)
```

## Important Notes

- ⚠️ **Query ID persistence**: The query ID is valid for the lifetime of the resource. It is lost on resource restart.
- **Performance**: Prepared queries are more efficient than regular queries when executed multiple times.
- **Caching**: The resource automatically caches query type detection for better performance.
- **mysql2**: Internally, mysql2 also caches prepared statements for additional performance gains.
- **Resource restart**: You must re-prepare queries after resource restart - store preparation in an initialization function.

## Performance Benefits

1. **Reduced parsing overhead**: The query is parsed once, not every execution
2. **Query plan caching**: Database can optimize and cache the execution plan
3. **Type detection caching**: ingenium.sql caches the query type (SELECT, INSERT, etc.)
4. **Parameter optimization**: mysql2 handles parameter binding more efficiently

## When to Use Prepared Queries

✅ **Use prepared queries when:**
- A query is executed many times with different parameters
- You have hot paths that execute queries frequently
- Initializing player data on join
- Periodic auto-save operations
- Command handlers that run frequently

❌ **Don't use prepared queries when:**
- Query is only executed once or rarely
- Query structure changes dynamically
- Simple one-off operations

## Related Functions

- [`executePrepared`](executePrepared.md) - Execute a prepared query
- [`query`](query.md) - Execute a regular SELECT query
- [`insert`](insert.md) - Execute a regular INSERT query
- [`update`](update.md) - Execute a regular UPDATE query

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.PrepareQuery`)
- Also available as: `prepare` (oxmysql compatibility alias)
