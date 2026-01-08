# exports['ingenium.sql']:update

Execute an UPDATE or DELETE query and return the number of affected rows.

## Description

The `update` function is used to modify existing records (UPDATE) or remove records (DELETE) from database tables. It returns the number of rows that were affected by the operation.

## Signature

```lua
affectedRows = exports['ingenium.sql']:update(query, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL UPDATE or DELETE query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the affected rows count |

## Returns

**Type:** `number`

Returns the number of rows that were modified or deleted. Returns `0` if no rows were affected or if an error occurred.

## Example

### Basic Update

```lua
-- Update a player's level
local affected = exports['ingenium.sql']:update(
    'UPDATE players SET level = ?, xp = ? WHERE id = ?',
    {26, 5000, playerId}
)

if affected > 0 then
    print('Player level updated')
else
    print('Player not found or level unchanged')
end
```

### Update Player Data

```lua
-- Update player position and health
function SavePlayerState(playerId, position, health)
    local affected = exports['ingenium.sql']:update(
        'UPDATE players SET x = ?, y = ?, z = ?, health = ?, last_seen = NOW() WHERE id = ?',
        {position.x, position.y, position.z, health, playerId}
    )
    
    return affected > 0
end

-- Usage
local pos = GetEntityCoords(PlayerPedId())
local health = GetEntityHealth(PlayerPedId())
SavePlayerState(playerId, pos, health)
```

### Using Named Parameters

```lua
-- Update with named parameters for clarity
local affected = exports['ingenium.sql']:update(
    'UPDATE accounts SET balance = @newBalance, last_transaction = NOW() WHERE player_id = @playerId',
    {
        newBalance = 15000,
        playerId = playerId
    }
)

print(affected .. ' account(s) updated')
```

### Delete Records

```lua
-- Remove old/expired items
local deleted = exports['ingenium.sql']:update(
    'DELETE FROM inventory WHERE player_id = ? AND quantity <= 0',
    {playerId}
)

print('Removed ' .. deleted .. ' empty inventory slots')
```

### Conditional Update

```lua
-- Update only if conditions are met
function WithdrawMoney(playerId, amount)
    -- Only update if balance is sufficient
    local affected = exports['ingenium.sql']:update(
        'UPDATE accounts SET balance = balance - ? WHERE player_id = ? AND balance >= ?',
        {amount, playerId, amount}
    )
    
    if affected > 0 then
        print('Withdrawal successful')
        return true
    else
        print('Insufficient funds')
        return false
    end
end
```

### With Callback (Async Pattern)

```lua
-- Update inventory quantity asynchronously
function RemoveItem(playerId, itemName, quantity)
    exports['ingenium.sql']:update(
        'UPDATE inventory SET quantity = quantity - ? WHERE player_id = ? AND item_name = ? AND quantity >= ?',
        {quantity, playerId, itemName, quantity},
        function(affected)
            if affected > 0 then
                TriggerClientEvent('itemRemoved', playerId, itemName, quantity)
                
                -- Clean up zero-quantity items
                exports['ingenium.sql']:update(
                    'DELETE FROM inventory WHERE player_id = ? AND quantity <= 0',
                    {playerId}
                )
            else
                TriggerClientEvent('showNotification', playerId, 'Not enough items')
            end
        end
    )
end
```

### Bulk Update

```lua
-- Update multiple records at once
local affected = exports['ingenium.sql']:update(
    'UPDATE players SET is_online = 0 WHERE last_seen < DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
)

print('Marked ' .. affected .. ' players as offline')
```

### Update with JSON Data

```lua
-- Update complex JSON column
local settings = json.encode({
    theme = 'dark',
    notifications = true,
    language = 'en'
})

exports['ingenium.sql']:update(
    'UPDATE players SET settings = ? WHERE id = ?',
    {settings, playerId}
)
```

### Safe Delete with Limit

```lua
-- Delete old log entries (with limit for safety)
local deleted = exports['ingenium.sql']:update(
    'DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) LIMIT 1000'
)

print('Deleted ' .. deleted .. ' old log entries')
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection. Never concatenate user input directly into query strings.
- ⚠️ **Be careful with DELETE without WHERE** - it will delete all rows in the table!
- ⚠️ **Use conditions wisely** - The example with withdrawal checks balance in the WHERE clause to ensure atomic operation.
- Returns `0` if no rows matched the WHERE clause, even if the query was successful.
- For updates across multiple tables, consider using [`transaction`](transaction.md) for atomicity.
- Use `LIMIT` with DELETE operations for safety when removing bulk data.

## Performance Tips

- Add appropriate indexes on columns used in `WHERE` clauses.
- For updating multiple records, avoid loops; use `WHERE` conditions to update in bulk.
- Use [`transaction`](transaction.md) when updating multiple related tables.
- For repeatedly executed updates, consider using [`prepareQuery`](prepareQuery.md) and [`executePrepared`](executePrepared.md).
- Monitor slow updates - complex WHERE clauses may need optimization.

## Related Functions

- [`insert`](insert.md) - Insert new records
- [`transaction`](transaction.md) - Update multiple records atomically
- [`fetchSingle`](fetchSingle.md) - Retrieve a record before updating
- [`query`](query.md) - Select records to update

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.Update`)
