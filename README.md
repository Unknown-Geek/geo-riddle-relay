# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5594c08e-c0b2-4908-89db-d1d73698c8d0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5594c08e-c0b2-4908-89db-d1d73698c8d0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Resetting the database & seeding the admin user

You can wipe test data and recreate the admin account without using the Supabase dashboard by running the bundled seed script. The script requires the Supabase service role key, so **never** commit the key to version control.

```bash
# Install dependencies if you haven't already
npm install

# Run the seed script (replace the values with your own when needed)
SUPABASE_URL="https://gkkncykbepprdzodfrra.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" \
ADMIN_EMAIL="tve23cs131@cet.ac.in" \
ADMIN_PASSWORD="admin@tinkerhubcet" \
npm run seed:admin
```

The script will:

1. Clear gameplay tables (`activity_logs`, `submissions`, `riddles`, `checkpoints`, `teams`).
2. Delete any existing Supabase Auth user with the provided email.
3. Recreate the admin auth user (auto-confirmed) and upsert a matching entry in `public.admin_users` with a bcrypt-hashed password.

Environment variables that can be overridden when running the script:

- `SUPABASE_URL` (defaults to `VITE_SUPABASE_URL` if set)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `ADMIN_EMAIL` (defaults to `tve23cs131@cet.ac.in`)
- `ADMIN_PASSWORD` (defaults to `admin@tinkerhubcet`)
- `ADMIN_FULL_NAME` (defaults to `Treasure Hunt Admin`)
- `ADMIN_ROLE` (defaults to `super_admin`)

After the script reports success, you can log in to `/admin` with the seeded credentials.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5594c08e-c0b2-4908-89db-d1d73698c8d0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
