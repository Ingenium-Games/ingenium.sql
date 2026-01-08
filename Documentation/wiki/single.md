# exports['ingenium.sql']:single

Alias for [`fetchSingle`](fetchSingle.md) - provided for oxmysql compatibility.

## Description

The `single` function is a compatibility alias that maps to [`fetchSingle`](fetchSingle.md). It exists to maintain compatibility with codebases migrating from oxmysql. For new code, it is recommended to use [`fetchSingle`](fetchSingle.md) directly for clarity.

## Signature

```lua
result = exports['ingenium.sql']:single(query, parameters, callback)
```

## Parameters

Identical to [`fetchSingle`](fetchSingle.md):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the result |

## Returns

**Type:** `table` or `nil`

Returns a single table representing the first row found, or `nil` if no matching row is found. See [`fetchSingle`](fetchSingle.md) for details.

## Example

### oxmysql Style Usage

```lua
-- oxmysql compatibility
local player = exports['ingenium.sql']:single('SELECT * FROM players WHERE id = ?', {playerId})

if player then
    print('Found player: ' .. player.name)
end
```

### Recommended: Use fetchSingle Instead

```lua
-- Recommended for new code (more explicit)
local player = exports['ingenium.sql']:fetchSingle('SELECT * FROM players WHERE id = ?', {playerId})

if player then
    print('Found player: ' .. player.name)
end
```

## Migration from oxmysql

If you're migrating from oxmysql, the `single` export works exactly the same:

```lua
-- Old oxmysql code
local result = exports.oxmysql:single('SELECT * FROM users WHERE id = ?', {userId})

-- Works with ingenium.sql (with provide directive)
local result = exports['ingenium.sql']:single('SELECT * FROM users WHERE id = ?', {userId})

-- Or use the native function name
local result = exports['ingenium.sql']:fetchSingle('SELECT * FROM users WHERE id = ?', {userId})
```

## Important Notes

- ⚠️ **This is a compatibility alias**: For new code, use [`fetchSingle`](fetchSingle.md) for better clarity.
- The functionality is identical to [`fetchSingle`](fetchSingle.md).
- Using `single` instead of `fetchSingle` does not affect performance.
- Both names are available in all versions of ingenium.sql.

## Compatibility

This export enables compatibility with resources expecting oxmysql. When using the `provide` directive in fxmanifest.lua:

```lua
provide 'oxmysql'
```

Resources that depend on oxmysql will automatically use ingenium.sql and can call `exports.oxmysql:single()`.

## Related Functions

- **[`fetchSingle`](fetchSingle.md)** - The native ingenium.sql function (recommended)
- [`query`](query.md) - Get multiple rows
- [`fetchScalar`](fetchScalar.md) - Get a single value
- [`scalar`](scalar.md) - Compatibility alias for fetchScalar

## Source

- Implemented in: `server.js` (as alias to `fetchSingle`)
- Compatibility export for oxmysql
