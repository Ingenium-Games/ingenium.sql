# Release Notes for Version 1.0.2

## First Public Stable Release

This is the first official public stable release of `ingenium.sql`, a standalone FiveM resource providing MySQL database connectivity using mysql2.

### What's New in v1.0.2

- **Official stable release** ready for production use
- **Enhanced installation documentation** with two installation methods:
  - Download pre-built release (recommended)
  - Build from source with npm install
- **Clear dependency management** - run npm/yarn install after download
- Updated package version to 1.0.2

### Installation Options

#### Option 1: Download from Releases (Recommended)
1. Download the release archive from the Releases page
2. Extract to your FiveM `resources` folder
3. Ensure the folder is named `ingenium.sql`
4. Configure MySQL connection in `server.cfg`
5. Add `ensure ingenium.sql` to your `server.cfg`

#### Option 2: Build from Source
1. Clone or download the repository
2. Run `npm install` in the resource directory
3. Configure and use as above

### Key Features

- **Connection Pooling**: Efficient connection management using mysql2
- **Named & Positional Parameters**: Flexible query parameter options
- **Prepared Statements**: Pre-compile queries for performance
- **Transactions**: Atomic multi-query operations
- **Batch Operations**: Efficient query batching
- **Performance Monitoring**: Built-in query statistics
- **Auto-reconnect**: Persistent connection maintenance

### Requirements

- Node.js 16.0.0 or higher
- MySQL 5.7+ or MariaDB 10.3+
- FiveM server

### What's Included

- All source files (server.js, _pool.js, _handler.lua, etc.)
- package.json with all dependencies specified (mysql2 and dependencies)
- Configuration examples
- Comprehensive documentation

**Note**: Users will need to run `npm install` or `yarn install` after downloading to install the node_modules dependencies.

### Compatibility

- Drop-in replacement for oxmysql and mysql-async via `provide` directives
- Works with Ingenium framework via `ig.sql` namespace
- Standalone usage via `exports['ingenium.sql']`

### Support

- **Bug Reports**: Use the issue template on GitHub
- **Installation Help**: Check INSTALLATION.md
- **Discussions**: Visit GitHub Discussions
- **Documentation**: See README.md

### Credits

- Architecture inspired by oxmysql
- Built for Ingenium Games framework
- Uses mysql2 library for MySQL connectivity

---

**Full Changelog**: https://github.com/Ingenium-Games/ingenium.sql/blob/main/README.md#changelog
