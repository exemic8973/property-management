# Zeabur Deployment Guide

This guide explains how to deploy PropertyOS to Zeabur.

## Prerequisites

1. A [Zeabur account](https://zeabur.com)
2. This repository pushed to GitHub, GitLab, or Bitbucket

## Quick Deploy

### Step 1: Create a New Project

1. Log in to [Zeabur Dashboard](https://dash.zeabur.com)
2. Click **Create Project**
3. Choose a region closest to your users

### Step 2: Deploy PostgreSQL Database

1. Click **Add Service** → **Marketplace**
2. Search for **PostgreSQL** and select it
3. Wait for the database to be provisioned
4. Note down the connection string (it will be auto-linked to other services)

### Step 3: Deploy Redis (Optional but Recommended)

1. Click **Add Service** → **Marketplace**
2. Search for **Redis** and select it
3. Wait for Redis to be provisioned

### Step 4: Deploy Backend

1. Click **Add Service** → **Git**
2. Connect your GitHub/GitLab/Bitbucket account if not already connected
3. Select this repository
4. When prompted, select **apps/backend** as the root directory
5. Set the following environment variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: (auto-linked from PostgreSQL service)
   - `REDIS_URL`: (auto-linked from Redis service)
   - `JWT_PRIVATE_KEY`: Your RSA private key for JWT signing
   - `JWT_PUBLIC_KEY`: Your RSA public key for JWT verification
   - `FRONTEND_URL`: Will be set after frontend deployment
   - `SENDGRID_API_KEY`: (optional) For email notifications
   - `TWILIO_ACCOUNT_SID`: (optional) For SMS notifications
   - `TWILIO_AUTH_TOKEN`: (optional)
   - `TWILIO_PHONE_NUMBER`: (optional)

6. Set the build command:
   ```
   cd ../.. && pnpm install && pnpm turbo run build --filter=@property-os/backend
   ```

7. Set the start command:
   ```
   node dist/main.js
   ```

### Step 5: Deploy Frontend

1. Click **Add Service** → **Git**
2. Select the same repository
3. When prompted, select **apps/frontend** as the root directory
4. Set the following environment variables:
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_API_URL`: The URL of your backend service (e.g., `https://backend-xxx.zeabur.app`)
   - `NEXT_PUBLIC_APP_URL`: Will be your frontend domain
   - `NEXTAUTH_URL`: Same as `NEXT_PUBLIC_APP_URL`
   - `NEXTAUTH_SECRET`: A random 32+ character secret string
   - `GOOGLE_CLIENT_ID`: (optional) For Google OAuth
   - `GOOGLE_CLIENT_SECRET`: (optional)
   - `GITHUB_CLIENT_ID`: (optional) For GitHub OAuth
   - `GITHUB_CLIENT_SECRET`: (optional)

5. Set the build command:
   ```
   cd ../.. && pnpm install && pnpm turbo run build --filter=@property-os/frontend
   ```

6. Set the start command:
   ```
   pnpm start
   ```

### Step 6: Configure Domains

1. For each service, go to **Networking** tab
2. Add a custom domain or use the auto-generated Zeabur domain
3. Update the environment variables with the correct URLs:
   - Backend's `FRONTEND_URL`: Set to the frontend's domain
   - Frontend's `NEXT_PUBLIC_API_URL`: Set to the backend's domain

### Step 7: Run Database Migrations

1. Go to the backend service
2. Open the **Shell** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

## Generating JWT Keys

Generate RSA keys for JWT authentication:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key from private key
openssl rsa -in private.pem -pubout -out public.pem

# View the keys
cat private.pem
cat public.pem
```

Copy the contents (including the BEGIN/END lines) into the respective environment variables.

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection string |
| `JWT_PRIVATE_KEY` | Yes | RSA private key for signing tokens |
| `JWT_PUBLIC_KEY` | Yes | RSA public key for verifying tokens |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `SENDGRID_API_KEY` | No | SendGrid API key for emails |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend URL |
| `NEXTAUTH_URL` | Yes | Same as NEXT_PUBLIC_APP_URL |
| `NEXTAUTH_SECRET` | Yes | Random secret for NextAuth |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |

## Troubleshooting

### Build Fails

1. Check that the root directory is set correctly (apps/backend or apps/frontend)
2. Ensure pnpm is being used (Zeabur auto-detects from pnpm-lock.yaml)
3. Check build logs for specific errors

### Database Connection Issues

1. Verify DATABASE_URL is correctly set
2. Check if migrations have been run
3. Ensure the database service is running

### CORS Errors

1. Verify FRONTEND_URL is set correctly in the backend
2. Make sure the URL includes the protocol (https://)
3. Multiple origins can be separated by commas

### Authentication Issues

1. Verify JWT keys are correctly formatted (include BEGIN/END lines)
2. Check NEXTAUTH_SECRET is set
3. Ensure cookies are being sent (check secure/sameSite settings)

## Monorepo Structure

```
property-management/
├── apps/
│   ├── frontend/     # Next.js application
│   └── backend/      # NestJS API server
├── packages/
│   ├── database/     # Prisma schema and client
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
├── turbo.json        # Turborepo configuration
└── zeabur.json       # Zeabur template configuration
```
