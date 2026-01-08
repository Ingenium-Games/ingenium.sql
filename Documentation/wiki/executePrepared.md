# exports['ingenium.sql']:executePrepared

Execute a previously prepared query with the specified parameters.

## Description

The `executePrepared` function executes a query that was previously prepared using [`prepareQuery`](prepareQuery.md). This is more efficient than executing the query directly when the same query needs to be run multiple times with different parameters.

## Signature

```lua
result = exports['ingenium.sql']:executePrepared(queryId, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queryId` | string | Yes | Query ID returned from [`prepareQuery`](prepareQuery.md) |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the result |

## Returns

**Type:** Varies based on query type

Returns the same type as the corresponding direct query function would return:
- **SELECT** queries: Array of rows (like [`query`](query.md) or [`fetchSingle`](fetchSingle.md))
- **INSERT** queries: Insert ID number
- **UPDATE/DELETE** queries: Number of affected rows

Returns `nil` if the query ID is not found or if an error occurs.

## Example

### Basic Usage

```lua
-- Prepare the query once
local getUserQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM users WHERE id = ?'
)

-- Execute multiple times with different parameters
local user1 = exports['ingenium.sql']:executePrepared(getUserQuery, {1})
local user2 = exports['ingenium.sql']:executePrepared(getUserQuery, {2})
local user3 = exports['ingenium.sql']:executePrepared(getUserQuery, {3})

print('User 1: ' .. user1.name)
print('User 2: ' .. user2.name)
print('User 3: ' .. user3.name)
```

### Prepared Queries in a Module

```lua
-- queries.lua - Centralized query management
local Queries = {}
local prepared = false

function Queries.Initialize()
    if prepared then return end
    
    Queries.getPlayer = exports['ingenium.sql']:prepareQuery(
        'SELECT * FROM players WHERE id = ?'
    )
    
    Queries.updatePlayerPosition = exports['ingenium.sql']:prepareQuery(
        'UPDATE players SET x = ?, y = ?, z = ?, heading = ? WHERE id = ?'
    )
    
    Queries.getPlayerInventory = exports['ingenium.sql']:prepareQuery(
        'SELECT * FROM inventory WHERE player_id = ? ORDER BY slot'
    )
    
    Queries.updateMoney = exports['ingenium.sql']:prepareQuery(
        'UPDATE accounts SET balance = balance + ? WHERE player_id = ?'
    )
    
    prepared = true
    print('Database queries initialized')
end

function Queries.GetPlayer(playerId)
    return exports['ingenium.sql']:executePrepared(Queries.getPlayer, {playerId})
end

function Queries.SavePosition(playerId, x, y, z, heading)
    return exports['ingenium.sql']:executePrepared(
        Queries.updatePlayerPosition,
        {x, y, z, heading, playerId}
    )
end

function Queries.GetInventory(playerId)
    return exports['ingenium.sql']:executePrepared(Queries.getPlayerInventory, {playerId})
end

function Queries.AddMoney(playerId, amount)
    return exports['ingenium.sql']:executePrepared(Queries.updateMoney, {amount, playerId})
end

return Queries
```

### Using the Module

```lua
-- main.lua
local Queries = require('queries')

-- Initialize queries when database is ready
Citizen.CreateThread(function()
    while not exports['ingenium.sql']:isReady() do
        Citizen.Wait(100)
    end
    Queries.Initialize()
end)

-- Use throughout your resource
RegisterNetEvent('savePlayerPosition')
AddEventHandler('savePlayerPosition', function(x, y, z, heading)
    local src = source
    local playerId = GetPlayerDatabaseId(src)
    
    local affected = Queries.SavePosition(playerId, x, y, z, heading)
    if affected > 0 then
        print('Position saved for player ' .. playerId)
    end
end)

RegisterCommand('inventory', function(source)
    local playerId = GetPlayerDatabaseId(source)
    local items = Queries.GetInventory(playerId)
    
    TriggerClientEvent('showInventory', source, items)
end)
```

### With Callback (Async Pattern)

```lua
-- Prepare query
local getPlayerVehiclesQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM vehicles WHERE owner_id = ?'
)

-- Execute with callback
function GetPlayerVehicles(playerId, callback)
    exports['ingenium.sql']:executePrepared(
        getPlayerVehiclesQuery,
        {playerId},
        function(vehicles)
            callback(vehicles or {})
        end
    )
end

-- Usage
GetPlayerVehicles(playerId, function(vehicles)
    print('Player has ' .. #vehicles .. ' vehicles')
    for _, vehicle in ipairs(vehicles) do
        print('- ' .. vehicle.model .. ' (' .. vehicle.plate .. ')')
    end
end)
```

### High-Performance Loop

```lua
-- Prepare query for batch processing
local updateLastSeenQuery = exports['ingenium.sql']:prepareQuery(
    'UPDATE players SET last_seen = NOW() WHERE id = ?'
)

-- Update all online players efficiently
function UpdateOnlinePlayersLastSeen()
    local players = GetPlayers() -- FiveM native
    
    for _, playerSrc in ipairs(players) do
        local playerId = GetPlayerDatabaseId(playerSrc)
        
        -- Very fast execution thanks to prepared statement
        exports['ingenium.sql']:executePrepared(updateLastSeenQuery, {playerId})
    end
end

-- Run periodically
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(300000) -- Every 5 minutes
        UpdateOnlinePlayersLastSeen()
    end
end)
```

### Different Query Types

```lua
-- Prepare different query types
local selectQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM players WHERE id = ?'
)

local insertQuery = exports['ingenium.sql']:prepareQuery(
    'INSERT INTO logs (player_id, action, timestamp) VALUES (?, ?, NOW())'
)

local updateQuery = exports['ingenium.sql']:prepareQuery(
    'UPDATE players SET level = level + 1 WHERE id = ?'
)

-- Execute - returns vary by query type
local player = exports['ingenium.sql']:executePrepared(selectQuery, {1})
-- Returns: table with player data

local logId = exports['ingenium.sql']:executePrepared(insertQuery, {1, 'login'})
-- Returns: number (insert ID)

local affected = exports['ingenium.sql']:executePrepared(updateQuery, {1})
-- Returns: number (affected rows)
```

### Named Parameters

```lua
-- Prepare query with named parameters
local searchQuery = exports['ingenium.sql']:prepareQuery(
    'SELECT * FROM players WHERE level >= @minLevel AND zone = @zone LIMIT @limit'
)

-- Execute with named parameters
local players = exports['ingenium.sql']:executePrepared(searchQuery, {
    minLevel = 10,
    zone = 'downtown',
    limit = 50
})

print('Found ' .. #players .. ' players')
```

## Important Notes

- ⚠️ **Query ID must exist**: The queryId must be from a previous [`prepareQuery`](prepareQuery.md) call.
- ⚠️ **Always use parameterized queries** to prevent SQL injection.
- **Performance**: Much faster than direct query execution when called repeatedly.
- **Query type**: The function automatically detects the query type and returns the appropriate result.
- **Resource restart**: Prepared queries are lost on restart - reinitialize in your startup code.

## Error Handling

```lua
local result = exports['ingenium.sql']:executePrepared(queryId, params)

if result == nil then
    print('Query failed - invalid query ID or database error')
elseif type(result) == 'table' and #result == 0 then
    print('Query succeeded but returned no results')
else
    print('Query succeeded')
end
```

## Performance Benefits

- **Faster execution**: Query parsing is done once, not on every call
- **Optimized parameters**: Parameter binding is more efficient
- **Cached query plan**: Database optimizes and caches the execution plan
- **Reduced overhead**: Less processing on both FiveM and database side

## Related Functions

- [`prepareQuery`](prepareQuery.md) - Prepare a query for execution
- [`query`](query.md) - Execute a direct SELECT query
- [`insert`](insert.md) - Execute a direct INSERT query
- [`update`](update.md) - Execute a direct UPDATE/DELETE query

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.ExecutePrepared`)
