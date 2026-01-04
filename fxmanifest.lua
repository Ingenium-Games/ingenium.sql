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

-- Server-side files
server_scripts {
    '_pool.js',
    'server.js'
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

-- Provide compatibility with oxmysql and mysql-async
-- This allows resources expecting oxmysql or mysql-async to use this resource
provide 'oxmysql'
provide 'mysql-async'

-- Lua 5.4
lua54 'yes'
