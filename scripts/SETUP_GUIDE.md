# Fresh Checkout Setup Guide

When you checkout the project in a new directory, follow these steps:

## Prerequisites

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start Supabase locally**
   ```bash
   npx supabase start
   ```
   
   This will start the local Supabase instance with:
   - PostgreSQL database on port 54322
   - Auth service on port 54321
   - Other Supabase services

3. **Make scripts executable** (if on Linux/Mac)
   ```bash
   chmod +x scripts/*.sh
   ```

## Running the Setup

Once the prerequisites are complete, run:

```bash
./scripts/reset-and-setup.sh
```

## Common Issues

### Permission Denied
If you get "permission denied" when running the script:
```bash
chmod +x scripts/reset-and-setup.sh
chmod +x scripts/setup-local-test-data.sh
```

### Supabase Not Found
If you get "supabase: command not found":
```bash
npm install
```

### Cannot Connect to Database
If you get database connection errors:
```bash
npx supabase start
```

### Script Not Found
Make sure you're in the project root directory:
```bash
cd /path/to/interviewnow
./scripts/reset-and-setup.sh
```

## What the Script Does

1. Resets the local database
2. Runs all migrations
3. Seeds initial test data
4. Creates auth users via API
5. Links auth users to the test tenant

## Test Accounts Created

All accounts use password: **TestPassword123!**

- admin@testcompany.com (Admin)
- user@testcompany.com (User)
- john.smith@example.com (User)
- sarah.johnson@example.com (User)
- michael.chen@example.com (User) 