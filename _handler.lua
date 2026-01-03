-- ====================================================================================--
-- SQL Handler - Lua Wrapper Interface
-- Provides Lua access to JavaScript MySQL2 query execution engine
-- ====================================================================================--

if not c.sql then c.sql = {} end

-- ====================================================================================--
-- Core Query Functions
-- ====================================================================================--

--- Execute a SELECT query that returns multiple rows
---@param query string SQL query with ? placeholders or @named parameters
---@param parameters table|nil Query parameters (array for ? or table for @named)
---@param callback function|nil Optional callback(results)
---@return table Results array
function c.sql.Query(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    -- Handle case where parameters is actually the callback
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ig.sql']:query(query, params, cb)
end

--- Execute a SELECT query that returns a single row
---@param query string SQL query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(result)
---@return table|nil Single row result
function c.sql.FetchSingle(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ig.sql']:fetchSingle(query, params, cb)
end

--- Execute a SELECT query that returns a single value
---@param query string SQL query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(value)
---@return any Single scalar value
function c.sql.FetchScalar(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ig.sql']:fetchScalar(query, params, cb)
end

--- Execute an INSERT query
---@param query string SQL INSERT query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(insertId)
---@return number Insert ID
function c.sql.Insert(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ig.sql']:insert(query, params, cb)
end

--- Execute an UPDATE or DELETE query
---@param query string SQL UPDATE/DELETE query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(affectedRows)
---@return number Affected rows count
function c.sql.Update(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ig.sql']:update(query, params, cb)
end

--- Execute multiple queries in a transaction
---@param queries table Array of {query, parameters} objects
---@param callback function|nil Optional callback(success, results)
---@return table {success, results}
function c.sql.Transaction(queries, callback)
    return exports['ig.sql']:transaction(queries, callback)
end

--- Execute multiple queries as a batch (without transaction)
---@param queries table Array of {query, parameters} objects
---@param callback function|nil Optional callback(results)
---@return table Results array
function c.sql.Batch(queries, callback)
    return exports['ig.sql']:batch(queries, callback)
end

-- ====================================================================================--
-- Prepared Statements (for compatibility with MySQL.Async.store pattern)
-- ====================================================================================--

--- Prepare a query for later execution (returns query ID)
---@param query string SQL query to prepare
---@return string Query ID
function c.sql.PrepareQuery(query)
    return exports['ig.sql']:prepareQuery(query)
end

--- Execute a prepared query
---@param queryId string Query ID from PrepareQuery
---@param parameters table Query parameters
---@param callback function|nil Optional callback(affectedRows)
---@return number Affected rows
function c.sql.ExecutePrepared(queryId, parameters, callback)
    return exports['ig.sql']:executePrepared(queryId, parameters, callback)
end

-- ====================================================================================--
-- Utility Functions
-- ====================================================================================--

--- Check if SQL connection is ready
---@return boolean True if ready
function c.sql.IsReady()
    return exports['ig.sql']:isReady()
end

--- Wait for SQL connection to be ready
---@param timeout number|nil Timeout in milliseconds (default 30000)
---@return boolean True if ready, false if timeout
function c.sql.AwaitReady(timeout)
    local maxWait = timeout or 30000
    local waited = 0
    local interval = 100
    
    while not c.sql.IsReady() and waited < maxWait do
        Citizen.Wait(interval)
        waited = waited + interval
    end
    
    return c.sql.IsReady()
end

--- Get SQL performance statistics
---@return table Statistics object
function c.sql.GetStats()
    return exports['ig.sql']:getStats()
end

-- ====================================================================================--
-- Initialization
-- ====================================================================================--

Citizen.CreateThread(function()
    print("^2[SQL Handler] Lua wrapper interface loaded^7")
    
    -- Wait for SQL to be ready
    if c.sql.AwaitReady() then
        print("^2[SQL Handler] Connection ready^7")
    else
        print("^1[SQL Handler] Connection timeout - check your MySQL configuration^7")
    end
end)

-- ====================================================================================--
-- Events
-- ====================================================================================--

-- SQL ready event
AddEventHandler('ig:sql:ready', function()
    print("^2[SQL Handler] Database connection established^7")
end)

-- Slow query logging
AddEventHandler('ig:sql:slowQuery', function(data)
    print(string.format("^3[SQL WARNING] Slow query detected: %.2fms^7", data.duration))
    if conf and conf.debug then
        print(string.format("^3[SQL] Query: %s^7", data.query))
    end
end)
