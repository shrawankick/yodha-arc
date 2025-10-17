# Yodha Arc — Adaptive Training Arc

Yodha Arc is a fully client-side coaching experience that rotates gym, home
and outdoor sessions while letting athletes build precision “muscle sculpt”
days directly on an interactive anatomy map. The interface guides users
through a cinematic welcome, environment selection, level tuning and plan
review so every training day feels intentional and fresh.

## Feature Highlights

- **Guided stepper workflow** – A four-step flow (welcome → environment →
  profile → session) keeps the user anchored, with automatic focus and
  smooth scrolling to the active card.
- **Custom muscle sculptor** – Tap up to three muscle groups on the neon
  anatomy map to generate bespoke PPL-style sessions. Selection status and a
  clear button keep editing frictionless, and plans refresh immediately as
  choices change.
- **Environment-aware templates** – Gym, home and outdoor templates rotate
  volume/size phases, enforce the 70-minute cap and finish every day with a
  mandatory seven-move HIIT burst.
- **Auto level promotion** – Completing 30 Beginner sessions unlocks
  Intermediate, and 40 more unlock Advanced. Session counters reset after
  each promotion so users keep progressing.
- **Daily intelligence** – The dashboard tracks streaks, the last style
  used, a feedback-fed history log and a main-lift progress graph built from
  logged weights.
- **Persistent feedback loop** – Every session stores feedback (“too easy”,
  “just right”, “too tough”), optional notes and load entries so tomorrow’s
  intensity bias adapts automatically.

## Project Layout

```
yodha-arc/
├── app.js            # Planner logic, storage, UI controller and muscle map
├── index.html        # Multi-step interface shell
├── styles.css        # Neon gradient visual system and responsive layout
├── preview.js        # Zero-dependency static preview server
├── package.json      # npm scripts for previewing and testing
├── manifest.json     # PWA manifest
├── service-worker.js # Offline cache bootstrap
├── icon-192.png      # App icon (192×192)
├── icon-512.png      # App icon (512×512)
├── tests/
│   └── test.js       # Node assertions for planner invariants
└── README.md         # This document
```

## Previewing the Experience

A lightweight preview server is bundled so you can review the exact build
before committing or shipping changes.

```bash
npm install    # optional – there are no runtime deps
npm run preview
```

By default the server listens on <http://localhost:4173>. Set the `PORT`
environment variable to override it:

```bash
PORT=5000 npm run preview
```

Stop the server at any time with `Ctrl+C`.

If you prefer not to use npm you can invoke the script directly:

```bash
node preview.js
```

## Running Tests

All generator and scheduling rules are validated through a small Node test
suite:

```bash
npm test
# or
node tests/test.js
```

The tests confirm the 70-minute cap, HIIT finisher, rotation variety,
calisthenics availability and the custom muscle selector’s three-muscle
limit.

## Extending Further

- Introduce authentication or cloud sync so athletes can resume progress on
  any device.
- Layer in form videos or technique cues for the custom builder’s exercises.
- Add structured deload weeks and strength progressions keyed to the stored
  intensity feedback.
- Export logs as CSV/JSON so lifters can take their data into external
  analytics tools.

The project is intentionally dependency-light and modular (OOP services for
profile, library and planner logic) to make experimentation painless.
