# Deployment Guide

## Vercel Deployment

### Required Environment Variable

Due to Turbopack font loader incompatibility in Next.js 16.3.0, you must set the following environment variable in your Vercel project:

**Environment Variable:**
- Key: `TURBOPACK`
- Value: `0`
- Scope: Production, Preview (do NOT set for Development)

### How to Set in Vercel:

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key:** `TURBOPACK`
   - **Value:** `0`
   - **Environment:** Check "Production" and "Preview" (leave Development unchecked)
4. Click **Save**
5. Redeploy your project

### Why This Is Needed

Next.js 16.3.0 uses Turbopack by default, but Vercel's build environment has issues resolving Google Fonts with Turbopack, causing errors like:

```
Error: Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
```

Setting `TURBOPACK=0` forces Next.js to use the stable Webpack bundler for production builds while keeping Turbopack for local development.

### Other Required Environment Variables

Set these in Vercel as well:

- `DATABASE_URL` - Your Postgres database connection string
- `DIRECT_URL` - Direct connection to your database (for migrations)
- `NEXT_PUBLIC_BASE_URL` - Your production domain (e.g., `https://cassette.example.com`)
- `NEXT_PUBLIC_POSTHOG_KEY` - (Optional) PostHog analytics key

### Verification

After setting the environment variable and redeploying:

1. Check the build logs - should see "▲ Next.js 16.3.0" without "(Turbopack)"
2. Build should complete without font resolution errors
3. All pages should render correctly with proper fonts
