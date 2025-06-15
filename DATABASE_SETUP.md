# Database Setup Guide

This guide will help you set up the MySQL database for the TeleMed Pro application.

## Prerequisites

1. **MySQL Server**: Install MySQL 5.7+ or MySQL 8.0+
2. **Node.js**: Install Node.js 14+ 
3. **npm**: Comes with Node.js

## Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=telemed_pro

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Server Configuration
PORT=3300
NODE_ENV=development
\`\`\`

## Setup Steps

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Database Connection

Update your `.env` file with your MySQL credentials:

- `DB_HOST`: Your MySQL server host (usually `localhost`)
- `DB_USER`: Your MySQL username (usually `root`)
- `DB_PASSWORD`: Your MySQL password
- `DB_NAME`: Database name (will be created automatically)

### 3. Initialize Database

Run the database initialization script:

\`\`\`bash
npm run init-db
\`\`\`

This will:
- Create the database if it doesn't exist
- Create all necessary tables
- Insert sample data (doctors)

### 4. Start the Server

\`\`\`bash
npm start
\`\`\`

Or for development with auto-restart:

\`\`\`bash
npm run dev
\`\`\`

## Database Schema

The application uses the following tables:

### Users Table
- Stores user registration and profile information
- Includes authentication data (hashed passwords)
- Tracks login history and account status

### Appointments Table
- Stores appointment bookings
- Links to users table
- Includes appointment details and status

### Contact Messages Table
- Stores contact form submissions
- Categorizes messages by subject
- Tracks message status

### Sessions Table
- Manages user sessions
- Automatically created by express-mysql-session

### Doctors Table
- Stores doctor profiles and information
- Includes specialties and credentials

## Troubleshooting

### Connection Issues

1. **"Access denied" error**: Check your MySQL username and password
2. **"Connection refused" error**: Ensure MySQL server is running
3. **"Database doesn't exist" error**: Run `npm run init-db` to create the database

### Common Solutions

1. **Reset Database**: 
   \`\`\`sql
   DROP DATABASE IF EXISTS telemed_pro;
   \`\`\`
   Then run `npm run init-db` again

2. **Check MySQL Status**:
   \`\`\`bash
   # On macOS with Homebrew
   brew services list | grep mysql
   
   # On Ubuntu/Debian
   sudo systemctl status mysql
   
   # On Windows
   net start mysql
   \`\`\`

3. **Create MySQL User** (if needed):
   \`\`\`sql
   CREATE USER 'telemed_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON telemed_pro.* TO 'telemed_user'@'localhost';
   FLUSH PRIVILEGES;
   \`\`\`

## Security Notes

1. **Change Default Passwords**: Never use default passwords in production
2. **Session Secret**: Use a strong, random session secret
3. **Database User**: Create a dedicated database user with limited privileges
4. **SSL/TLS**: Enable SSL for database connections in production

## Testing the Connection

Visit `http://localhost:3300/health` to check if the database connection is working.

The response should show:
\`\`\`json
{
  "status": "OK",
  "database": "Connected",
  ...
}
\`\`\`

## Production Deployment

For production deployment:

1. Use environment variables for all sensitive data
2. Enable SSL for database connections
3. Use connection pooling (already configured)
4. Set up database backups
5. Monitor database performance

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your MySQL server is running
3. Ensure all environment variables are set correctly
4. Test the database connection manually using a MySQL client
