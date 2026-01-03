/**
 * ====================================================================================
 * ingenium.sql - MySQL Query Implementation
 * Main server-side implementation using mysql2 connection pool
 * Based on oxmysql architecture adapted for ingenium framework
 * ====================================================================================
 */

const pool = require('./_pool.js');

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
    
    // Find all @paramName in query and replace with ?
    const paramNames = query.match(/@\w+/g);
    if (paramNames) {
        paramNames.forEach(paramName => {
            const key = paramName.substring(1); // Remove @
            if (parameters.hasOwnProperty(key)) {
                params.push(parameters[key]);
                processedQuery = processedQuery.replace(paramName, '?');
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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await pool.execute(processedQuery, params);

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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await pool.execute(processedQuery, params);

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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await pool.execute(processedQuery, params);

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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await pool.execute(processedQuery, params);

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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const { query: processedQuery, params } = processParameters(query, parameters);
        const results = await pool.execute(processedQuery, params);

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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        connection = await pool.getConnection();
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
        if (!pool || !pool.ready()) {
            throw new Error('Connection pool is not ready');
        }

        const results = [];

        for (const queryData of queries) {
            const { query: processedQuery, params } = processParameters(
                queryData.query || queryData[0],
                queryData.parameters || queryData[1] || []
            );

            const result = await pool.execute(processedQuery, params);
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

        const query = preparedQueries.get(queryId);
        
        // Determine query type and execute accordingly
        const queryType = query.trim().toUpperCase().split(' ')[0];
        
        let result;
        switch (queryType) {
            case 'SELECT':
                result = await query(query, parameters, callback);
                break;
            case 'INSERT':
                result = await insert(query, parameters, callback);
                break;
            case 'UPDATE':
            case 'DELETE':
                result = await update(query, parameters, callback);
                break;
            default:
                result = await query(query, parameters, callback);
                break;
        }

        return result;
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
    return pool ? pool.ready() : false;
}

/**
 * Get pool statistics
 */
function getStats() {
    return pool ? pool.getStats() : null;
}

// ====================================================================================
// Export all functions for use by other resources
// ====================================================================================

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

console.log('^2[ig.sql] Server exports registered^7');
