# exports['ingenium.sql']:insert

Execute an INSERT query and return the auto-generated insert ID.

## Description

The `insert` function is used to insert new records into database tables. It returns the auto-generated ID from the `AUTO_INCREMENT` primary key column, making it easy to reference the newly created record.

## Signature

```lua
insertId = exports['ingenium.sql']:insert(query, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL INSERT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the insert ID |

## Returns

**Type:** `number`

Returns the auto-generated insert ID from the `AUTO_INCREMENT` column. Returns `0` if the insert failed or if the table does not have an auto-increment column.

## Example

### Basic Insert

```lua
-- Insert a new user
local insertId = exports['ingenium.sql']:insert(
    'INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())',
    {'John Doe', 'john@example.com'}
)

if insertId > 0 then
    print('User created with ID: ' .. insertId)
else
    print('Failed to create user')
end
```

### Creating New Player Record

```lua
RegisterNetEvent('playerJoining')
AddEventHandler('playerJoining', function()
    local src = source
    local identifier = GetPlayerIdentifier(src, 0)
    local playerName = GetPlayerName(src)
    
    -- Check if player exists
    local existing = exports['ingenium.sql']:fetchSingle(
        'SELECT id FROM players WHERE identifier = ?',
        {identifier}
    )
    
    if not existing then
        -- Create new player
        local playerId = exports['ingenium.sql']:insert(
            'INSERT INTO players (identifier, name, first_joined, last_seen) VALUES (?, ?, NOW(), NOW())',
            {identifier, playerName}
        )
        
        if playerId > 0 then
            print('New player registered: ' .. playerName .. ' (ID: ' .. playerId .. ')')
            
            -- Create default inventory for new player
            exports['ingenium.sql']:insert(
                'INSERT INTO inventory (player_id, slot, item_name, quantity) VALUES (?, ?, ?, ?)',
                {playerId, 1, 'bread', 1}
            )
            
            -- Create default bank account
            exports['ingenium.sql']:insert(
                'INSERT INTO accounts (player_id, balance, account_type) VALUES (?, ?, ?)',
                {playerId, 5000, 'checking'}
            )
        end
    end
end)
```

### Using Named Parameters

```lua
-- Insert with named parameters for clarity
local vehicleId = exports['ingenium.sql']:insert(
    'INSERT INTO vehicles (owner_id, model, plate, color, garage) VALUES (@owner, @model, @plate, @color, @garage)',
    {
        owner = playerId,
        model = 'adder',
        plate = 'ABC123',
        color = 'red',
        garage = 'central'
    }
)

print('Vehicle registered with ID: ' .. vehicleId)
```

### With Callback (Async Pattern)

```lua
-- Insert inventory item asynchronously
function AddItemToInventory(playerId, itemName, quantity)
    exports['ingenium.sql']:insert(
        'INSERT INTO inventory (player_id, item_name, quantity, acquired_at) VALUES (?, ?, ?, NOW())',
        {playerId, itemName, quantity},
        function(insertId)
            if insertId > 0 then
                TriggerClientEvent('inventoryUpdate', playerId, {
                    id = insertId,
                    item = itemName,
                    quantity = quantity,
                    message = 'Item added to inventory'
                })
            else
                TriggerClientEvent('showNotification', playerId, 'Failed to add item')
            end
        end
    )
end
```

### Insert with JSON Data

```lua
-- Store complex data as JSON
local metadata = json.encode({
    color = {r = 255, g = 0, b = 0},
    modifications = {engine = 3, turbo = true},
    accessories = {'spoiler', 'neon'}
})

local vehicleId = exports['ingenium.sql']:insert(
    'INSERT INTO vehicles (owner_id, model, metadata) VALUES (?, ?, ?)',
    {playerId, 'adder', metadata}
)
```

### Batch Insert Pattern

```lua
-- Insert multiple items efficiently
function CreateStarterKit(playerId)
    local starterItems = {
        {name = 'bread', quantity = 5},
        {name = 'water', quantity = 3},
        {name = 'phone', quantity = 1},
        {name = 'id_card', quantity = 1}
    }
    
    for _, item in ipairs(starterItems) do
        exports['ingenium.sql']:insert(
            'INSERT INTO inventory (player_id, item_name, quantity) VALUES (?, ?, ?)',
            {playerId, item.name, item.quantity}
        )
    end
    
    print('Starter kit created for player ' .. playerId)
end
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection. Never concatenate user input directly into query strings.
- ⚠️ **Validate data before inserting** to ensure data integrity and security.
- The returned insert ID comes from MySQL's `LAST_INSERT_ID()` function.
- Returns `0` if the insert fails or if the table has no `AUTO_INCREMENT` column.
- For inserting data into multiple related tables, consider using [`transaction`](transaction.md) to ensure atomicity.
- Duplicate key errors will be logged; consider using `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE` for upsert behavior.

## Performance Tips

- Use [`batch`](batch.md) or [`transaction`](transaction.md) when inserting multiple related records.
- Avoid inserting inside loops when possible; batch insertions are more efficient.
- Add appropriate indexes on columns used in `WHERE` clauses of related queries.
- For repeatedly executed inserts, consider using [`prepareQuery`](prepareQuery.md) and [`executePrepared`](executePrepared.md).

## Related Functions

- [`update`](update.md) - Update existing records
- [`transaction`](transaction.md) - Insert multiple records atomically
- [`batch`](batch.md) - Execute multiple inserts efficiently
- [`fetchSingle`](fetchSingle.md) - Retrieve the inserted record

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.Insert`)
