# Never Going Home — Narrator's Field Kit

A live-play tool for running the tabletop RPG *Never Going Home*. Runs entirely
in the browser (no backend); all data is stored in `localStorage` on the
device you use it on.

## Features

- **Combat Tracker** — add/remove combatants, track Brawn/Smarts/Guts and
  Armor, free-text Initiative with manual reordering and sort, round counter,
  current-turn highlight.
- **Character Creation** — build a soldier record following the game's
  chargen rules: divide 10 points among Brawn/Smarts/Guts, pick 3 trained
  skills and assign 3 Skill Dice among them, set up Whisper Paths and spells
  if trained, and fill in equipment/service record/personal history. A
  "Randomize" button rolls up a full NPC in one click. Saved characters can
  be edited or quick-added straight into the Combat Tracker.
- **Corruption Tracker** — per-PC 0–5 corruption track with notes and a
  blur/reveal toggle for narrator-only viewing.
- **Bestiary** — every antagonist from `NGH_Bestiary.json`, searchable and
  filterable, with a "Quick Add to Combat" button. Entries with incomplete
  source data (per the bestiary JSON's own notes) are flagged.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deployment (GitHub Pages)

This repo deploys via GitHub Actions (`.github/workflows/deploy.yml`): every
push to `main` builds the app and publishes `dist/` to GitHub Pages.

**One-time setup** (repo owner, via the GitHub web UI):

1. Go to the repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab).

The site will be published at:

```
https://<your-username>.github.io/never-going-home-tracker/
```

If you ever rename the repo, update `base` in `vite.config.js` to match.
