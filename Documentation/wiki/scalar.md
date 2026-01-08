# exports['ingenium.sql']:scalar

Alias for [`fetchScalar`](fetchScalar.md) - provided for oxmysql compatibility.

## Description

The `scalar` function is a compatibility alias that maps to [`fetchScalar`](fetchScalar.md). It exists to maintain compatibility with codebases migrating from oxmysql. For new code, it is recommended to use [`fetchScalar`](fetchScalar.md) directly for clarity.

## Signature

```lua
value = exports['ingenium.sql']:scalar(query, parameters, callback)
```

## Parameters

Identical to [`fetchScalar`](fetchScalar.md):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the value |

## Returns

**Type:** `any` (typically `number`, `string`, or `nil`)

Returns the first column value from the first row. See [`fetchScalar`](fetchScalar.md) for details.

## Example

### oxmysql Style Usage

```lua
-- oxmysql compatibility
local count = exports['ingenium.sql']:scalar('SELECT COUNT(*) FROM players')
print('Total players: ' .. (count or 0))

local balance = exports['ingenium.sql']:scalar('SELECT balance FROM accounts WHERE player_id = ?', {playerId})
print('Balance: $' .. (balance or 0))
```

### Recommended: Use fetchScalar Instead

```lua
-- Recommended for new code (more explicit)
local count = exports['ingenium.sql']:fetchScalar('SELECT COUNT(*) FROM players')
print('Total players: ' .. (count or 0))

local balance = exports['ingenium.sql']:fetchScalar('SELECT balance FROM accounts WHERE player_id = ?', {playerId})
print('Balance: $' .. (balance or 0))
```

## Migration from oxmysql

If you're migrating from oxmysql, the `scalar` export works exactly the same:

```lua
-- Old oxmysql code
local count = exports.oxmysql:scalar('SELECT COUNT(*) FROM users WHERE active = ?', {1})

-- Works with ingenium.sql (with provide directive)
local count = exports['ingenium.sql']:scalar('SELECT COUNT(*) FROM users WHERE active = ?', {1})

-- Or use the native function name
local count = exports['ingenium.sql']:fetchScalar('SELECT COUNT(*) FROM users WHERE active = ?', {1})
```

## Important Notes

- ⚠️ **This is a compatibility alias**: For new code, use [`fetchScalar`](fetchScalar.md) for better clarity.
- The functionality is identical to [`fetchScalar`](fetchScalar.md).
- Using `scalar` instead of `fetchScalar` does not affect performance.
- Both names are available in all versions of ingenium.sql.

## Compatibility

This export enables compatibility with resources expecting oxmysql. When using the `provide` directive in fxmanifest.lua:

```lua
provide 'oxmysql'
```

Resources that depend on oxmysql will automatically use ingenium.sql and can call `exports.oxmysql:scalar()`.

## Related Functions

- **[`fetchScalar`](fetchScalar.md)** - The native ingenium.sql function (recommended)
- [`query`](query.md) - Get multiple rows
- [`fetchSingle`](fetchSingle.md) - Get a single row
- [`single`](single.md) - Compatibility alias for fetchSingle

## Source

- Implemented in: `server.js` (as alias to `fetchScalar`)
- Compatibility export for oxmysql
