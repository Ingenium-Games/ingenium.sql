# exports['ingenium.sql']:transaction

Execute multiple queries atomically within a database transaction.

## Description

The `transaction` function allows you to execute multiple queries as a single atomic operation. All queries either succeed together or fail together (rollback), ensuring data consistency. This is essential for operations that must maintain database integrity, such as transferring money between accounts.

## Signature

```lua
result = exports['ingenium.sql']:transaction(queries, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queries` | table (array) | Yes | Array of query objects, each with `query` and `parameters` fields |
| `callback` | function | No | Optional callback function that receives (success, results) |

### Query Object Structure

Each query in the array should be a table with:
- `query` (string): The SQL query
- `parameters` (table/array): The query parameters

## Returns

**Type:** `table`

Returns a table with:
- `success` (boolean): `true` if all queries succeeded, `false` if any failed (and all were rolled back)
- `results` (array): Array of results from each query (empty if transaction failed)

## Example

### Bank Transfer (Classic Use Case)

```lua
-- Transfer money between two accounts atomically
function TransferMoney(fromAccount, toAccount, amount)
    -- Validate balance first
    local balance = exports['ingenium.sql']:fetchScalar(
        'SELECT balance FROM accounts WHERE id = ?',
        {fromAccount}
    )
    
    if not balance or balance < amount then
        return false, 'Insufficient funds'
    end
    
    -- Execute transfer as transaction
    local result = exports['ingenium.sql']:transaction({
        {
            query = 'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            parameters = {amount, fromAccount}
        },
        {
            query = 'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            parameters = {amount, toAccount}
        },
        {
            query = 'INSERT INTO transactions (from_account, to_account, amount, timestamp) VALUES (?, ?, ?, NOW())',
            parameters = {fromAccount, toAccount, amount}
        }
    })
    
    if result.success then
        print('Transfer completed: $' .. amount)
        return true, 'Transfer successful'
    else
        print('Transfer failed and was rolled back')
        return false, 'Transfer failed'
    end
end

-- Usage
local success, message = TransferMoney(1, 2, 1000)
if success then
    TriggerClientEvent('showNotification', playerId, message)
end
```

### Creating Player with Related Data

```lua
-- Create a new player with inventory and account (all or nothing)
function CreateNewPlayer(identifier, name)
    local result = exports['ingenium.sql']:transaction({
        {
            query = 'INSERT INTO players (identifier, name, created_at) VALUES (?, ?, NOW())',
            parameters = {identifier, name}
        },
        {
            query = 'INSERT INTO inventory (player_id, slot, item_name, quantity) VALUES (LAST_INSERT_ID(), ?, ?, ?)',
            parameters = {1, 'phone', 1}
        },
        {
            query = 'INSERT INTO inventory (player_id, slot, item_name, quantity) VALUES (LAST_INSERT_ID(), ?, ?, ?)',
            parameters = {2, 'id_card', 1}
        },
        {
            query = 'INSERT INTO accounts (player_id, balance, account_type) VALUES (LAST_INSERT_ID(), ?, ?)',
            parameters = {5000, 'checking'}
        }
    })
    
    if result.success then
        -- Get the player ID from the first insert
        local playerId = result.results[1].insertId
        print('Player created successfully with ID: ' .. playerId)
        return playerId
    else
        print('Failed to create player - all changes rolled back')
        return nil
    end
end
```

### With Callback (Async Pattern)

```lua
-- Purchase vehicle with money deduction and ownership transfer
function PurchaseVehicle(playerId, vehicleModel, price)
    exports['ingenium.sql']:transaction({
        {
            query = 'UPDATE accounts SET balance = balance - ? WHERE player_id = ? AND balance >= ?',
            parameters = {price, playerId, price}
        },
        {
            query = 'INSERT INTO vehicles (owner_id, model, purchase_price, purchased_at) VALUES (?, ?, ?, NOW())',
            parameters = {playerId, vehicleModel, price}
        },
        {
            query = 'INSERT INTO transactions (player_id, amount, type, description) VALUES (?, ?, ?, ?)',
            parameters = {playerId, -price, 'purchase', 'Vehicle: ' .. vehicleModel}
        }
    }, function(success, results)
        if success then
            local vehicleId = results[2].insertId
            TriggerClientEvent('vehiclePurchased', playerId, {
                id = vehicleId,
                model = vehicleModel,
                message = 'Vehicle purchased successfully!'
            })
        else
            TriggerClientEvent('showNotification', playerId, 'Purchase failed - insufficient funds or error occurred')
        end
    end)
end
```

### Inventory Trade Between Players

```lua
-- Trade items between two players atomically
function TradeItems(fromPlayerId, toPlayerId, itemName, quantity)
    local result = exports['ingenium.sql']:transaction({
        {
            query = 'UPDATE inventory SET quantity = quantity - ? WHERE player_id = ? AND item_name = ? AND quantity >= ?',
            parameters = {quantity, fromPlayerId, itemName, quantity}
        },
        {
            query = [[
                INSERT INTO inventory (player_id, item_name, quantity) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + ?
            ]],
            parameters = {toPlayerId, itemName, quantity, quantity}
        },
        {
            query = 'INSERT INTO trade_log (from_player, to_player, item_name, quantity, traded_at) VALUES (?, ?, ?, ?, NOW())',
            parameters = {fromPlayerId, toPlayerId, itemName, quantity}
        }
    })
    
    if result.success and result.results[1].affectedRows > 0 then
        return true, 'Trade completed'
    else
        return false, 'Trade failed - insufficient items or error'
    end
end
```

### Complex Multi-Table Update

```lua
-- Update player status across multiple tables
function UpdatePlayerStatusOnDeath(playerId, killerId)
    local result = exports['ingenium.sql']:transaction({
        {
            query = 'UPDATE players SET deaths = deaths + 1, last_death = NOW() WHERE id = ?',
            parameters = {playerId}
        },
        {
            query = 'UPDATE players SET kills = kills + 1 WHERE id = ?',
            parameters = {killerId}
        },
        {
            query = 'INSERT INTO death_log (player_id, killer_id, timestamp) VALUES (?, ?, NOW())',
            parameters = {playerId, killerId}
        },
        {
            query = 'UPDATE inventory SET quantity = 0 WHERE player_id = ? AND droppable = 1',
            parameters = {playerId}
        }
    })
    
    return result.success
end
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection.
- ⚠️ **Transactions are ACID compliant**: If any query fails, all changes are rolled back.
- **Performance**: Transactions are slower than batch operations but ensure data integrity.
- **Connection**: Uses a single database connection for all queries in the transaction.
- **Deadlocks**: Be aware of potential deadlocks when multiple transactions access the same tables.
- **LAST_INSERT_ID()**: Can be used in subsequent queries within the same transaction to reference a previous insert.

## When to Use Transactions

✅ **Use transactions when:**
- Operations must succeed or fail together (atomicity required)
- Transferring money or resources between entities
- Creating related records across multiple tables
- Updating inventory with payment deduction
- Any operation where partial completion would cause data inconsistency

❌ **Don't use transactions when:**
- Queries are independent and don't need atomicity
- You're just reading data (use [`batch`](batch.md) instead)
- Performance is more important than atomicity for the specific use case

## Performance Tips

- Keep transactions as short as possible to minimize lock time.
- Avoid user interaction or external API calls during transactions.
- Use appropriate indexes on all queried columns.
- Consider using [`batch`](batch.md) for independent queries that don't need atomicity.

## Related Functions

- [`batch`](batch.md) - Execute multiple queries without transaction overhead
- [`update`](update.md) - Execute single UPDATE/DELETE queries
- [`insert`](insert.md) - Execute single INSERT queries

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.Transaction`)
