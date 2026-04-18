# Courtside Plays

Interactive play visualizer for basketball coaches. Built to match CJ's coaching philosophy: anti-set-play, free-flow, teach kids to read the game. Plays are animated, branching decision trees so a kid can see "if the defender does X, do Y; if the defender does Z, do this other thing."

## Why this is its own app

Courtside (the main team-management app) lives in one 9,232-line `App.jsx` and is about to get Stripe integration. Shipping the play visualizer as a standalone project lets it iterate fast without risking Courtside's stability. The data schema is designed to match Courtside's `teams/{tid}/plays/{playId}` Firestore path from day one, so later integration is a drop-in, not a rewrite.

See `CONTEXT.md` for the architecture notes and decisions.

## Stack

- Vite 5 + React 18 (JSX, no TypeScript — matches Courtside)
- Tailwind CSS
- Framer Motion (keyframe animation between frames)
- React Router 6
- SVG-based court rendering
- localStorage persistence, with a clean migration path to Firestore
- PWA (installable on phones for sideline use)
- Deployed to Netlify

## Dev

```sh
npm install
npm run dev       # http://localhost:5175
npm run build
npm run preview
npm run lint
```

## Folder layout

```
src/
  court/          # SVG court rendering + geometry constants
  viewer/         # kid-facing playback (animation, branching UI)
  editor/         # coach-facing canvas (drag-drop, frame timeline, arrows)
  data/           # JSON schema, play library, persistence helpers
  play-library/   # home / library page
  App.jsx         # router
  main.jsx        # entry
```

## Play data model (short version)

A `Play` has:

- metadata (name, type, description, tags)
- `actors[]` — offensive, defensive, coach/ghost markers
- `frames[]` — keyframe snapshots, each with actor positions + ball holder
- `arrows[]` — pass / cut / dribble / screen marks, scoped to a frame
- `branches[]` — decision points that fork the animation based on what the defense does
- `annotations[]` — per-frame coach notes

Full schema: `src/data/schema.js` (Task #2).

## Status

Scaffold complete. See the task list for build arc through MVP.
