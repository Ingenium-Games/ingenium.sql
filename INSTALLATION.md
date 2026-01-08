# Installation Guide for ingenium.sql

This guide will walk you through installing and configuring `ingenium.sql` for your FiveM server. Don't worry if you're new to this - we'll explain everything step by step!

## 📋 Prerequisites

Before you begin, make sure you have:

- **Operating System**: Windows 10/11, Linux (Ubuntu 20.04+), or macOS 10.15+
- **FiveM Server**: A working FiveM server installation
- **Administrator Access**: Ability to install software on your server
- **Internet Connection**: For downloading dependencies

## 📦 Step 1: Installing Node.js

Node.js is required to run this resource. Here's how to install it on your system:

### Windows Installation

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version - look for the big green button
   - We recommend Node.js 16 or newer

2. **Run the Installer**:
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - Keep all default options selected (including "Automatically install necessary tools")
   - Click "Install" and wait for completion

3. **Verify Installation**:
   - Open **Command Prompt** (press `Win + R`, type `cmd`, press Enter)
   - Type: `node --version`
   - You should see something like `v16.x.x` or `v18.x.x`
   - If you see a version number, you're good to go! ✅

### Linux Installation (Ubuntu/Debian)

1. **Update Package Manager**:
   ```bash
   sudo apt update
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Verify Installation**:
   ```bash
   node --version
   npm --version
   ```
   Both commands should return version numbers.

### macOS Installation

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS version** for macOS
   - Or use Homebrew: `brew install node`

2. **Verify Installation**:
   - Open **Terminal**
   - Type: `node --version`
   - You should see a version number like `v18.x.x`

## 🔽 Step 2: Installing the Resource

### Download from GitHub

1. **Get the Resource**:
   - Go to [https://github.com/Ingenium-Games/ingenium.sql](https://github.com/Ingenium-Games/ingenium.sql)
   - Click the green **"Code"** button
   - Select **"Download ZIP"**

2. **Extract the Files**:
   - Extract the downloaded ZIP file
   - You should see a folder named `ingenium.sql-main` or similar

3. **Move to Resources Folder**:
   - Rename the folder to exactly `ingenium.sql` (remove `-main` or any suffix)
   - Move the `ingenium.sql` folder to your FiveM server's `resources` folder
   - Example path: `C:\FiveM\server-data\resources\ingenium.sql`

### Install Dependencies

This is a crucial step! The resource needs additional packages to work.

1. **Open Terminal/Command Prompt**:
   - **Windows**: Navigate to the resource folder in File Explorer, then type `cmd` in the address bar and press Enter
   - **Linux/Mac**: Use `cd` command to navigate to the resource folder

2. **Run npm install**:
   ```bash
   npm install
   ```

3. **Wait for Completion**:
   - You'll see downloading progress
   - Wait until you see "added X packages" or similar
   - This may take 1-3 minutes depending on your internet speed

### Common npm Install Errors and Solutions

#### ❌ Error: "npm: command not found" or "'npm' is not recognized"

**Solution**: Node.js isn't installed correctly or not in your PATH.
- Re-install Node.js following the steps above
- Make sure to restart Command Prompt/Terminal after installation
- On Windows, try restarting your computer

#### ❌ Error: "EACCES: permission denied"

**Solution**: You don't have permission to install packages.
- **Linux/Mac**: Run with sudo: `sudo npm install`
- **Windows**: Run Command Prompt as Administrator (right-click → "Run as administrator")

#### ❌ Error: "Network timeout" or "Unable to resolve"

**Solution**: Network/firewall issues.
- Check your internet connection
- If behind a corporate firewall, you may need to configure npm proxy
- Try using a different network or VPN

#### ❌ Error: "gyp ERR" or Python-related errors

**Solution**: Build tools are missing (rare, but can happen).
- **Windows**: Run: `npm install --global windows-build-tools`
- **Linux**: Install: `sudo apt install build-essential`
- **Mac**: Install Xcode Command Line Tools: `xcode-select --install`

## 🗄️ Step 3: Database Setup

You need a MySQL or MariaDB database for this resource. **MariaDB is recommended** as it performs better with FiveM.

### Installing MariaDB

#### Windows

1. **Download MariaDB**:
   - Visit [https://mariadb.org/download/](https://mariadb.org/download/)
   - Select your Windows version
   - Download the installer (MSI package)

2. **Run Installer**:
   - Double-click the downloaded file
   - Follow the installation wizard
   - **Important**: Remember the root password you set!
   - Keep default port: 3306

3. **Verify Installation**:
   - Open Command Prompt
   - Type: `mysql --version`
   - You should see MariaDB version information

#### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install MariaDB
sudo apt install mariadb-server mariadb-client

# Secure installation (follow prompts)
sudo mysql_secure_installation
```

When prompted:
- Set a root password (remember it!)
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

#### macOS

```bash
# Using Homebrew
brew install mariadb

# Start MariaDB service
brew services start mariadb

# Secure installation
mysql_secure_installation
```

### Creating Your Database

1. **Connect to MariaDB**:
   ```bash
   mysql -u root -p
   ```
   Enter the root password when prompted.

2. **Create the Database**:
   ```sql
   CREATE DATABASE fivem_database;
   ```

3. **Create a Database User** (Important for security!):
   ```sql
   CREATE USER 'fivem_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   ```
   ⚠️ Replace `your_secure_password` with a strong password!

4. **Grant Permissions**:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON fivem_database.* TO 'fivem_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Exit MariaDB**:
   ```sql
   EXIT;
   ```

### Verifying Database Connection

Test your database connection:

```bash
mysql -u fivem_user -p fivem_database
```

If you can log in successfully, your database is ready! ✅

## ⚙️ Step 4: Configuration

Now we need to tell your FiveM server how to connect to the database.

### Option 1: Connection String (Recommended - Easiest)

1. **Open your server.cfg file**:
   - Located in your FiveM server folder
   - Example: `C:\FiveM\server-data\server.cfg`

2. **Add this line** (edit with your details):
   ```cfg
   set mysql_connection_string "mysql://fivem_user:your_secure_password@localhost:3306/fivem_database"
   ```

   **Breaking it down**:
   - `fivem_user` = your database username
   - `your_secure_password` = your database password
   - `localhost` = database host (use `localhost` if database is on same machine)
   - `3306` = database port (default for MySQL/MariaDB)
   - `fivem_database` = your database name

### Option 2: Individual Settings (Alternative)

If you prefer, you can set each option separately:

```cfg
set mysql_host "localhost"
set mysql_port "3306"
set mysql_user "fivem_user"
set mysql_password "your_secure_password"
set mysql_database "fivem_database"
```

### Optional Settings

Add these if you need to customize performance:

```cfg
# Maximum concurrent database connections (default: 10)
# Increase for busy servers (20-50), decrease for small servers (5-10)
set mysql_connection_limit "10"

# Character encoding (default: utf8mb4)
# utf8mb4 supports emoji and international characters
set mysql_charset "utf8mb4"
```

### Starting the Resource

Add this line to your `server.cfg` (usually near the bottom, after other `ensure` lines):

```cfg
ensure ingenium.sql
```

### Testing the Connection

1. **Start your FiveM server**
2. **Check the server console** for these messages:
   - `✓ ingenium.sql: Database connection established`
   - `✓ ingenium.sql: Resource started successfully`

If you see these messages, congratulations! 🎉 Your installation is complete!

## 🔧 Step 5: Troubleshooting Common Issues

### Issue: "npm: command not found" or "npm is not recognized"

**Problem**: Node.js is not installed or not in your system PATH.

**Solution**:
1. Verify Node.js installation: `node --version`
2. If command not found, reinstall Node.js
3. Restart your terminal/command prompt
4. On Windows, restart your computer after installing Node.js

### Issue: "Cannot connect to database" or "Connection refused"

**Problem**: FiveM can't reach your database.

**Solutions**:
1. **Check if database is running**:
   ```bash
   # Windows
   services.msc  # Look for MySQL/MariaDB service
   
   # Linux
   sudo systemctl status mariadb
   ```

2. **Verify credentials**:
   - Double-check username, password, database name in server.cfg
   - Test connection manually: `mysql -u fivem_user -p fivem_database`

3. **Check database exists**:
   ```bash
   mysql -u root -p
   SHOW DATABASES;  # Look for your database in the list
   ```

4. **Firewall blocking** (if database is on different machine):
   - Make sure port 3306 is open
   - Check Windows Firewall or iptables (Linux)

### Issue: "Module not found" or "Cannot find module 'mysql2'"

**Problem**: npm dependencies weren't installed correctly.

**Solution**:
1. Navigate to resource folder: `cd resources/ingenium.sql`
2. Delete `node_modules` folder if it exists
3. Run: `npm install`
4. Wait for completion
5. Restart FiveM server

### Issue: "Access denied for user" or "Permission denied"

**Problem**: Database user doesn't have proper permissions.

**Solution**:
1. Connect as root: `mysql -u root -p`
2. Grant permissions again:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON fivem_database.* TO 'fivem_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Test connection: `mysql -u fivem_user -p fivem_database`

### Issue: "Table doesn't exist" errors in game

**Problem**: Your database tables haven't been created yet.

**Solution**:
- This resource only provides the connection to the database
- Other resources create their own tables when they start
- Make sure other resources are starting AFTER ingenium.sql
- Check documentation for other resources to see if they need manual table creation

### Issue: Resource not starting or "Failed to load resource"

**Problem**: Resource folder name or configuration issue.

**Solutions**:
1. **Verify folder name**: Must be exactly `ingenium.sql` (case-sensitive on Linux)
2. **Check fxmanifest.lua**: File must exist and be readable
3. **Check server.cfg**: Make sure line says `ensure ingenium.sql` not `start ingenium.sql`
4. **Look for errors**: Read server console carefully for specific error messages

## 📚 Additional Resources

- **Node.js Documentation**: [https://nodejs.org/docs](https://nodejs.org/docs)
- **MariaDB Documentation**: [https://mariadb.com/kb/en/documentation/](https://mariadb.com/kb/en/documentation/)
- **MySQL Documentation**: [https://dev.mysql.com/doc/](https://dev.mysql.com/doc/)
- **FiveM Documentation**: [https://docs.fivem.net/](https://docs.fivem.net/)
- **npm Documentation**: [https://docs.npmjs.com/](https://docs.npmjs.com/)

## 🆘 Still Need Help?

If you're still having issues after trying the troubleshooting steps:

1. **Check existing issues**: [GitHub Issues](https://github.com/Ingenium-Games/ingenium.sql/issues)
2. **Report a new bug**: Use our [Bug Report Template](https://github.com/Ingenium-Games/ingenium.sql/issues/new/choose)
3. **Include in your report**:
   - Exact error message (copy from console)
   - Screenshots if relevant
   - Your operating system
   - Node.js version (`node --version`)
   - FiveM server version
   - Database type and version

Remember: The more information you provide, the faster we can help you! 🚀

## ✅ Installation Checklist

Use this checklist to make sure you've completed all steps:

- [ ] Node.js installed and verified (`node --version` works)
- [ ] npm installed and verified (`npm --version` works)
- [ ] Resource downloaded and extracted
- [ ] Folder renamed to exactly `ingenium.sql`
- [ ] Resource moved to FiveM resources folder
- [ ] `npm install` completed successfully in resource folder
- [ ] MariaDB/MySQL installed and running
- [ ] Database created
- [ ] Database user created with permissions
- [ ] Database connection tested manually
- [ ] server.cfg updated with connection string or individual settings
- [ ] `ensure ingenium.sql` added to server.cfg
- [ ] FiveM server started successfully
- [ ] No errors in server console
- [ ] Database connection confirmed in console

If all items are checked, you're ready to go! 🎉
