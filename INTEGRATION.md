# Integration Guide for Ingenium Framework

This guide explains how to integrate `ingenium.sql` with the main Ingenium framework resource.

## For Ingenium Core Resource

The `_handler.lua` file provides a Lua wrapper that can be included in the main `ingenium` resource to provide convenient access to SQL functions through the `ig.sql` namespace.

### Option 1: Direct Integration (Copy File)

1. Copy `_handler.lua` from this resource to your main ingenium resource
2. Add it to the ingenium resource's `fxmanifest.lua`:
   ```lua
   server_scripts {
       -- ... other scripts
       'path/to/_handler.lua',
       -- ... other scripts
   }
   ```
3. Ensure `ingenium.sql` is started BEFORE the ingenium resource:
   ```cfg
   ensure ingenium.sql
   ensure ingenium
   ```

### Option 2: Export-based Integration (No Copy Needed)

Instead of copying `_handler.lua`, you can create a similar wrapper directly in your ingenium resource:

```lua
-- In your ingenium resource's server-side Lua file
if not ig.sql then ig.sql = {} end

function ig.sql.Query(query, parameters, callback)
    return exports['ingenium.sql']:query(query, parameters or {}, callback)
end

function ig.sql.FetchSingle(query, parameters, callback)
    return exports['ingenium.sql']:fetchSingle(query, parameters or {}, callback)
end

function ig.sql.FetchScalar(query, parameters, callback)
    return exports['ingenium.sql']:fetchScalar(query, parameters or {}, callback)
end

function ig.sql.Insert(query, parameters, callback)
    return exports['ingenium.sql']:insert(query, parameters or {}, callback)
end

function ig.sql.Update(query, parameters, callback)
    return exports['ingenium.sql']:update(query, parameters or {}, callback)
end

function ig.sql.Transaction(queries, callback)
    return exports['ingenium.sql']:transaction(queries, callback)
end

function ig.sql.Batch(queries, callback)
    return exports['ingenium.sql']:batch(queries, callback)
end

function ig.sql.IsReady()
    return exports['ingenium.sql']:isReady()
end

function ig.sql.AwaitReady(timeout)
    local maxWait = timeout or 30000
    local waited = 0
    local interval = 100
    
    while not ig.sql.IsReady() and waited < maxWait do
        Citizen.Wait(interval)
        waited = waited + interval
    end
    
    return ig.sql.IsReady()
end

-- Wait for SQL to be ready
Citizen.CreateThread(function()
    if ig.sql.AwaitReady() then
        print("^2[Ingenium] SQL connection ready^7")
    else
        print("^1[Ingenium] SQL connection timeout^7")
    end
end)
```

## Usage in Ingenium Resources

Once integrated, you can use SQL functions through the `ig.sql` namespace:

```lua
-- Query multiple rows
local users = ig.sql.Query('SELECT * FROM users WHERE active = ?', {1})

-- Get single row
local user = ig.sql.FetchSingle('SELECT * FROM users WHERE id = ?', {userId})

-- Get single value
local count = ig.sql.FetchScalar('SELECT COUNT(*) FROM users')

-- Insert
local insertId = ig.sql.Insert('INSERT INTO logs (message) VALUES (?)', {'User logged in'})

-- Update
local affected = ig.sql.Update('UPDATE users SET last_login = NOW() WHERE id = ?', {userId})

-- Transaction
local result = ig.sql.Transaction({
    {query = 'UPDATE accounts SET balance = balance - ? WHERE id = ?', parameters = {100, fromAccount}},
    {query = 'UPDATE accounts SET balance = balance + ? WHERE id = ?', parameters = {100, toAccount}}
})

-- Named parameters
local user = ig.sql.FetchSingle(
    'SELECT * FROM users WHERE name = @name AND age > @age',
    {name = 'John', age = 18}
)

-- With callbacks
ig.sql.Query('SELECT * FROM users', {}, function(results)
    for _, user in ipairs(results) do
        print(user.name)
    end
end)
```

## Direct Export Usage (Without ig.sql wrapper)

Any resource can also use `ingenium.sql` directly without the wrapper:

```lua
-- In any FiveM resource
local users = exports['ingenium.sql']:query('SELECT * FROM users')
local user = exports['ingenium.sql']:fetchSingle('SELECT * FROM users WHERE id = ?', {1})
```

## Migration from Internal Implementation

If you previously had an internalized SQL implementation in the ingenium resource:

1. Remove the old SQL files from ingenium resource
2. Remove mysql2 from ingenium's package.json dependencies
3. Add `ingenium.sql` as a separate resource
4. Update your server.cfg to start `ingenium.sql` before `ingenium`
5. Update any direct SQL calls to use the new export pattern
6. Test all SQL operations to ensure they work correctly

## Troubleshooting

### "Connection pool is not ready" Error

This happens when trying to execute queries before the pool is initialized. Solutions:

1. Use `ig.sql.AwaitReady()` before making queries
2. Ensure `ingenium.sql` is started before your resource
3. Add a dependency in your resource's fxmanifest.lua:
   ```lua
   dependency 'ingenium.sql'
   ```

### Resource Load Order

The correct order in server.cfg:
```cfg
# Database resource MUST be started first
ensure ingenium.sql

# Then your other resources that depend on it
ensure ingenium
ensure ig.bank
# ... other resources
```

### Performance Issues

If you experience slow queries:
1. Check `exports['ingenium.sql']:getStats()` for performance metrics
2. Increase `mysql_connection_limit` if you have many concurrent queries
3. Add database indexes to frequently queried columns
4. Use batch operations instead of multiple individual queries

## Benefits of External Resource

The external `ingenium.sql` resource provides several advantages over the internalized version:

1. **Separation of Concerns**: Database logic is isolated from game logic
2. **Reusability**: Other resources can use `ingenium.sql` without depending on ingenium
3. **Easier Updates**: Update database connector without touching main resource
4. **Better Connection Management**: Dedicated resource for connection pooling
5. **Independent Testing**: Can test database operations separately
6. **Reduced Resource Size**: Main ingenium resource is smaller without SQL code

## Next Steps

After integrating `ingenium.sql`:

1. Test all existing SQL queries to ensure they work
2. Monitor performance and connection stability
3. Update documentation for other developers
4. Consider creating database migration scripts if needed
5. Review and optimize slow queries
