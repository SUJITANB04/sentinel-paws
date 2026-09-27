# Sentinel Paws 🐾

Dogs contact contaminated water before we do — and react to it faster. Sentinel Paws turns
routine dog walks into an early-warning system for urban waterway contamination, built for the
**OneAquaHealth IEEE Global Hackathon 2026** (Track 6: Resilience Informatics).

## What it does

Dog owners log two things after a walk: where their dog touched water (drank, swam, waded,
sniffed) and any symptoms in the following 24–48 hours (vomiting, diarrhea, rash, lethargy,
excessive thirst). The app automatically:

- **Clusters reports by location** — using the Haversine formula to group anything within 300
  meters, so nearby reports about the same waterway are linked even if typed slightly
  differently.
- **Calculates a risk status per cluster** — Insufficient Data (fewer than 3 reports), Watching
  (minor symptomatic activity), or Elevated Risk (a statistically meaningful cluster of
  symptomatic dogs).
- **Excludes confounded reports from the risk math** — if an owner flags that their dog ate
  something unusual or had a recent diet change, that report is still shown for transparency
  but doesn't count as evidence toward an alert. This prevents a single unrelated illness from
  triggering a false alarm.
- **Generates a downloadable Investigation Report** for any Elevated Risk location — a
  formatted summary an owner could hand to a local environmental agency, explicitly framed as a
  prompt for physical water testing, not a diagnosis.

## Why it's different

Existing citizen-science water tools (like CrowdWater or HABscope) rely on human visual
observation or direct measurement. No existing tool uses animal physiological response as the
input signal — even though published research shows pets living near contaminated sites show
measurable biological effects, and animals have long served as environmental sentinels (from
canaries in coal mines to sensor-equipped mussels monitoring drinking water). Sentinel Paws is
the first citizen-science application of that concept.

## How it works — step by step

1. Owner logs a report (waterway, contact type, symptoms, optional confounders)
2. Report is stored (in-memory for this prototype — resets on server restart)
3. Reports within 300m of each other are grouped into the same cluster
4. Risk level is calculated from **confirmed** symptomatic reports only (confounded ones are
   excluded from the trigger logic, though still visible)
5. Dashboard displays the risk status — visible to anyone who opens it: other dog owners
   deciding whether to visit that spot, vets assessing a specific dog's symptoms, or
   environmental/public health officials deciding whether to test the water

## Tech stack

- **Backend:** Node.js + Express (single file, in-memory storage)
- **Frontend:** React, served inline and compiled live via Babel Standalone (no build step)
- **Styling:** Tailwind CDN + custom CSS (butter-yellow/paw-print themed UI)
- **Geolocation:** Browser Geolocation API
- **Distance calculation:** Haversine formula (great-circle distance between GPS coordinates)

## Running it locally

```bash
npm install
npm start
```
Then open `http://localhost:5000` in your browser. Allow location access when prompted (or it
falls back to demo coordinates).

## Project structure

```
sentinel-paws/
├── server.js               # Main app: backend API + inline frontend (this is what runs)
├── package.json            # Dependencies (express, cors)
├── package-lock.json        # Locked dependency versions
├── public/
│   └── index.html          # Supplementary static page
└── README.md                # This file
```

**Note:** `server.js` is the actual running application — it serves its entire frontend
inline via Express, with no separate build step. `public/index.html` is not currently wired
into the Express server (no static file middleware is configured), so it doesn't affect the
live app; it's kept in the repo as a supplementary asset.

## Roadmap

- [ ] Cross-reference reports with rainfall/weather data (contamination risk spikes after runoff)
- [ ] Passive "did your dog stay healthy?" check-in to solve the cold-start problem and build
      an accurate baseline (not just reports from owners already worried)
- [ ] Real database persistence instead of in-memory storage
- [ ] Direct integration with local environmental agencies for automatic alert routing
- [ ] Geofencing against real hydrology data (OpenStreetMap / USGS) instead of free-text
      waterway names

## Team

Built for the OneAquaHealth IEEE Global Hackathon 2026 — Track 6: Resilience Informatics.
