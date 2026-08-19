# My Curriculum — Personal Curriculum Tracker

A web app for tracking your personal curriculum: what you're learning, the
resources you're using, your lesson plan, how you're applying it, your
reflections, your saved knowledge, and the habits that keep it all going.

## Why this is built the way it is

The backend is plain Node (`node:http`, no framework) and the frontend is
plain HTML/CSS/JS (no build step, no framework). The one real dependency is
`pg`, the standard Postgres driver, because the app needs real persistent
storage once it's hosted somewhere, a free host has no permanent disk to
keep a local database file on, but it can talk to a free hosted Postgres
database (this app is set up to use Supabase's free tier).

## Requirements

- Node.js 18 or newer (check with `node -v`).
- A Postgres database to connect to. In production this is a free Supabase
  project; set its connection string as the `DATABASE_URL` environment
  variable. For local development without setting anything, it falls back
  to trying to connect to a local Postgres database named `curriculum_test`.

## Running it

```
npm install
node server.js
```

Then open **http://localhost:3000** in your browser. The database tables
are created automatically the first time the server starts.

Want to see it populated with example data first, before adding your own?

```
node scripts/seed-demo.js
```

(Only works on a completely empty database — it won't touch real data.)

## What's inside

**Dashboard** — a welcome section with your current curriculum (name,
progress bar, current lesson, next action), quick-add buttons for a new
curriculum/lesson/book/resource/reflection, and a "Progress This Year"
summary (curriculums completed, books completed, resources completed,
lessons completed, action items implemented, hours logged).

**Curriculum Library** — the master list of every curriculum: name,
category, status, start/end date, outcome goal, and a progress bar.

**Resources** — every book, course, video, podcast, or article: name, type,
which curriculum it belongs to, priority, status, and notes.

**Lesson Planner** — your week-by-week plan: lesson name, curriculum, week
number, module name, resource used, due date, and a completed checkbox.

**ActionLab** — where learning becomes doing: action item, curriculum,
related lesson, priority, due date, status, and results.

**Reflection Journal** — full entries with guided prompts (what did I
learn, how can I apply it, what action this week, what result am I
expecting), plus biggest insight, what's changed, wins, challenges, and
action steps.

**Vault** — your searchable second brain: note title, curriculum, topic,
key takeaway, and tags.

**Habit Tracker** — habits tied to a curriculum, with frequency, a live
current streak, and a success rate calculated from your actual check-in
history (not just a number you type in).

## A note on data and privacy

Your data lives in your own Postgres database (a free Supabase project),
not on any machine that runs this code. Nothing is sent anywhere besides
that database. Supabase's free tier pauses a project after 7 days with no
activity, it isn't deleted, just paused, one click in their dashboard
un-pauses it.

## Where this can go next

You mentioned wanting to eventually offer this to your coaching clients.
The codebase was built with that in mind:

1. **Multi-user.** Every table in `lib/db.js` is flat with simple foreign
   keys on purpose. Adding client accounts later means: add a `users`
   table, add a `user_id` column to each table, add `WHERE user_id = $N` to
   the queries in `lib/crud.js` and `server.js`, and add a login screen.
   That's a mechanical change, not a redesign, but real work, plan for it
   as its own project rather than a quick add-on.
2. **Beyond free tier.** Supabase's free plan caps out around 500MB of
   data and 2 projects. Fine for you plus a handful of early clients, not
   fine at real scale. When that day comes, upgrading Supabase's plan (or
   moving to Render's own managed Postgres) needs zero code changes, just
   a new `DATABASE_URL`.
3. **Branding.** All colors live as CSS variables at the top of
   `public/css/styles.css`. Swap the hex values there and the whole app
   re-skins itself — every page uses the same variables.

## Project structure

```
server.js              the whole backend: routing + API
lib/db.js               database schema (7 tables)
lib/crud.js              generic create/read/update/delete helper
lib/stats.js              dashboard + progress aggregation queries
lib/habits.js              habit check-in and streak calculation
scripts/seed-demo.js         optional example data
public/                   everything the browser loads
  index.html                  Dashboard
  library.html                 Curriculum Library
  resources.html                 Resources
  lessons.html                    Lesson Planner
  actionlab.html                    ActionLab
  journal.html                       Reflection Journal
  vault.html                           Vault
  habits.html                           Habit Tracker
  css/styles.css                          design system / colors
  js/                                       shared helpers + one file per page
```
