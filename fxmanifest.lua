-- ====================================================================================--
-- ingenium.sql - External MySQL Resource
-- FiveM Resource Manifest
-- ====================================================================================--

fx_version 'cerulean'
game 'common'

name 'ingenium.sql'
description 'External MySQL connection pool resource using mysql2'
author 'Ingenium Games'
version '1.0.0'

-- Dependencies
dependency 'mysql2' -- Installed via npm

-- Server-side files
server_scripts {
    'server.js',
    '_pool.js'
}

-- Client-side files (none needed for SQL resource)
-- client_scripts {}

-- Exports for other resources to use
exports {
    'query',
    'fetchSingle',
    'fetchScalar',
    'insert',
    'update',
    'transaction',
    'batch',
    'prepareQuery',
    'executePrepared',
    'isReady',
    'getStats'
}

-- Lua 5.4
lua54 'yes'
