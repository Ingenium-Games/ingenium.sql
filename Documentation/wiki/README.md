# ingenium.sql API Documentation

This directory contains detailed documentation for all `ingenium.sql` exports.

## Core Query Functions

- [query](query.md) - Execute SELECT queries returning multiple rows
- [fetchSingle](fetchSingle.md) - Execute SELECT query returning a single row
- [fetchScalar](fetchScalar.md) - Execute SELECT query returning a single value
- [insert](insert.md) - Execute INSERT queries
- [update](update.md) - Execute UPDATE or DELETE queries
- [transaction](transaction.md) - Execute multiple queries atomically
- [batch](batch.md) - Execute multiple queries without transaction

## Prepared Statements

- [prepareQuery](prepareQuery.md) - Prepare a query for later execution
- [executePrepared](executePrepared.md) - Execute a prepared query

## Utility Functions

- [isReady](isReady.md) - Check connection pool status
- [getStats](getStats.md) - Get performance statistics

## Compatibility Aliases

- [single](single.md) - oxmysql compatibility (alias for fetchSingle)
- [scalar](scalar.md) - oxmysql compatibility (alias for fetchScalar)
- [prepare](prepare.md) - oxmysql compatibility (alias for prepareQuery)
- [execute](execute.md) - oxmysql/mysql-async compatibility (smart router)
- [fetchAll](fetchAll.md) - mysql-async compatibility (alias for query)

## Usage

All exports are accessed via:
```lua
exports['ingenium.sql']:functionName(parameters)
```

Or through the Ingenium framework's `ig.sql` namespace when integrated with the core framework.
