/**
 * MySQL2 Connection Pool Manager
 * Integrated in-resource MySQL connection pool using mysql2
 * Based on oxmysql architecture adapted for ig.core
 * 
 * Events Emitted:
 * - ingenium.sql:Ready - Emitted when database connection is established
 * - ingenium.sql:SlowQuery - Emitted when a query takes longer than 150ms
 *   Data: { query, duration, parameters }
 * - ig:sql:queryExecuted - Emitted after every query execution (for monitoring/debugging)
 *   Data: { query, duration, success, error? }
 *   Note: This event is intended for external monitoring tools or debugging.
 *   Add an event handler in your resource if you need to track query execution.
 */

const mysql = require('mysql2/promise');

class ConnectionPool {
    constructor() {
        this.pool = null;
        this.isReady = false;
        this.config = {
            host: GetConvar('mysql_connection_string', '').match(/mysql:\/\/([^:]+)/)?.[1] || 
                  GetConvar('mysql_host', 'localhost'),
            port: parseInt(GetConvar('mysql_port', '3306')),
            user: GetConvar('mysql_user', 'root'),
            password: GetConvar('mysql_password', ''),
            database: GetConvar('mysql_database', 'fivem'),
            charset: GetConvar('mysql_charset', 'utf8mb4'),
            waitForConnections: true,
            connectionLimit: parseInt(GetConvar('mysql_connection_limit', '10')),
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            timezone: '+00:00',
            supportBigNumbers: true,
            bigNumberStrings: false,
            dateStrings: true
        };
        
        this.stats = {
            totalQueries: 0,
            slowQueries: 0,
            failedQueries: 0,
            totalTime: 0,
            averageTime: 0  // Maintain incrementally for performance
        };
    }

    /**
     * Initialize the connection pool
     */
    async initialize() {
        try {
            // Parse connection string if provided (mysql://user:pass@host:port/database)
            const connectionString = GetConvar('mysql_connection_string', '');
            if (connectionString && connectionString.startsWith('mysql://')) {
                const url = new URL(connectionString);
                this.config.host = url.hostname;
                this.config.port = parseInt(url.port) || 3306;
                this.config.user = url.username;
                this.config.password = url.password;
                this.config.database = url.pathname.substring(1);
            }

            this.pool = mysql.createPool(this.config);
            
            // Test connection
            const connection = await this.pool.getConnection();
            console.log(`^2[SQL] Connected to MySQL database: ${this.config.database}@${this.config.host}:${this.config.port}^7`);
            connection.release();
            
            this.isReady = true;
            
            // Emit ready event
            emit('ingenium.sql:Ready');
            
            return true;
        } catch (error) {
            console.error(`^1[SQL ERROR] Failed to initialize connection pool: ${error.message}^7`);
            console.error(`^1[SQL ERROR] Config: ${this.config.host}:${this.config.port}/${this.config.database}^7`);
            this.isReady = false;
            return false;
        }
    }

    /**
     * Get a connection from the pool
     */
    async getConnection() {
        if (!this.isReady) {
            throw new Error('Connection pool is not initialized');
        }
        return await this.pool.getConnection();
    }

    /**
     * Execute a raw query (OPTIMIZED with incremental stats)
     */
    async execute(query, parameters = []) {
        const startTime = process.hrtime.bigint();
        
        try {
            // Use execute which leverages mysql2's internal prepared statement cache
            // mysql2 automatically caches prepared statements for better performance
            const [results] = await this.pool.execute(query, parameters);
            
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            // Update stats incrementally (OPTIMIZED)
            this.stats.totalQueries++;
            this.stats.totalTime += duration;
            
            // Use Welford's online algorithm for numerically stable incremental average
            // This prevents precision loss with large query counts
            const delta = duration - this.stats.averageTime;
            this.stats.averageTime = this.stats.averageTime + delta / this.stats.totalQueries;
            
            if (duration > 150) {
                this.stats.slowQueries++;
                console.log(`^3[SQL WARNING] Slow query (${duration.toFixed(2)}ms): ${query.substring(0, 100)}...^7`);
                emit('ingenium.sql:SlowQuery', { query, duration, parameters });
            }
            
            emit('ig:sql:queryExecuted', { query, duration, success: true });
            
            return results;
        } catch (error) {
            this.stats.failedQueries++;
            console.error(`^1[SQL ERROR] Query failed: ${error.message}^7`);
            console.error(`^1[SQL ERROR] Query: ${query}^7`);
            console.error(`^1[SQL ERROR] Parameters: ${JSON.stringify(parameters)}^7`);
            
            emit('ig:sql:queryExecuted', { query, duration: 0, success: false, error: error.message });
            
            throw error;
        }
    }

    /**
     * Get pool statistics (OPTIMIZED - no recalculation needed)
     */
    getStats() {
        return {
            ...this.stats,
            // averageTime is now maintained incrementally
            isReady: this.isReady,
            config: {
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                connectionLimit: this.config.connectionLimit
            }
        };
    }

    /**
     * Close the connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isReady = false;
            console.log('^3[SQL] Connection pool closed^7');
        }
    }

    /**
     * Check if pool is ready
     */
    ready() {
        return this.isReady;
    }
}

// Create singleton instance and export to global scope for FiveM
global.pool = new ConnectionPool();

// Initialize on resource start
setImmediate(async () => {
    await global.pool.initialize();
});

// Cleanup on resource stop
on('onResourceStop', (resourceName) => {
    if (resourceName === GetCurrentResourceName()) {
        global.pool.close();
    }
});
