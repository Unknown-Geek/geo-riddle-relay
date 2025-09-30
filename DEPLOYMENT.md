# Deployment Setup Guide

## Environment Variables Required on Vercel

You need to add these environment variables in your Vercel project dashboard:

### Frontend Environment Variables (already set)
- `VITE_SUPABASE_URL` = `https://gkkncykbepprdzodfrra.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra25jeWtiZXBwcmR6b2RmcnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzQyNjEsImV4cCI6MjA3NDc1MDI2MX0.2e7URcVRF9C7e_p7_vg7HMs7XghhnHZn_g0lum1jAj4`
- `VITE_ADMIN_EMAIL` = `tve23cs131@cet.ac.in`
- `VITE_ADMIN_PASSWORD` = `admin@tinkerhubcet`

### **NEW: Backend Environment Variable (REQUIRED FOR SEEDING)**
- `SUPABASE_SERVICE_ROLE_KEY` = `[YOUR_SUPABASE_SERVICE_ROLE_KEY]`

## How to Get the Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/gkkncykbepprdzodfrra
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon/public key)
4. Add it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel

## How the Auto-Seeding Works

1. **On every deployment**, Vercel will:
   - Build your React app (`vite build`)
   - Automatically run the database seeding script (`npm run seed:admin`)
   
2. **The seeding script will**:
   - Clear all game data (teams, submissions, checkpoints, etc.)
   - Recreate the admin user with your hardcoded credentials
   - Ensure a clean database state for each deployment

## Manual Testing Locally

To test the seeding script locally:

```bash
# Make sure you have the service role key
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Run the seed script
npm run seed:admin
```

## Vercel Deployment Steps

1. **Add the Service Role Key**:
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key

2. **Deploy**:
   - Push your code to git
   - Vercel will automatically build and seed the database
   - Your admin login will work with: `tve23cs131@cet.ac.in` / `admin@tinkerhubcet`

## Database Tables That Get Cleared on Each Deploy

- `teams` - All registered teams
- `checkpoints` - All game locations
- `riddles` - All riddles/questions
- `submissions` - All team submissions
- `activity_logs` - All activity logs

The `admin_users` table gets the admin user recreated with fresh credentials.

## Security Note

The service role key has full database access, so:
- Only add it to Vercel environment variables (never commit to git)
- Keep it secure and rotate it periodically in Supabase settings