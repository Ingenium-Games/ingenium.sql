/**
 * ====================================================================================
 * ingenium.sql - MySQL Query Implementation
 * Main server-side implementation using mysql2 connection pool
 * Based on oxmysql architecture adapted for ingenium framework
 * ====================================================================================
 */

// Reference the pool from global scope (created by _pool.js)
// In FiveM, server_scripts share the same global scope

// Prepared queries storage
let preparedQueries = new Map();
let queryIdCounter = 0;

// Cache for compiled regex patterns (performance optimization)
const regexCache = new Map();

/**
 * Initialize message
 */
setImmediate(() => {
    console.log('^2[ig.sql] Query handler initialized^7');
});

/**
 * Get or create a cached regex pattern for a parameter name
 * @param {string} paramName - The parameter name (e.g., "@name")
 * @returns {RegExp} Cached or newly created regex pattern (non-global for replace)
 */
function getCachedRegex(paramName) {
    if (!regexCache.has(paramName)) {
        const escaped = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use non-global regex since replace() replaces all occurrences anyway
        // and global regex maintains state between calls
        regexCache.set(paramName, new RegExp(escaped, 'g'));
    }
    return regexCache.get(paramName);
}

/**
 * Helper function to process parameters (OPTIMIZED)
 * Converts named parameters (@param) to positional (?) and returns array
 */
function processParameters(query, parameters) {
    if (!parameters || typeof parameters !== 'object') {
        return { query, params: [] };
    }

    // If parameters is an array, it's already positional
    if (Array.isArray(parameters)) {
        return { query, params: parameters };
    }

    // Quick check: if no @ symbol, return early
    if (query.indexOf('@') === -1) {
        return { query, params: [] };
    }

    // Convert named parameters to positional
    const params = [];
    let processedQuery = query;
    
    // Find all unique @paramName in query and replace with ?
    const paramNames = query.match(/@\w+/g);
    if (paramNames) {
        // Use a Set to track unique parameter names for efficiency
        const seen = new Set();
        
        for (const paramName of paramNames) {
            // Skip if already processed
            if (seen.has(paramName)) continue;
            seen.add(paramName);
            
            const key = paramName.substring(1); // Remove @
            
            // Skip if parameter value not provided
            if (!parameters.hasOwnProperty(key)) continue;
            
            // Get cached regex pattern
            const regex = getCachedRegex(paramName);
            
            // Count occurrences - match() doesn't modify lastIndex but we create 
            // a fresh match each time to avoid any state issues
            const matches = processedQuery.match(regex);
            const count = matches ? matches.length : 0;
            
            // Add the parameter value for each occurrence
            for (let i = 0; i < count; i++) {
                params.push(parameters[key]);
            }
            
            // Replace all occurrences with ? (replace with 'g' flag replaces all)
            processedQuery = processedQuery.replace(regex, '?');
        }
    }

    return { query: processedQuery, params };
}

/**
 * Helper function to execute callback if provided
 * @param {*} result - The result to return
 * @param {Function} callback - Optional callback function
 * @returns {*} The result
 */
function executeCallback(result, callback) {
    if (callback && typeof callback === 'function') {
        callback(result);
    }
    return result;
}

/**
 * Helper function to wrap query execution with pool readiness check and error handling
 * @param {Function} asyncFn - The async function to execute
 * @param {string} errorContext - Context string for error messages
 * @param {*} defaultReturn - Default value to return on error
 * @param {Function} callback - Optional callback function
 * @returns {Promise<*>} Result or default value
 */
async function withPoolCheck(asyncFn, errorContext, defaultReturn, callback) {
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }
        const result = await asyncFn();
        return executeCallback(result, callback);
    } catch (error) {
        console.error(`^1[ig.sql ERROR] ${errorContext}: ${error.message}^7`);
        return executeCallback(defaultReturn, callback);
    }
}

/**
 * Execute a SELECT query that returns multiple rows
 */
async function query(query, parameters, callback) {
    return withPoolCheck(
        async () => {
            const { query: processedQuery, params } = processParameters(query, parameters);
            return await global.pool.execute(processedQuery, params);
        },
        'Query failed',
        [],
        callback
    );
}

/**
 * Execute a SELECT query that returns a single row
 */
async function fetchSingle(query, parameters, callback) {
    return withPoolCheck(
        async () => {
            const { query: processedQuery, params } = processParameters(query, parameters);
            const results = await global.pool.execute(processedQuery, params);
            return results.length > 0 ? results[0] : null;
        },
        'FetchSingle failed',
        null,
        callback
    );
}

/**
 * Execute a SELECT query that returns a single value (scalar)
 */
async function fetchScalar(query, parameters, callback) {
    return withPoolCheck(
        async () => {
            const { query: processedQuery, params } = processParameters(query, parameters);
            const results = await global.pool.execute(processedQuery, params);
            
            let value = null;
            if (results.length > 0) {
                const firstRow = results[0];
                const firstKey = Object.keys(firstRow)[0];
                value = firstRow[firstKey];
            }
            return value;
        },
        'FetchScalar failed',
        null,
        callback
    );
}

/**
 * Execute an INSERT query and return the insert ID
 */
async function insert(query, parameters, callback) {
    return withPoolCheck(
        async () => {
            const { query: processedQuery, params } = processParameters(query, parameters);
            const results = await global.pool.execute(processedQuery, params);
            return results.insertId || 0;
        },
        'Insert failed',
        0,
        callback
    );
}

/**
 * Execute an UPDATE or DELETE query and return affected rows
 */
async function update(query, parameters, callback) {
    return withPoolCheck(
        async () => {
            const { query: processedQuery, params } = processParameters(query, parameters);
            const results = await global.pool.execute(processedQuery, params);
            return results.affectedRows || 0;
        },
        'Update failed',
        0,
        callback
    );
}

/**
 * Execute multiple queries in a transaction
 */
async function transaction(queries, callback) {
    let connection = null;
    
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        connection = await global.pool.getConnection();
        await connection.beginTransaction();

        const results = [];

        for (const queryData of queries) {
            const { query: processedQuery, params } = processParameters(
                queryData.query || queryData[0],
                queryData.parameters || queryData[1] || []
            );

            const [result] = await connection.execute(processedQuery, params);
            results.push(result);
        }

        await connection.commit();

        if (callback && typeof callback === 'function') {
            callback(true, results);
        }

        return { success: true, results };
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(`^1[ig.sql ERROR] Transaction failed: ${error.message}^7`);
        
        if (callback && typeof callback === 'function') {
            callback(false, []);
        }

        return { success: false, results: [] };
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Execute multiple queries as a batch (without transaction)
 */
async function batch(queries, callback) {
    return withPoolCheck(
        async () => {
            const results = [];
            for (const queryData of queries) {
                const { query: processedQuery, params } = processParameters(
                    queryData.query || queryData[0],
                    queryData.parameters || queryData[1] || []
                );
                const result = await global.pool.execute(processedQuery, params);
                results.push(result);
            }
            return results;
        },
        'Batch failed',
        [],
        callback
    );
}

// Cache for query type detection (performance optimization)
const queryTypeCache = new Map();
const QUERY_TYPE_CACHE_MAX_SIZE = 1000; // Increased limit for better caching

/**
 * Normalize query for caching by removing parameter values
 * This allows caching based on query pattern rather than exact query text
 * @param {string} sqlQuery - The SQL query string
 * @returns {string} Normalized query pattern
 */
function normalizeQueryForCache(sqlQuery) {
    // Extract just the first 100 characters to create a pattern key
    // This balances memory usage with cache effectiveness
    return sqlQuery.substring(0, 100).trim();
}

/**
 * Detect SQL query type from query string (OPTIMIZED with caching)
 * @param {string} sqlQuery - The SQL query string
 * @returns {string} Query type (SELECT, INSERT, UPDATE, DELETE, or empty string)
 */
function detectQueryType(sqlQuery) {
    // Create a normalized cache key to handle queries with different parameters
    const cacheKey = normalizeQueryForCache(sqlQuery);
    
    // For very common queries, check cache first
    if (queryTypeCache.has(cacheKey)) {
        return queryTypeCache.get(cacheKey);
    }
    
    // Extract first SQL keyword more robustly (handles leading whitespace and comments)
    const match = sqlQuery.match(/^\s*(\w+)/i);
    const queryType = match ? match[1].toUpperCase() : '';
    
    // Cache the result (with size limit to prevent unbounded growth)
    if (queryTypeCache.size < QUERY_TYPE_CACHE_MAX_SIZE) {
        queryTypeCache.set(cacheKey, queryType);
    }
    
    return queryType;
}

/**
 * Prepare a query for later execution
 * Returns a query ID that can be used with executePrepared
 */
function prepareQuery(query) {
    try {
        const queryId = `prepared_${++queryIdCounter}`;
        preparedQueries.set(queryId, query);
        return queryId;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] PrepareQuery failed: ${error.message}^7`);
        return null;
    }
}

/**
 * Execute a prepared query
 */
async function executePrepared(queryId, parameters, callback) {
    try {
        if (!preparedQueries.has(queryId)) {
            throw new Error(`Prepared query not found: ${queryId}`);
        }
        const storedQuery = preparedQueries.get(queryId);
        return await execute(storedQuery, parameters, callback);
    } catch (error) {
        console.error(`^1[ig.sql ERROR] ExecutePrepared failed: ${error.message}^7`);
        return executeCallback(null, callback);
    }
}

/**
 * Execute function - compatibility wrapper for oxmysql and mysql-async
 * Automatically routes to the appropriate function based on query type
 * Note: Callbacks are handled by this function's withPoolCheck wrapper, not passed
 * to the underlying query functions, to avoid double-callback invocation.
 */
async function execute(sqlQuery, parameters, callback) {
    return withPoolCheck(
        async () => {
            const queryType = detectQueryType(sqlQuery);
            
            switch (queryType) {
                case 'SELECT':
                    // Call without callback - result will bubble up to our withPoolCheck
                    return await query(sqlQuery, parameters);
                case 'INSERT':
                    return await insert(sqlQuery, parameters);
                case 'UPDATE':
                case 'DELETE':
                    return await update(sqlQuery, parameters);
                default:
                    console.warn(`^3[ig.sql WARNING] Unknown query type '${queryType}', defaulting to query handler^7`);
                    return await query(sqlQuery, parameters);
            }
        },
        'Execute failed',
        null,
        callback
    );
}

// ====================================================================================
// Export all functions for use by other resources
// ====================================================================================

// Primary exports (ingenium.sql native API)
global.exports('query', query);
global.exports('fetchSingle', fetchSingle);
global.exports('fetchScalar', fetchScalar);
global.exports('insert', insert);
global.exports('update', update);
global.exports('transaction', transaction);
global.exports('batch', batch);
global.exports('prepareQuery', prepareQuery);
global.exports('executePrepared', executePrepared);
global.exports('isReady', () => global.pool ? global.pool.ready() : false);
global.exports('getStats', () => global.pool ? global.pool.getStats() : null);

// ====================================================================================
// Compatibility exports for oxmysql and mysql-async
// ====================================================================================
global.exports('single', fetchSingle);        // oxmysql: single = fetchSingle
global.exports('scalar', fetchScalar);        // oxmysql: scalar = fetchScalar
global.exports('prepare', prepareQuery);      // oxmysql: prepare = prepareQuery
global.exports('execute', execute);           // oxmysql/mysql-async: smart execute function
global.exports('fetchAll', query);            // mysql-async: fetchAll = query

console.log('^2[ig.sql] Server exports registered (with oxmysql/mysql-async compatibility)^7');

// ====================================================================================
// Test Command - Check SQL Connection
// ====================================================================================

/**
 * Register /sqlcheck command to test database connection
 * Checks if the 'db' database exists
 */
RegisterCommand('sqlcheck', async (source, args, rawCommand) => {
    try {
        const playerId = source;
        
        // Check if pool is ready
        if (!global.pool || !global.pool.ready()) {
            const message = '^1[SQL Check] Database connection pool is not ready^7';
            console.log(message);
            if (playerId > 0) {
                emitNet('chat:addMessage', playerId, {
                    color: [255, 0, 0],
                    multiline: true,
                    args: ['SQL Check', 'Database connection pool is not ready']
                });
            }
            return;
        }

        // Test query to check if database 'db' exists
        const testQuery = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'db'";
        
        console.log('^3[SQL Check] Testing database connection...^7');
        
        const result = await query(testQuery, []);
        
        if (result && result.length > 0) {
            const successMessage = `^2[SQL Check] SUCCESS: Database 'db' exists and is accessible^7`;
            console.log(successMessage);
            console.log(`^2[SQL Check] Pool Stats: ${JSON.stringify(global.pool.getStats())}^7`);
            
            if (playerId > 0) {
                emitNet('chat:addMessage', playerId, {
                    color: [0, 255, 0],
                    multiline: true,
                    args: ['SQL Check', `✓ SUCCESS: Database 'db' exists and is accessible`]
                });
            }
        } else {
            const notFoundMessage = `^3[SQL Check] WARNING: Database 'db' does not exist^7`;
            console.log(notFoundMessage);
            
            if (playerId > 0) {
                emitNet('chat:addMessage', playerId, {
                    color: [255, 165, 0],
                    multiline: true,
                    args: ['SQL Check', `⚠ WARNING: Database 'db' does not exist`]
                });
            }
        }
    } catch (error) {
        const errorMessage = `^1[SQL Check] ERROR: ${error.message}^7`;
        console.error(errorMessage);
        
        if (source > 0) {
            emitNet('chat:addMessage', source, {
                color: [255, 0, 0],
                multiline: true,
                args: ['SQL Check', `✗ ERROR: ${error.message}`]
            });
        }
    }
}, false); // false = can be run by anyone (not restricted to admins)

console.log('^2[ingenium.sql] /sqlcheck command registered^7');
