# exports['ingenium.sql']:getStats

Get performance statistics and metrics from the database connection pool.

## Description

The `getStats` function returns detailed performance statistics about query execution, including total queries, failed queries, average query time, and slowest query. This is useful for monitoring database performance and identifying bottlenecks.

## Signature

```lua
stats = exports['ingenium.sql']:getStats()
```

## Parameters

None

## Returns

**Type:** `table`

Returns a table with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `totalQueries` | number | Total number of queries executed since resource start |
| `failedQueries` | number | Number of queries that failed |
| `avgQueryTime` | number | Average query execution time in milliseconds |
| `slowestQuery` | number | Execution time of the slowest query in milliseconds |

Returns `nil` if the connection pool is not initialized.

## Example

### Basic Usage

```lua
-- Get current statistics
local stats = exports['ingenium.sql']:getStats()

if stats then
    print('=== Database Statistics ===')
    print('Total Queries: ' .. stats.totalQueries)
    print('Failed Queries: ' .. stats.failedQueries)
    print('Average Query Time: ' .. stats.avgQueryTime .. 'ms')
    print('Slowest Query: ' .. stats.slowestQuery .. 'ms')
else
    print('Database not initialized')
end
```

### Performance Monitoring Command

```lua
RegisterCommand('dbstats', function(source)
    if not exports['ingenium.sql']:isReady() then
        print('^1Database is not ready^7')
        return
    end
    
    local stats = exports['ingenium.sql']:getStats()
    
    print('^3=== ingenium.sql Performance Statistics ===^7')
    print('^2Total Queries:^7 ' .. stats.totalQueries)
    print('^2Failed Queries:^7 ' .. stats.failedQueries)
    
    -- Calculate success rate
    local successRate = 0
    if stats.totalQueries > 0 then
        successRate = ((stats.totalQueries - stats.failedQueries) / stats.totalQueries) * 100
    end
    print('^2Success Rate:^7 ' .. string.format('%.2f%%', successRate))
    
    -- Performance metrics
    print('^2Average Query Time:^7 ' .. string.format('%.2fms', stats.avgQueryTime))
    print('^2Slowest Query:^7 ' .. string.format('%.2fms', stats.slowestQuery))
    
    -- Warnings
    if stats.avgQueryTime > 50 then
        print('^3WARNING: Average query time is high, consider optimization^7')
    end
    
    if stats.slowestQuery > 500 then
        print('^3WARNING: Slow queries detected (>500ms), check indexes^7')
    end
    
    if stats.failedQueries > 0 then
        print('^1WARNING: ' .. stats.failedQueries .. ' queries have failed^7')
    end
end, true) -- Restricted
```

### Periodic Performance Logging

```lua
-- Log statistics every 10 minutes for monitoring
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(600000) -- 10 minutes
        
        if exports['ingenium.sql']:isReady() then
            local stats = exports['ingenium.sql']:getStats()
            
            print(string.format(
                '[DB Stats] Queries: %d | Failed: %d | Avg: %.2fms | Slowest: %.2fms',
                stats.totalQueries,
                stats.failedQueries,
                stats.avgQueryTime,
                stats.slowestQuery
            ))
        end
    end
end)
```

### Alert on Performance Issues

```lua
-- Monitor and alert on performance degradation
local lastAlertTime = 0
local ALERT_COOLDOWN = 300000 -- 5 minutes

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(60000) -- Check every minute
        
        if exports['ingenium.sql']:isReady() then
            local stats = exports['ingenium.sql']:getStats()
            local currentTime = GetGameTimer()
            
            -- Alert if average query time is too high
            if stats.avgQueryTime > 100 and (currentTime - lastAlertTime) > ALERT_COOLDOWN then
                print('^1[ALERT] Database performance degraded!^7')
                print('^1Average query time: ' .. stats.avgQueryTime .. 'ms^7')
                
                -- Notify admins
                TriggerClientEvent('notifyAdmins', -1, 'Database performance issue detected')
                
                lastAlertTime = currentTime
            end
            
            -- Alert on high failure rate
            local failureRate = stats.failedQueries / math.max(stats.totalQueries, 1)
            if failureRate > 0.05 then -- More than 5% failures
                print('^1[ALERT] High query failure rate: ' .. (failureRate * 100) .. '%^7')
            end
        end
    end
end)
```

### Statistics Dashboard

```lua
-- Create a statistics dashboard for admins
function GetDatabaseDashboard()
    if not exports['ingenium.sql']:isReady() then
        return {
            status = 'offline',
            message = 'Database connection not ready'
        }
    end
    
    local stats = exports['ingenium.sql']:getStats()
    
    -- Calculate metrics
    local successRate = 0
    if stats.totalQueries > 0 then
        successRate = ((stats.totalQueries - stats.failedQueries) / stats.totalQueries) * 100
    end
    
    -- Determine health status
    local health = 'healthy'
    if stats.avgQueryTime > 100 or stats.failedQueries > 10 then
        health = 'warning'
    end
    if stats.avgQueryTime > 200 or stats.failedQueries > 50 then
        health = 'critical'
    end
    
    return {
        status = 'online',
        health = health,
        metrics = {
            totalQueries = stats.totalQueries,
            failedQueries = stats.failedQueries,
            successRate = string.format('%.2f%%', successRate),
            avgQueryTime = string.format('%.2fms', stats.avgQueryTime),
            slowestQuery = string.format('%.2fms', stats.slowestQuery)
        },
        recommendations = GetRecommendations(stats)
    }
end

function GetRecommendations(stats)
    local recommendations = {}
    
    if stats.avgQueryTime > 50 then
        table.insert(recommendations, 'Consider adding database indexes on frequently queried columns')
    end
    
    if stats.slowestQuery > 500 then
        table.insert(recommendations, 'Slow queries detected - review query complexity and indexes')
    end
    
    if stats.failedQueries > 0 then
        table.insert(recommendations, 'Review server logs for query failures')
    end
    
    if stats.avgQueryTime < 20 and stats.failedQueries == 0 then
        table.insert(recommendations, 'Database performance is optimal')
    end
    
    return recommendations
end

-- Expose via callback or command
RegisterCommand('dbdashboard', function(source)
    local dashboard = GetDatabaseDashboard()
    TriggerClientEvent('showDatabaseDashboard', source, dashboard)
end)
```

### Compare Performance Over Time

```lua
-- Track statistics history
local statsHistory = {}

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(300000) -- Every 5 minutes
        
        if exports['ingenium.sql']:isReady() then
            local stats = exports['ingenium.sql']:getStats()
            
            table.insert(statsHistory, {
                timestamp = os.time(),
                avgQueryTime = stats.avgQueryTime,
                totalQueries = stats.totalQueries,
                failedQueries = stats.failedQueries
            })
            
            -- Keep only last 24 hours (288 samples at 5-minute intervals)
            if #statsHistory > 288 then
                table.remove(statsHistory, 1)
            end
        end
    end
end)

function GetPerformanceTrend()
    if #statsHistory < 2 then
        return 'insufficient_data'
    end
    
    local recent = statsHistory[#statsHistory].avgQueryTime
    local older = statsHistory[math.max(1, #statsHistory - 12)].avgQueryTime
    
    local change = ((recent - older) / older) * 100
    
    if change > 20 then
        return 'degrading'
    elseif change < -20 then
        return 'improving'
    else
        return 'stable'
    end
end
```

### Export Statistics via HTTP

```lua
-- Expose statistics for external monitoring tools
RegisterCommand('exportstats', function(source)
    local stats = exports['ingenium.sql']:getStats()
    
    if not stats then
        print('Database not ready')
        return
    end
    
    local json = json.encode({
        timestamp = os.time(),
        database = {
            status = 'online',
            totalQueries = stats.totalQueries,
            failedQueries = stats.failedQueries,
            avgQueryTime = stats.avgQueryTime,
            slowestQuery = stats.slowestQuery,
            successRate = stats.totalQueries > 0 and 
                ((stats.totalQueries - stats.failedQueries) / stats.totalQueries) * 100 or 0
        }
    })
    
    print('Stats JSON: ' .. json)
    -- Could send to external monitoring service
end, true)
```

## Important Notes

- Statistics are cumulative since the resource started.
- Statistics reset when the resource is restarted.
- Slow query threshold is 150ms (queries over this are logged as warnings).
- Use statistics to identify performance bottlenecks and optimize queries.
- Regular monitoring helps catch issues before they impact users.

## Performance Thresholds

**Good Performance:**
- Average query time: < 20ms
- Slowest query: < 100ms
- Failed queries: 0

**Acceptable Performance:**
- Average query time: 20-50ms
- Slowest query: 100-200ms
- Failed queries: < 1% of total

**Poor Performance (needs optimization):**
- Average query time: > 50ms
- Slowest query: > 200ms
- Failed queries: > 1% of total

## Related Functions

- [`isReady`](isReady.md) - Check if database is ready
- All query functions - Monitored by the statistics system

## Source

- Implemented in: `server.js` and `_pool.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.GetStats`)
