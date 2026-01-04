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

/**
 * Initialize message
 */
setImmediate(() => {
    console.log('^2[ig.sql] Query handler initialized^7');
});

/**
 * Helper function to process parameters
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

    // Convert named parameters to positional
    const params = [];
    let processedQuery = query;
    
    // Find all unique @paramName in query and replace with ?
    const paramNames = query.match(/@\w+/g);
    if (paramNames) {
        // Process each unique parameter name
        const processedParams = new Set();
        
        paramNames.forEach(paramName => {
            const key = paramName.substring(1); // Remove @
            
            // Only process each parameter name once
            if (!processedParams.has(paramName) && parameters.hasOwnProperty(key)) {
                // Replace all occurrences of this parameter
                const regex = new RegExp(paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const count = (processedQuery.match(regex) || []).length;
                
                // Add the parameter value for each occurrence
                for (let i = 0; i < count; i++) {
                    params.push(parameters[key]);
                }
                
                // Replace all occurrences with ?
                processedQuery = processedQuery.replace(regex, '?');
                processedParams.add(paramName);
            }
        });
    }

    return { query: processedQuery, params };
}

/**
 * Execute a SELECT query that returns multiple rows
 */
async function query(query, parameters, callback) {
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await global.pool.execute(processedQuery, params);

        if (callback && typeof callback === 'function') {
            callback(results);
        }

        return results;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] Query failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback([]);
        }
        return [];
    }
}

/**
 * Execute a SELECT query that returns a single row
 */
async function fetchSingle(query, parameters, callback) {
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await global.pool.execute(processedQuery, params);

        const result = results.length > 0 ? results[0] : null;

        if (callback && typeof callback === 'function') {
            callback(result);
        }

        return result;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] FetchSingle failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback(null);
        }
        return null;
    }
}

/**
 * Execute a SELECT query that returns a single value (scalar)
 */
async function fetchScalar(query, parameters, callback) {
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await global.pool.execute(processedQuery, params);

        let value = null;
        if (results.length > 0) {
            const firstRow = results[0];
            // Get the first value from the first row
            const firstKey = Object.keys(firstRow)[0];
            value = firstRow[firstKey];
        }

        if (callback && typeof callback === 'function') {
            callback(value);
        }

        return value;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] FetchScalar failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback(null);
        }
        return null;
    }
}

/**
 * Execute an INSERT query and return the insert ID
 */
async function insert(query, parameters, callback) {
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await global.pool.execute(processedQuery, params);

        // For INSERT queries, mysql2 returns an object with insertId
        const insertId = results.insertId || 0;

        if (callback && typeof callback === 'function') {
            callback(insertId);
        }

        return insertId;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] Insert failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback(0);
        }
        return 0;
    }
}

/**
 * Execute an UPDATE or DELETE query and return affected rows
 */
async function update(query, parameters, callback) {
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await global.pool.execute(processedQuery, params);

        // For UPDATE/DELETE queries, mysql2 returns an object with affectedRows
        const affectedRows = results.affectedRows || 0;

        if (callback && typeof callback === 'function') {
            callback(affectedRows);
        }

        return affectedRows;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] Update failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback(0);
        }
        return 0;
    }
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
    try {
        if (!global.pool || !global.pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const results = [];

        for (const queryData of queries) {
            const { query: processedQuery, params } = processParameters(
                queryData.query || queryData[0],
                queryData.parameters || queryData[1] || []
            );

            const result = await global.pool.execute(processedQuery, params);
            results.push(result);
        }

        if (callback && typeof callback === 'function') {
            callback(results);
        }

        return results;
    } catch (error) {
        console.error(`^1[ig.sql ERROR] Batch failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback([]);
        }
        return [];
    }
}

/**
 * Helper function to execute a query by routing to appropriate handler based on query type
 */
async function executeByQueryType(sqlQuery, parameters, callback) {
    // Extract first SQL keyword more robustly (handles leading whitespace and comments)
    const match = sqlQuery.match(/^\s*(\w+)/i);
    const queryType = match ? match[1].toUpperCase() : '';
    
    switch (queryType) {
        case 'SELECT':
            return await query(sqlQuery, parameters, callback);
        case 'INSERT':
            return await insert(sqlQuery, parameters, callback);
        case 'UPDATE':
        case 'DELETE':
            return await update(sqlQuery, parameters, callback);
        default:
            // Log warning for unknown query types
            console.warn(`^3[ig.sql WARNING] Unknown query type '${queryType}', defaulting to query handler^7`);
            return await query(sqlQuery, parameters, callback);
    }
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
        return await executeByQueryType(storedQuery, parameters, callback);
    } catch (error) {
        console.error(`^1[ig.sql ERROR] ExecutePrepared failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback(null);
        }
        return null;
    }
}

/**
 * Check if connection pool is ready
 */
function isReady() {
    return global.pool ? global.pool.ready() : false;
}

/**
 * Get pool statistics
 */
function getStats() {
    return global.pool ? global.pool.getStats() : null;
}

/**
 * Execute function - compatibility wrapper for oxmysql and mysql-async
 * Automatically routes to the appropriate function based on query type
 */
async function execute(sqlQuery, parameters, callback) {
    try {
        return await executeByQueryType(sqlQuery, parameters, callback);
    } catch (error) {
        console.error(`^1[ig.sql ERROR] Execute failed: ${error.message}^7`);
        if (callback && typeof callback === 'function') {
            callback(null);
        }
        return null;
    }
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
global.exports('isReady', isReady);
global.exports('getStats', getStats);

// ====================================================================================
// Compatibility exports for oxmysql and mysql-async
// ====================================================================================
global.exports('single', fetchSingle);        // oxmysql: single = fetchSingle
global.exports('scalar', fetchScalar);        // oxmysql: scalar = fetchScalar
global.exports('prepare', prepareQuery);      // oxmysql: prepare = prepareQuery
global.exports('execute', execute);           // oxmysql/mysql-async: smart execute function
global.exports('fetchAll', query);            // mysql-async: fetchAll = query

console.log('^2[ig.sql] Server exports registered (with oxmysql/mysql-async compatibility)^7');
