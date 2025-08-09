# Yodha Arc – Cavill Physique Coach (MVP)

Welcome to **Yodha Arc**, a lightweight progressive web application (PWA) that
guides users towards a Henry‑Cavill‑style physique: strong, lean and
athletic. This repository contains a complete, working minimum viable
product written in vanilla JavaScript. The app generates daily workouts,
tracks progress and provides nutrition guidance—all offline‑friendly and
mobile‑ready.

## Features

* **6‑day Push–Pull–Legs Hybrid** – A structured weekly program with
  compound and accessory movements. The plan automatically rotates
  exercises to avoid overuse.
* **Daily plan generator** – Generates a warm‑up, main workout table
  (exercise, focus, sets, reps, starting weight and notes), a mandatory
  7‑minute finisher and a cooldown. Each day includes an affirmation.
* **Level & language selection** – Supports Beginner/Intermediate levels and
  English/ Telugu copy. Selections persist across sessions.
* **Finisher timer** – Integrated 7‑minute countdown with simple
  movements (jumping jacks, swings, snatches and mountain climbers).
* **Checklist & logging** – Users can tick off hydration, sleep, warm‑up
  and pump, record their RPE and mood, and enter starting weights per
  exercise. Data can be exported as CSV for analysis.
* **Offline support** – A service worker caches static assets so the app
  functions offline once installed. It can be installed to a device
  home screen like a native app.
* **Testing** – A simple Node test harness validates the workout
  generator logic.

## Repository Structure

```
yodha-arc/
├── index.html        — entry point; minimal HTML linking styles and scripts
├── app.js            — application logic (translations, state, generator, UI)
├── style.css         — base styling for a clean, modern interface
├── manifest.json     — PWA manifest describing icons, colours and display
├── service-worker.js — offline caching logic
├── icon-192.png      — application icon (192×192)
├── icon-512.png      — application icon (512×512)
├── tests/
│   └── test.js       — minimal test harness for generator functions
└── README.md         — this document
```

## Running Locally

You do not need any external package manager (like npm) to run this app; it
is written in pure HTML/JS/CSS. To serve it locally with a simple HTTP
server:

```
cd yodha-arc
python3 -m http.server 8000
```

Then navigate to [`http://localhost:8000`](http://localhost:8000) in your
browser. If you open the app directly from the file system (e.g. by
double‑clicking `index.html`), some browsers will disallow the service
worker. Serving over HTTP solves this.

## Running Tests

Node is available in the environment. To run the tests that validate the
workout generator logic:

```
cd yodha-arc/tests
node test.js
```

All assertions should pass. You can add additional tests by extending
`tests/test.js`.

## Deploying / Shipping

Because the application is a collection of static files, it can be hosted
almost anywhere:

* **GitHub Pages** – After pushing this repository to GitHub, enable
  GitHub Pages for the `main` branch (`/root` directory). The app will be
  available at `https://<username>.github.io/<repository>/`.
* **Vercel / Netlify** – Create a new project and point it at your GitHub
  repository. Use the default static site settings (no build step) so
  Vercel/Netlify simply serve the `index.html`.
* **Firebase Hosting** – Initialise Firebase hosting and run
  `firebase deploy` to upload the static files.

Any hosting platform that can serve static assets over HTTPS will work. The
important part for PWA installation is that the site is served from a
secure origin (`https`), so opening `index.html` directly from disk will
not allow installation.

## Contributing & Extending

This MVP is designed to be a foundation. Here are some ideas for
extending it:

* **IndexedDB persistence** – Replace the simple `localStorage` with
  IndexedDB (via Dexie.js) to store complete training history, body
  measurements, photos and nutrition logs.
* **Charting** – Use a lightweight library (like Chart.js) to display
  moving average trends for weight and protein intake.
* **Notifications** – Integrate the Notifications API to send daily
  reminders at 5:00 AM IST.
* **Video cues** – Add embedded technique videos and form cues for each
  exercise.
* **Automatic deloading & progression** – Implement the progression
  logic described in the specification to adjust weights and sets based on
  user performance and recovery signals.

## Licensing

This project is provided for educational purposes. You are free to use
it as a starting point for your own fitness app. All content, including
affirmations and exercise descriptions, can be modified to suit your
requirements.