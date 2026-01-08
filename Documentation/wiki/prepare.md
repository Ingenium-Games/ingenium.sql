# exports['ingenium.sql']:prepare

Alias for [`prepareQuery`](prepareQuery.md) - provided for oxmysql compatibility.

## Description

The `prepare` function is a compatibility alias that maps to [`prepareQuery`](prepareQuery.md). It exists to maintain compatibility with codebases migrating from oxmysql. For new code, it is recommended to use [`prepareQuery`](prepareQuery.md) directly for clarity.

## Signature

```lua
queryId = exports['ingenium.sql']:prepare(query)
```

## Parameters

Identical to [`prepareQuery`](prepareQuery.md):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL query with `?` placeholders or `@named` parameters |

## Returns

**Type:** `string`

Returns a unique query ID string that can be used with [`executePrepared`](executePrepared.md). See [`prepareQuery`](prepareQuery.md) for details.

## Example

### oxmysql Style Usage

```lua
-- oxmysql compatibility
local getUserQuery = exports['ingenium.sql']:prepare('SELECT * FROM users WHERE id = ?')

-- Execute the prepared query
local user = exports['ingenium.sql']:executePrepared(getUserQuery, {123})
```

### Recommended: Use prepareQuery Instead

```lua
-- Recommended for new code (more explicit)
local getUserQuery = exports['ingenium.sql']:prepareQuery('SELECT * FROM users WHERE id = ?')

-- Execute the prepared query
local user = exports['ingenium.sql']:executePrepared(getUserQuery, {123})
```

## Migration from oxmysql

If you're migrating from oxmysql, the `prepare` export works exactly the same:

```lua
-- Old oxmysql code
local query = exports.oxmysql:prepare('SELECT * FROM users WHERE id = ?')
local user = exports.oxmysql:execute(query, {userId})

-- Works with ingenium.sql (with provide directive)
local query = exports['ingenium.sql']:prepare('SELECT * FROM users WHERE id = ?')
local user = exports['ingenium.sql']:executePrepared(query, {userId})

-- Or use the native function name
local query = exports['ingenium.sql']:prepareQuery('SELECT * FROM users WHERE id = ?')
local user = exports['ingenium.sql']:executePrepared(query, {userId})
```

## Important Notes

- ⚠️ **This is a compatibility alias**: For new code, use [`prepareQuery`](prepareQuery.md) for better clarity.
- The functionality is identical to [`prepareQuery`](prepareQuery.md).
- Using `prepare` instead of `prepareQuery` does not affect performance.
- Both names are available in all versions of ingenium.sql.
- Query IDs are valid for the lifetime of the resource and must be re-prepared after restart.

## Compatibility

This export enables compatibility with resources expecting oxmysql. When using the `provide` directive in fxmanifest.lua:

```lua
provide 'oxmysql'
```

Resources that depend on oxmysql will automatically use ingenium.sql and can call `exports.oxmysql:prepare()`.

## Related Functions

- **[`prepareQuery`](prepareQuery.md)** - The native ingenium.sql function (recommended)
- [`executePrepared`](executePrepared.md) - Execute a prepared query
- [`query`](query.md) - Execute a regular query without preparation

## Source

- Implemented in: `server.js` (as alias to `prepareQuery`)
- Compatibility export for oxmysql
