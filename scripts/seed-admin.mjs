#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('\u274c  Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable.');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\u274c  Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('    -> On Vercel, add this as an environment variable in your project settings.');
  console.error('    -> You can find this key in your Supabase project settings under API.');
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? process.env.VITE_ADMIN_EMAIL ?? 'REDACTED_EMAIL';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? process.env.VITE_ADMIN_PASSWORD ?? 'REDACTED_PASSWORD';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME ?? 'Treasure Hunt Admin';
const ADMIN_ROLE = process.env.ADMIN_ROLE ?? 'super_admin';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function clearGameData() {
  const tables = [
    'activity_logs',
    'submissions',
    'riddles',
    'checkpoints',
    'teams',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '');
    if (error) {
      throw new Error(`Failed to clear table ${table}: ${error.message}`);
    }
  }
}

async function recreateAdminUser() {
  const existing = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL);
  if (existing.error) {
    throw new Error(`Failed to check existing admin: ${existing.error.message}`);
  }

  if (existing.data.user) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existing.data.user.id, true);
    if (deleteError) {
      throw new Error(`Failed to delete existing admin user: ${deleteError.message}`);
    }
  }

  const createResponse = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: ADMIN_ROLE,
      full_name: ADMIN_FULL_NAME,
    },
  });

  if (createResponse.error) {
    throw new Error(`Failed to create admin auth user: ${createResponse.error.message}`);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const { error: upsertError } = await supabase
    .from('admin_users')
    .upsert(
      {
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        role: ADMIN_ROLE,
        full_name: ADMIN_FULL_NAME,
        is_active: true,
        last_login: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

  if (upsertError) {
    throw new Error(`Failed to upsert admin_users row: ${upsertError.message}`);
  }
}

(async () => {
  try {
    console.log('\u23F3 Clearing gameplay tables...');
    await clearGameData();
    console.log('\u2705 Gameplay data cleared.');

    console.log('\u23F3 Recreating admin user...');
    await recreateAdminUser();
    console.log('\u2705 Admin user ready: %s', ADMIN_EMAIL);

    console.log('\uD83D\uDEE0  Done. You can now sign in with the seeded credentials.');
  } catch (error) {
    console.error('\u274c  Seed script failed:', error.message);
    process.exit(1);
  }
})();
