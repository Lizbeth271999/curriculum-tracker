# My Curriculum — Personal Curriculum Tracker

A web app for tracking your personal curriculum: what you're learning, the
resources you're using, your lesson plan, how you're applying it, your
reflections, your saved knowledge, and the habits that keep it all going.

## Why this is built the way it is

This needed to run without an internet connection to a package registry, so
it's built with **zero external dependencies** — no `npm install` required.
It uses only what Node.js ships with:

- `node:http` for the web server
- `node:sqlite` (built into Node 22.5+) for a real relational database
- Plain HTML, CSS, and JavaScript for the frontend (no build step, no framework)

That means it's a little more "hand-built" than a typical React/Next app,
but it's also simpler to run, has no dependency-update risk, and every table
is a real SQL table you can query directly if you ever want to.

## Requirements

- Node.js 22.5 or newer (check with `node -v`). `node:sqlite` is
  experimental in this Node version, which just means you'll see one yellow
  warning line when the server starts — that's expected and harmless.

## Running it

```
node server.js
```

Then open **http://localhost:3000** in your browser. That's it — no install
step. The database file is created automatically at `data/curriculum.sqlite`
the first time you run it.

Want to see it populated with example data first, before adding your own?

```
node scripts/seed-demo.js
```

(Only works on a completely empty database — it won't touch real data.)

To start over completely, stop the server and delete `data/curriculum.sqlite`.

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

Everything lives in one file: `data/curriculum.sqlite`, on whatever machine
you run this on. Nothing is sent anywhere. Back it up like any other file if
you want to be safe — copy that one file somewhere.

## Where this can go next

You mentioned wanting to eventually offer this to your coaching clients.
The codebase was built with that in mind:

1. **Real hosting.** Right now this runs on your machine. To put it on a
   live URL your clients could use, the cleanest path is deploying it
   somewhere like Railway, Render, or Fly.io (they can run a plain Node
   app with a persistent disk for the SQLite file), or migrating the
   database to a hosted Postgres (e.g. Supabase) and deploying the app to
   Vercel or Netlify. I can build that migration when you're ready — it's
   a day of work, not a rebuild, because of how the data layer is
   structured (see next point).
2. **Multi-user.** Every table in `lib/db.js` is flat with simple foreign
   keys on purpose. Adding client accounts later means: add a `users`
   table, add a `user_id` column to each table, add `WHERE user_id = ?` to
   the queries in `lib/crud.js` and `server.js`, and add a login screen.
   That's a mechanical change, not a redesign.
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
