# exports['ingenium.sql']:isReady

Check if the database connection pool is ready to accept queries.

## Description

The `isReady` function checks whether the MySQL connection pool has been initialized and is ready to process database queries. It's important to verify the connection is ready before executing queries, especially during resource startup.

## Signature

```lua
ready = exports['ingenium.sql']:isReady()
```

## Parameters

None

## Returns

**Type:** `boolean`

- `true` if the connection pool is initialized and ready
- `false` if the connection pool is not ready or not initialized

## Example

### Basic Usage

```lua
-- Check if database is ready before querying
if exports['ingenium.sql']:isReady() then
    local users = exports['ingenium.sql']:query('SELECT * FROM users')
    print('Found ' .. #users .. ' users')
else
    print('Database not ready yet')
end
```

### Wait for Database on Resource Start

```lua
-- Wait for database to be ready before initializing
Citizen.CreateThread(function()
    print('Waiting for database connection...')
    
    while not exports['ingenium.sql']:isReady() do
        Citizen.Wait(100)
    end
    
    print('Database connected! Initializing resource...')
    
    -- Now safe to execute queries
    InitializeDatabase()
    LoadAllPlayers()
end)
```

### Safe Query Execution

```lua
-- Always check before critical operations
function SafeGetPlayer(playerId)
    if not exports['ingenium.sql']:isReady() then
        print('ERROR: Database not ready')
        return nil
    end
    
    local player = exports['ingenium.sql']:fetchSingle(
        'SELECT * FROM players WHERE id = ?',
        {playerId}
    )
    
    return player
end
```

### Resource Initialization Pattern

```lua
-- Resource initialization with database check
local DatabaseReady = false

Citizen.CreateThread(function()
    -- Wait for database
    while not exports['ingenium.sql']:isReady() do
        Citizen.Wait(500)
    end
    
    DatabaseReady = true
    print('^2[MyResource] Database ready^7')
    
    -- Initialize prepared queries
    InitializeQueries()
    
    -- Load configuration from database
    LoadConfig()
    
    -- Trigger ready event
    TriggerEvent('myresource:ready')
end)

-- Use the flag in other functions
RegisterNetEvent('playerJoining')
AddEventHandler('playerJoining', function()
    if not DatabaseReady then
        print('Database not ready - deferring player join')
        return
    end
    
    -- Process player join
    LoadPlayerData(source)
end)
```

### Command with Database Check

```lua
RegisterCommand('balance', function(source)
    -- Verify database is ready before processing command
    if not exports['ingenium.sql']:isReady() then
        TriggerClientEvent('showNotification', source, 'Database unavailable, try again later')
        return
    end
    
    local playerId = GetPlayerDatabaseId(source)
    local balance = exports['ingenium.sql']:fetchScalar(
        'SELECT balance FROM accounts WHERE player_id = ?',
        {playerId}
    )
    
    if balance then
        TriggerClientEvent('showBalance', source, balance)
    end
end)
```

### Retry Logic

```lua
-- Retry a query if database is temporarily unavailable
function QueryWithRetry(query, params, maxRetries)
    maxRetries = maxRetries or 3
    
    for attempt = 1, maxRetries do
        if exports['ingenium.sql']:isReady() then
            local result = exports['ingenium.sql']:query(query, params)
            return result
        end
        
        print('Database not ready, attempt ' .. attempt .. '/' .. maxRetries)
        Citizen.Wait(1000) -- Wait 1 second before retry
    end
    
    print('ERROR: Database unavailable after ' .. maxRetries .. ' attempts')
    return nil
end
```

### Exponential Backoff Wait Pattern

```lua
-- Wait for database with exponential backoff (more efficient)
function WaitForDatabase(timeout)
    timeout = timeout or 30000 -- 30 seconds default
    local waited = 0
    local interval = 50
    local maxInterval = 1000
    
    while not exports['ingenium.sql']:isReady() and waited < timeout do
        Citizen.Wait(interval)
        waited = waited + interval
        
        -- Exponential backoff
        interval = math.min(interval * 2, maxInterval)
    end
    
    return exports['ingenium.sql']:isReady()
end

-- Usage
Citizen.CreateThread(function()
    if WaitForDatabase(30000) then
        print('Database ready')
        InitializeResource()
    else
        print('ERROR: Database connection timeout')
    end
end)
```

### Health Check Endpoint

```lua
-- Expose database status for monitoring
RegisterCommand('dbstatus', function(source)
    local isReady = exports['ingenium.sql']:isReady()
    
    if isReady then
        local stats = exports['ingenium.sql']:getStats()
        print('Database Status: ^2ONLINE^7')
        print('Total Queries: ' .. stats.totalQueries)
        print('Failed Queries: ' .. stats.failedQueries)
        print('Avg Query Time: ' .. stats.avgQueryTime .. 'ms')
    else
        print('Database Status: ^1OFFLINE^7')
    end
end, true) -- Restricted to console/admin
```

### Graceful Degradation

```lua
-- Provide fallback behavior when database is unavailable
function GetPlayerData(playerId)
    if not exports['ingenium.sql']:isReady() then
        print('WARN: Database unavailable, using cached data')
        return GetCachedPlayerData(playerId) -- Fallback to cache
    end
    
    local player = exports['ingenium.sql']:fetchSingle(
        'SELECT * FROM players WHERE id = ?',
        {playerId}
    )
    
    if player then
        CachePlayerData(playerId, player) -- Update cache
    end
    
    return player
end
```

## Important Notes

- ⚠️ **Always check on resource start**: Database may not be ready immediately.
- ⚠️ **Check before critical operations**: Prevents errors when database is unavailable.
- The function is fast and lightweight - safe to call frequently.
- Connection can be lost temporarily - consider retry logic for critical operations.
- Use with [`AwaitReady`](#ingenium-framework-integration) in the `ig.sql` namespace for automatic waiting.

## Ingenium Framework Integration

When using the `ig.sql` namespace (via `_handler.lua`), an `AwaitReady` helper is available:

```lua
-- Automatically waits for database with timeout
if ig.sql.AwaitReady(30000) then
    print('Database ready')
else
    print('Database connection timeout')
end
```

## Related Functions

- [`getStats`](getStats.md) - Get connection pool statistics
- All query functions - Should only be called when `isReady()` returns `true`

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.IsReady` and `ig.sql.AwaitReady`)
