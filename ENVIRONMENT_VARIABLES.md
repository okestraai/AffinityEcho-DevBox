# Affinity Echo - Environment Variables Documentation

## Table of Contents
1. [Getting Started - Install from GitHub](#getting-started---install-from-github)
2. [Overview](#overview)
3. [Required Variables](#required-variables)
4. [Setup Instructions](#setup-instructions)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started - Install from GitHub

This section will guide you through cloning the Affinity Echo project from GitHub and setting it up on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. **Git** - Version control system
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`
   - Should show version 2.0 or higher

2. **Node.js** - JavaScript runtime (includes npm)
   - Download from: https://nodejs.org/ (LTS version recommended)
   - Verify installation: `node --version` (should be v18.0 or higher)
   - Verify npm: `npm --version` (should be v9.0 or higher)

3. **Code Editor** (recommended)
   - [VS Code](https://code.visualstudio.com/) - Most popular choice
   - [WebStorm](https://www.jetbrains.com/webstorm/) - Full-featured IDE
   - Any text editor will work

### Step 1: Clone the Repository

Open your terminal (Command Prompt, PowerShell, Terminal, etc.) and navigate to where you want to store the project:

```bash
# Navigate to your desired directory
cd ~/Projects  # On macOS/Linux
cd C:\Projects  # On Windows

# Clone the repository
git clone https://github.com/your-username/affinity-echo.git

# Navigate into the project directory
cd affinity-echo
```

**Alternative: Clone with SSH** (if you have SSH keys set up):
```bash
git clone git@github.com:your-username/affinity-echo.git
cd affinity-echo
```

**Alternative: Download ZIP**
If you don't have Git installed:
1. Go to the GitHub repository page
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to your desired location
5. Open terminal in the extracted folder

### Step 2: Install Dependencies

Once inside the project directory, install all required npm packages:

```bash
# Install all dependencies from package.json
npm install
```

This will:
- Download all packages listed in `package.json`
- Create a `node_modules` folder with all dependencies
- Generate a `package-lock.json` file (if not already present)
- Take 1-3 minutes depending on internet speed

**Expected output:**
```
added 245 packages, and audited 246 packages in 45s

74 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Troubleshooting npm install:**

If you encounter errors:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # macOS/Linux
rmdir /s node_modules & del package-lock.json  # Windows

# Reinstall
npm install
```

If you're behind a proxy:
```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```bash
# Create .env file
touch .env  # macOS/Linux
type nul > .env  # Windows

# Open .env in your editor
code .env  # VS Code
# or
nano .env  # Terminal editor
```

Add the following content to `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to get these values:**
See the [Required Variables](#required-variables) section below for detailed instructions on obtaining your Supabase credentials.

### Step 4: Verify Installation

Run the development server to ensure everything is set up correctly:

```bash
# Start the development server
npm run dev
```

**Expected output:**
```
  VITE v5.4.8  ready in 324 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open your browser and navigate to `http://localhost:5173/`

You should see the Affinity Echo login screen.

### Step 5: Set Up Supabase Database (First Time Only)

If this is your first time setting up the project or if you're using a new Supabase project:

1. **Create Supabase Project** (if you haven't already)
   - Go to https://supabase.com and sign up/login
   - Click "New Project"
   - Fill in project details (name: `affinity-echo-dev`)
   - Wait 2-3 minutes for setup

2. **Apply Database Migrations**
   - The database schema will be created automatically when the app runs
   - Or manually apply migrations from `supabase/migrations/` folder

3. **Seed Test Data** (Optional for development)
   - In the app, click "Seed Data" button (if visible in dev mode)
   - Or run the seed function programmatically

### Project Structure Overview

After installation, your project structure will look like this:

```
affinity-echo/
├── node_modules/         # Dependencies (auto-generated)
├── public/               # Static assets
├── src/                  # Source code
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── dashboard/   # Dashboard views
│   │   └── onboarding/  # Onboarding flow
│   ├── contexts/        # React contexts (auth, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and Supabase client
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── supabase/            # Supabase configuration
│   └── migrations/      # Database migrations
├── .env                 # Environment variables (you create this)
├── .gitignore          # Git ignore rules
├── index.html          # HTML entry point
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

### Available npm Scripts

Once installed, you can use these commands:

```bash
# Start development server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter to check code quality
npm run lint

# Run linter and fix auto-fixable issues
npm run lint --fix
```

### Common Installation Issues

#### Issue: "Command not found: npm"

**Solution**: Node.js is not installed or not in PATH
```bash
# Install Node.js from https://nodejs.org
# After installation, restart your terminal

# Verify installation
node --version
npm --version
```

#### Issue: "Command not found: git"

**Solution**: Git is not installed
```bash
# macOS (with Homebrew)
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Windows: Download from https://git-scm.com
```

#### Issue: "Permission denied" errors

**Solution**: Use proper permissions or avoid sudo
```bash
# Don't use sudo with npm install
# If you have permission issues, fix npm permissions:
# https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
```

#### Issue: Port 5173 already in use

**Solution**: Another process is using the port
```bash
# Kill the process using port 5173
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3000
```

#### Issue: "Module not found" errors

**Solution**: Dependencies not installed properly
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Next Steps

After successful installation:

1. ✅ Configure environment variables (see below)
2. ✅ Set up Supabase database
3. ✅ Run the development server
4. ✅ Create a test account
5. ✅ Explore the features

Continue reading this document for detailed environment variable configuration.

---

## Overview

Affinity Echo uses environment variables to securely store sensitive configuration data such as API keys, database credentials, and service endpoints. This document provides a comprehensive guide to all environment variables used in the project.

### Technology Stack
- **Frontend Framework**: Vite + React + TypeScript
- **Backend/Database**: Supabase (PostgreSQL)
- **Environment Variable Prefix**: `VITE_` (required for Vite to expose variables to the client)

---

## Required Variables

### Supabase Configuration

#### `VITE_SUPABASE_URL`
- **Description**: The URL of your Supabase project
- **Type**: String (URL)
- **Required**: Yes
- **Example**: `https://aclsmyxqcfbcxtgxrydi.supabase.co`
- **How to Get**:
  1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
  2. Select your project
  3. Go to **Settings** → **API**
  4. Copy the **Project URL**

#### `VITE_SUPABASE_ANON_KEY`
- **Description**: The anonymous (public) API key for Supabase client-side operations
- **Type**: String (JWT Token)
- **Required**: Yes
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbHNteXhxY2ZiY3h0Z3hyeWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODk2NDIsImV4cCI6MjA3NjU2NTY0Mn0.ybOdjwY7Sn9SFVN8s0asneYNgfGrKW0rjCtb-FkM5rQ`
- **How to Get**:
  1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
  2. Select your project
  3. Go to **Settings** → **API**
  4. Copy the **anon public** key
- **Security Note**: This key is safe to expose publicly as it has limited permissions controlled by Row Level Security (RLS) policies

---

## Setup Instructions

### 1. Initial Setup

#### Create Environment File

```bash
# Navigate to project root
cd affinity-echo

# Create .env file
touch .env
```

#### Add Required Variables

Open `.env` and add the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Get Your Supabase Credentials

**Step-by-Step:**

1. **Create Supabase Project** (if you haven't already)
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization
   - Enter project name: `affinity-echo`
   - Generate a strong database password
   - Select region closest to your users
   - Click "Create new project"
   - Wait 2-3 minutes for setup

2. **Get Project URL**
   - In your Supabase project dashboard
   - Navigate to **Settings** (gear icon) → **API**
   - Under **Project URL**, copy the URL
   - Should look like: `https://xxxxxxxxxxxxx.supabase.co`

3. **Get Anon Key**
   - On the same **Settings** → **API** page
   - Under **Project API keys** section
   - Find **anon public** key
   - Click "Copy" button
   - Should be a long JWT token (starts with `eyJ...`)

4. **Update .env File**
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Verify Setup

Run the following commands to verify your environment is configured correctly:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

If configured correctly, you should see:
- No console errors about missing environment variables
- Application loads successfully
- Can interact with Supabase database

---

## Environment-Specific Configuration

### Development Environment

**File**: `.env` (local development)

```env
# Development - Supabase Project
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
```

**Characteristics**:
- Uses development Supabase project
- Can use test data
- Debug logging enabled
- RLS policies may be less strict for testing

**Usage**:
```bash
npm run dev
```

### Staging Environment

**File**: `.env.staging` (optional)

```env
# Staging - Supabase Project
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
```

**Characteristics**:
- Separate Supabase project for staging
- Production-like data
- Full RLS enforcement
- Used for pre-production testing

**Usage**:
```bash
npm run build -- --mode staging
```

### Production Environment

**File**: Set via hosting platform (Vercel, Netlify, etc.)

**DO NOT commit production credentials to Git!**

**Characteristics**:
- Production Supabase project
- Real user data
- Full security enforcement
- Monitoring and alerts enabled

**Usage**: Set environment variables in your hosting platform:

#### Vercel
1. Go to Project Settings → Environment Variables
2. Add `VITE_SUPABASE_URL`
3. Add `VITE_SUPABASE_ANON_KEY`
4. Select "Production" environment
5. Click "Save"

#### Netlify
1. Go to Site Settings → Environment Variables
2. Click "Add a variable"
3. Add `VITE_SUPABASE_URL`
4. Add `VITE_SUPABASE_ANON_KEY`
5. Click "Save"

#### Other Platforms
- Set environment variables in platform dashboard
- Ensure variables are prefixed with `VITE_`
- Redeploy after changing variables

---

## Complete .env Template

```env
# ==================================================
# AFFINITY ECHO - ENVIRONMENT VARIABLES
# ==================================================
#
# Instructions:
# 1. Copy this file to .env in the project root
# 2. Replace placeholder values with your actual credentials
# 3. NEVER commit .env to version control
# 4. Keep this file secure and backed up safely
#
# ==================================================

# --------------------------------------------------
# SUPABASE CONFIGURATION
# --------------------------------------------------
# Get these from: https://supabase.com/dashboard
# Navigate to: Settings → API
# --------------------------------------------------

# Supabase Project URL
# Format: https://[project-id].supabase.co
# Example: https://aclsmyxqcfbcxtgxrydi.supabase.co
VITE_SUPABASE_URL=your_supabase_project_url_here

# Supabase Anonymous (Public) Key
# This is the "anon public" key from the API settings
# Safe to expose publicly - permissions controlled by RLS
# Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# --------------------------------------------------
# FUTURE VARIABLES (Not yet implemented)
# --------------------------------------------------

# Email Service (Future: SendGrid, Mailgun, etc.)
# VITE_EMAIL_SERVICE_API_KEY=

# Analytics (Future: Google Analytics, Mixpanel, etc.)
# VITE_ANALYTICS_ID=

# Error Tracking (Future: Sentry)
# VITE_SENTRY_DSN=

# Feature Flags (Future: LaunchDarkly, etc.)
# VITE_FEATURE_FLAGS_KEY=

# AI Services (Future: OpenAI for content moderation)
# VITE_OPENAI_API_KEY=

# Push Notifications (Future: Firebase, OneSignal)
# VITE_PUSH_NOTIFICATIONS_KEY=

# Payment Processing (Future: Stripe)
# VITE_STRIPE_PUBLISHABLE_KEY=
```

---

## How Environment Variables are Used

### In Code

Environment variables are accessed using Vite's `import.meta.env` object:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Variable Prefix Requirement

**IMPORTANT**: Vite requires the `VITE_` prefix for variables to be exposed to client-side code.

✅ **Correct**:
```env
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

❌ **Incorrect** (won't be accessible):
```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=your_key_here
```

### TypeScript Type Safety

Add type definitions for environment variables:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Security Best Practices

### 1. Never Commit Secrets

✅ **Do**:
- Add `.env` to `.gitignore` (already done)
- Use environment variables for all secrets
- Provide `.env.example` template

❌ **Don't**:
- Commit `.env` file to Git
- Hardcode API keys in source code
- Share credentials via insecure channels

### 2. Use Different Credentials per Environment

```
Development  → dev-project.supabase.co
Staging      → staging-project.supabase.co
Production   → prod-project.supabase.co
```

Benefits:
- Isolate environments
- Prevent accidental data corruption
- Test changes safely

### 3. Rotate Keys Regularly

- Rotate Supabase keys every 6-12 months
- Rotate immediately if compromised
- Keep old keys active for 24 hours during rotation

**How to Rotate**:
1. Generate new anon key in Supabase dashboard
2. Update `.env` file
3. Redeploy application
4. Verify new key works
5. Revoke old key after 24 hours

### 4. Limit Key Permissions

- Use **anon key** (limited permissions) for client-side
- Never expose **service_role key** to clients
- Rely on Row Level Security (RLS) for data protection

### 5. Secure Storage

**Local Development**:
- Keep `.env` file permissions restricted: `chmod 600 .env`
- Don't store in cloud sync folders (Dropbox, iCloud)
- Use a password manager for backup

**Production**:
- Use platform environment variable management
- Enable secret scanning (GitHub, GitLab)
- Set up alerts for exposed secrets

### 6. Audit Access

- Regularly review who has access to production credentials
- Use Supabase audit logs to track API usage
- Set up monitoring for unusual activity

---

## Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables" Error

**Problem**: Environment variables not loaded

**Solutions**:
```bash
# Verify .env file exists
ls -la .env

# Check file contents (without exposing secrets)
grep VITE_ .env | sed 's/=.*/=***/'

# Ensure variables are prefixed with VITE_
# ✅ VITE_SUPABASE_URL
# ❌ SUPABASE_URL

# Restart dev server
npm run dev
```

#### 2. "Invalid API key" Error

**Problem**: Incorrect or expired Supabase key

**Solutions**:
- Verify key copied correctly (no extra spaces)
- Check if key is still valid in Supabase dashboard
- Ensure using **anon public** key, not service_role
- Generate new key if necessary

#### 3. Variables Not Updating

**Problem**: Changed `.env` but app still uses old values

**Solutions**:
```bash
# Vite caches environment variables
# Stop dev server (Ctrl+C)
# Restart dev server
npm run dev

# For persistent issues, clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### 4. "Network Error" or "CORS Error"

**Problem**: Incorrect Supabase URL or network issues

**Solutions**:
- Verify URL format: `https://[project-id].supabase.co`
- Check Supabase project is active (not paused)
- Verify internet connection
- Check Supabase service status: https://status.supabase.com

#### 5. Variables Undefined in Production

**Problem**: Environment variables not set in hosting platform

**Solutions**:
- Set variables in platform dashboard (Vercel, Netlify, etc.)
- Ensure variable names include `VITE_` prefix
- Redeploy after setting variables
- Check build logs for environment variable errors

### Debugging Commands

```bash
# Check if .env file exists
test -f .env && echo ".env exists" || echo ".env missing"

# Verify environment variables are loaded (dev mode)
# Add to src/main.tsx temporarily:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

# Test Supabase connection
# In browser console:
await fetch('https://your-project.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
```

---

## Database Setup

After configuring environment variables, you need to set up the database schema:

### 1. Run Migrations

Migrations are automatically applied through Supabase when you use the MCP tools.

The following tables will be created:
- `user_profiles` - User profile information
- `referral_posts` - Job referral requests and offers
- `referral_comments` - Comments on referral posts
- `referral_likes` - Likes on referral posts
- `referral_bookmarks` - Bookmarked referral posts
- `referral_connections` - Connection requests between users
- `identity_reveals` - Identity reveal request tracking

### 2. Seed Test Data (Optional)

For development, you can seed the database with test data:

```typescript
// In the application, click "Seed Data" button
// Or run programmatically:
import { seedReferralData } from './src/lib/seedData';
await seedReferralData();
```

This creates:
- 10 test user profiles
- 10 sample referral posts
- Sample comments, likes, and bookmarks

### 3. Row Level Security (RLS)

RLS is currently **disabled** for development. For production:

```sql
-- Enable RLS on tables
ALTER TABLE referral_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_comments ENABLE ROW LEVEL SECURITY;
-- etc.

-- Create policies (example)
CREATE POLICY "Users can read all posts"
  ON referral_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON referral_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Setup GitHub Secrets**:
1. Go to Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VERCEL_TOKEN` (if using Vercel)

---

## Environment Variables Checklist

Use this checklist when setting up a new environment:

### Initial Installation (First Time Setup)
- [ ] Install Git on your machine
- [ ] Install Node.js (v18+) and npm
- [ ] Clone repository from GitHub
- [ ] Navigate into project directory
- [ ] Run `npm install` to install dependencies
- [ ] Verify installation completed without errors
- [ ] Create Supabase account (if needed)
- [ ] Create new Supabase project

### Development Setup
- [ ] Create `.env` file in project root
- [ ] Add `VITE_SUPABASE_URL` from Supabase dashboard
- [ ] Add `VITE_SUPABASE_ANON_KEY` from Supabase dashboard
- [ ] Verify `.env` is in `.gitignore`
- [ ] Run `npm run dev` to test
- [ ] Verify no console errors about missing variables
- [ ] Open `http://localhost:5173` in browser
- [ ] Test database connection (create a post, etc.)
- [ ] Seed test data (optional for development)

### Staging/Production Setup
- [ ] Create separate Supabase project for environment
- [ ] Get new URL and anon key for this environment
- [ ] Add environment variables to hosting platform
- [ ] Test build locally with production variables
- [ ] Deploy and verify environment variables loaded
- [ ] Test all features in deployed environment
- [ ] Set up monitoring and error tracking
- [ ] Document credentials in secure location (password manager)

---

## Support

### Getting Help

**Environment Variable Issues**:
- Check this documentation first
- Review [Vite Environment Variables docs](https://vitejs.dev/guide/env-and-mode.html)
- Review [Supabase JavaScript Client docs](https://supabase.com/docs/reference/javascript)

**Supabase Issues**:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

**Project Issues**:
- Create GitHub issue with details
- Include environment (dev/staging/prod)
- Include error messages (redact sensitive data)

---

## Appendix

### A. Supabase Service Role Key

**What is it?**
- Administrative key with full database access
- Bypasses Row Level Security (RLS)
- Should NEVER be exposed to clients

**When to use?**
- Server-side operations only
- Admin scripts
- Database migrations
- Batch operations

**How to use securely**:
```javascript
// ONLY in server-side code (Node.js, Edge Functions)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // NOT prefixed with VITE_
)
```

### B. Environment Variable Priority

Vite loads environment variables in this order (last one wins):

1. `.env` - All environments
2. `.env.local` - Local overrides (gitignored)
3. `.env.[mode]` - Mode-specific (e.g., `.env.production`)
4. `.env.[mode].local` - Mode-specific local overrides

Example:
```
.env                → VITE_API_URL=http://localhost:3000
.env.production     → VITE_API_URL=https://api.production.com
```

### C. Quick Reference

| Variable | Required | Type | Source |
|----------|----------|------|--------|
| `VITE_SUPABASE_URL` | Yes | URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Yes | String (JWT) | Supabase Dashboard → Settings → API |

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Maintained by**: Affinity Echo Development Team
