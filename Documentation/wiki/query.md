# exports['ingenium.sql']:query

Execute a SELECT query that returns multiple rows from the database.

## Description

The `query` function is used to execute SELECT queries that return multiple rows of data. It supports both positional (`?`) and named (`@param`) parameters for safe parameter substitution, preventing SQL injection attacks.

## Signature

```lua
results = exports['ingenium.sql']:query(query, parameters, callback)
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT query with `?` placeholders or `@named` parameters |
| `parameters` | table/array | No | Query parameters (array for `?` or table for `@named`) |
| `callback` | function | No | Optional callback function that receives the results |

## Returns

**Type:** `table` (array)

Returns an array of result rows. Each row is a table where keys are column names and values are the column data. Returns an empty array `{}` if no results are found or if an error occurs.

## Example

### Basic Usage with Positional Parameters

```lua
-- Get all users over 18 years old
local users = exports['ingenium.sql']:query(
    'SELECT * FROM users WHERE age > ?',
    {18}
)

-- Iterate through results
for _, user in ipairs(users) do
    print('User: ' .. user.name .. ', Age: ' .. user.age)
end
```

### Using Named Parameters

```lua
-- Named parameters are more readable for complex queries
local players = exports['ingenium.sql']:query(
    'SELECT * FROM players WHERE level BETWEEN @minLevel AND @maxLevel AND active = @active',
    {
        minLevel = 10,
        maxLevel = 50,
        active = 1
    }
)

print('Found ' .. #players .. ' players')
```

### With Callback (Async Pattern)

```lua
-- Execute query asynchronously with callback
exports['ingenium.sql']:query(
    'SELECT * FROM inventory WHERE player_id = ?',
    {playerId},
    function(items)
        if #items > 0 then
            print('Player has ' .. #items .. ' items')
            for _, item in ipairs(items) do
                print('- ' .. item.name .. ' x' .. item.quantity)
            end
        else
            print('Player inventory is empty')
        end
    end
)
```

### Complex Query Example

```lua
-- Join multiple tables with sorting and limiting
local results = exports['ingenium.sql']:query([[
    SELECT 
        u.id, u.name, u.level,
        COUNT(i.id) as item_count,
        SUM(a.balance) as total_balance
    FROM users u
    LEFT JOIN inventory i ON u.id = i.player_id
    LEFT JOIN accounts a ON u.id = a.user_id
    WHERE u.active = ? AND u.level >= ?
    GROUP BY u.id
    ORDER BY u.level DESC
    LIMIT ?
]], {1, 10, 50})
```

## Important Notes

- ⚠️ **Always use parameterized queries** to prevent SQL injection. Never concatenate user input directly into query strings.
- Results are returned as a Lua array (1-indexed), not 0-indexed.
- Column names in results match the database column names (or aliases if using `AS`).
- Empty result sets return an empty array `{}`, not `nil`.
- For queries that should return only one row, consider using [`fetchSingle`](fetchSingle.md) instead.
- For queries that return a single value, use [`fetchScalar`](fetchScalar.md) for better performance.

## Performance Tips

- Add appropriate database indexes on columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- Use `LIMIT` to restrict result set size when you don't need all matching rows.
- For repeatedly executed queries, consider using [`prepareQuery`](prepareQuery.md) and [`executePrepared`](executePrepared.md).
- When executing multiple independent queries, use [`batch`](batch.md) for better performance.

## Related Functions

- [`fetchSingle`](fetchSingle.md) - Get a single row from the database
- [`fetchScalar`](fetchScalar.md) - Get a single value from the database
- [`batch`](batch.md) - Execute multiple SELECT queries efficiently
- [`prepareQuery`](prepareQuery.md) - Prepare a query for repeated execution

## Source

- Implemented in: `server.js`
- Lua wrapper: `_handler.lua` (as `ig.sql.Query`)
- Also available as: `fetchAll` (mysql-async compatibility alias)
