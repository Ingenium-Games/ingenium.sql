-- ====================================================================================--
-- SQL Handler - Lua Wrapper Interface
-- Provides Lua access to JavaScript MySQL2 query execution engine
-- ====================================================================================--

if not ig then ig = {} end
if not ig.sql then ig.sql = {} end

-- ====================================================================================--
-- Core Query Functions
-- ====================================================================================--

--- Execute a SELECT query that returns multiple rows
---@param query string SQL query with ? placeholders or @named parameters
---@param parameters table|nil Query parameters (array for ? or table for @named)
---@param callback function|nil Optional callback(results)
---@return table Results array
function ig.sql.Query(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    -- Handle case where parameters is actually the callback
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ingenium.sql']:query(query, params, cb)
end

--- Execute a SELECT query that returns a single row
---@param query string SQL query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(result)
---@return table|nil Single row result
function ig.sql.FetchSingle(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ingenium.sql']:fetchSingle(query, params, cb)
end

--- Execute a SELECT query that returns a single value
---@param query string SQL query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(value)
---@return any Single scalar value
function ig.sql.FetchScalar(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ingenium.sql']:fetchScalar(query, params, cb)
end

--- Execute an INSERT query
---@param query string SQL INSERT query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(insertId)
---@return number Insert ID
function ig.sql.Insert(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ingenium.sql']:insert(query, params, cb)
end

--- Execute an UPDATE or DELETE query
---@param query string SQL UPDATE/DELETE query
---@param parameters table|nil Query parameters
---@param callback function|nil Optional callback(affectedRows)
---@return number Affected rows count
function ig.sql.Update(query, parameters, callback)
    local params = parameters or {}
    local cb = callback
    
    if type(parameters) == 'function' and callback == nil then
        cb = parameters
        params = {}
    end
    
    return exports['ingenium.sql']:update(query, params, cb)
end

--- Execute multiple queries in a transaction
---@param queries table Array of {query, parameters} objects
---@param callback function|nil Optional callback(success, results)
---@return table {success, results}
function ig.sql.Transaction(queries, callback)
    return exports['ingenium.sql']:transaction(queries, callback)
end

--- Execute multiple queries as a batch (without transaction)
---@param queries table Array of {query, parameters} objects
---@param callback function|nil Optional callback(results)
---@return table Results array
function ig.sql.Batch(queries, callback)
    return exports['ingenium.sql']:batch(queries, callback)
end

-- ====================================================================================--
-- Prepared Statements (for compatibility with MySQL.Async.store pattern)
-- ====================================================================================--

--- Prepare a query for later execution (returns query ID)
---@param query string SQL query to prepare
---@return string Query ID
function ig.sql.PrepareQuery(query)
    return exports['ingenium.sql']:prepareQuery(query)
end

--- Execute a prepared query
---@param queryId string Query ID from PrepareQuery
---@param parameters table Query parameters
---@param callback function|nil Optional callback(affectedRows)
---@return number Affected rows
function ig.sql.ExecutePrepared(queryId, parameters, callback)
    return exports['ingenium.sql']:executePrepared(queryId, parameters, callback)
end

-- ====================================================================================--
-- Utility Functions
-- ====================================================================================--

--- Check if SQL connection is ready
---@return boolean True if ready
function ig.sql.IsReady()
    return exports['ingenium.sql']:isReady()
end

--- Wait for SQL connection to be ready (OPTIMIZED with exponential backoff)
---@param timeout number|nil Timeout in milliseconds (default 30000)
---@return boolean True if ready, false if timeout
function ig.sql.AwaitReady(timeout)
    local maxWait = timeout or 30000
    local waited = 0
    local interval = 50  -- Start with shorter interval
    local maxInterval = 500  -- Cap the maximum wait interval
    
    while not ig.sql.IsReady() and waited < maxWait do
        Citizen.Wait(interval)
        waited = waited + interval
        
        -- Exponential backoff: double the interval up to maxInterval
        -- This reduces CPU usage while still being responsive initially
        if interval < maxInterval then
            interval = math.min(interval * 2, maxInterval)
        end
    end
    
    return ig.sql.IsReady()
end

--- Get SQL performance statistics
---@return table Statistics object
function ig.sql.GetStats()
    return exports['ingenium.sql']:getStats()
end

-- ====================================================================================--
-- Initialization
-- ====================================================================================--

Citizen.CreateThread(function()
    ig.log.Info("SQL Handler", "Lua wrapper interface loaded")
    
    -- Wait for SQL to be ready
    if ig.sql.AwaitReady() then
        ig.log.Info("SQL Handler", "Connection ready")
    else
        ig.log.Error("SQL Handler", "Connection timeout - check your MySQL configuration")
    end
end)

-- ====================================================================================--
-- Events
-- ====================================================================================--

-- SQL ready event
AddEventHandler('ingenium.sql:Ready', function()
    ig.log.Info("SQL Handler", "Database connection established")
end)

-- Slow query logging
AddEventHandler('ingenium.sql:SlowQuery', function(data)
    ig.log.Warn("SQL", "Slow query detected: %.2fms", data.duration)
    ig.log.Debug("SQL", "Query: %s", data.query)
end)
