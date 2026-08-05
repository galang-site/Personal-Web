# Personal Brand Website — Supabase + Vercel Edition

A personal site with a real `/admin` login page. Public visitors see content
pulled live from a Supabase database; only you (logged in) can add, edit, or
delete it.

## File structure

```
index.html           the public site (fetches content from Supabase)
admin.html            the /admin login + dashboard
assets/
  config.js            your Supabase URL + anon key (fill this in)
  site.js              renders the public site
  admin.js             login + CRUD logic for the dashboard
  styles.css           shared design (same look as your current static site)
supabase/
  schema.sql            database schema, security rules, and your seed data
```

## 1. Create the Supabase project

1. Go to https://supabase.com, sign in, click **New Project**.
2. Pick a name (e.g. `galang-personal-site`), a database password (save it
   somewhere safe), and a region close to you (Singapore is closest to
   Jakarta).
3. Wait ~2 minutes for the project to finish provisioning.

## 2. Run the database schema

1. In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this folder, copy the whole file, paste it
   into the SQL editor, and click **Run**.
3. This creates all the tables, sets up Row Level Security (public can read,
   only logged-in users can write), and inserts your real profile data from
   LinkedIn as a starting point.

## 3. Create your admin login

1. In Supabase, go to **Authentication → Providers** and make sure **Email**
   is enabled.
2. Go to **Authentication → Settings** and **turn OFF "Allow new users to
   sign up"** (important — this is what makes "authenticated" effectively
   mean "just you", since nobody else can create an account).
3. Go to **Authentication → Users → Add user → Create new user**. Enter your
   own email and a password. This is what you'll use to log into `/admin`.

## 4. Get your API keys

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `assets/config.js` in this folder and paste them in:
   ```js
   window.SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   The anon key is safe to expose in frontend code — the Row Level Security
   rules from step 2 are what actually protect your data.

## 5. Test it locally (optional but recommended)

Any simple local server works, e.g. with Python installed:
```
cd personal-brand-site-v2
python3 -m http.server 8000
```
Then open `http://localhost:8000` for the public site and
`http://localhost:8000/admin.html` to log in and try editing something.

## 6. Push to GitHub

```
cd personal-brand-site-v2
git init
git add .
git commit -m "Personal site with Supabase-backed admin"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## 7. Deploy on Vercel

1. Go to https://vercel.com, sign in with GitHub.
2. **Add New → Project**, select the repo you just pushed.
3. Framework preset: choose **Other** (this is a plain static site, no build
   step needed). Leave build/output settings blank.
4. Click **Deploy**. Vercel gives you a live URL in about a minute.
5. (Optional) Add your own custom domain under **Project → Settings →
   Domains**.

Once deployed, your site is live at `your-project.vercel.app`, and the admin
panel is at `your-project.vercel.app/admin.html`. Log in with the account you
created in step 3, and any change you save appears on the public site
immediately — no rebuild or redeploy needed, since the public page reads
straight from Supabase.

## Notes

- Projects, testimonials, and hero photo are still placeholders — edit them
  from `/admin` once you're live (or ask Claude to update `supabase/schema.sql`
  seed data before you run it, if you'd rather start with the real content
  already in place).
- If you ever want to add a second admin (e.g. an assistant), just add
  another user the same way as step 3 — every logged-in user has full write
  access under the current security rules.
- `admin.html` has `<meta name="robots" content="noindex, nofollow">` so
  search engines won't index it, but it isn't hidden — anyone who knows the
  URL can reach the login page (they just can't get in without your
  credentials).
