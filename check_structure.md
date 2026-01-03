# FiveM Resource Structure Check

Current files:
- _handler.lua (Lua wrapper)
- _pool.js (MySQL2 pool manager)

Missing for a complete FiveM resource:
1. fxmanifest.lua (REQUIRED - resource manifest)
2. package.json (REQUIRED - for mysql2 dependency)
3. README.md (documentation)
4. .gitignore (to exclude node_modules)
5. Server-side implementation that:
   - Exports functions for the Lua wrapper
   - Implements query, fetchSingle, fetchScalar, insert, update, transaction, batch
   - Implements prepared statement support
   - Uses the connection pool

Current issues with existing code:
- _handler.lua calls exports['ig.core'] but this resource should be 'ig.sql' based on issue
- _pool.js is just the pool, not the full query implementation
- No fxmanifest.lua to register the resource
- No package.json for mysql2 dependency
