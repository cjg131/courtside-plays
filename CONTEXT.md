# Courtside Plays : Working Context

Read this at the start of any session working on this app.

## What it is

An interactive play visualizer. Coach builds a play in the editor, kid (or parent) watches it in the viewer. Plays aren't linear videos : they branch. At a decision point the kid picks what the defense is doing and the animation continues down that branch. This is how CJ wants to teach reading the game.

Three real plays are the north-star content: **press break**, **defense**, and **press**. Everything else is scaffolding around making those three feel great.

## Why standalone, not inside Courtside

Courtside's `courtside-deploy/App.jsx` is 9,232 lines and had a TDZ crash as recently as 2026-04-17 during an OT feature change. Stripe integration is imminent and is the top priority for that codebase. Mixing a canvas-heavy animation feature into that file right now is asking for regressions that would block Stripe.

Decision: ship standalone first. Design the JSON schema to mirror Courtside's `teams/{tid}/plays/{playId}` Firestore path from day one so plugging in later is a data-loader swap, not a rewrite.

## Stack decisions

- **Vite + React 18 + JSX.** Matches Courtside. No TypeScript : CJ's not a full-time coder and the context cost isn't worth it here.
- **SVG over Canvas** for the court. Better click handling, easier to animate with Framer Motion, semantic coordinates for free.
- **Framer Motion** for actor/ball motion between keyframes. `layout` + `animate` handle smooth interpolation with near-zero ceremony.
- **Tailwind** for styling, mirrored tokens with Courtside so design bleeds stay consistent.
- **localStorage first**, with all persistence going through a thin `storage.js` so the swap to Firestore (Task #22) is one file.

## Play data model (summary)

```
Play
 ├── meta { id, name, type, description, tags, createdAt, updatedAt }
 ├── court { orientation, halfOrFull }
 ├── actors[]            // stable identity across frames
 ├── frames[] (ordered)  // each is a keyframe snapshot
 │    ├── positions[]    // { actorId, x, y }
 │    ├── ballHolder     // actorId or null
 │    ├── arrows[]       // pass/cut/dribble/screen, scoped to this frame
 │    └── annotations[]  // coach notes
 └── branches[]          // { fromFrameIdx, label, prompt, options[{label, nextFrames[]}] }
```

Full schema lands in Task #2.

## Folder layout

```
src/
  court/          # SVG court + geometry constants + actor/ball primitives
  viewer/         # animation engine, playback controls, branching UI
  editor/         # drag-drop canvas, frame timeline, arrow tool, branch definer
  data/           # schema, persistence, sample plays, encode/decode for share URLs
  play-library/   # home / library page
```

## Task arc

22 tasks. Scaffold (#1) → schema (#2) → court SVG (#3) → actor/ball (#4) → animation (#5) → arrows (#6) → playback (#7) → branching (#8) → annotations (#9) → sample plays (#10) → library (#11) → editor canvas (#12) → timeline (#13) → arrow tool (#14) → branch definer (#15) → save/load (#16) → share URL (#17) → deploy (#18) → encode the three real plays (#19) → mobile + PWA polish (#20) → end-to-end verify (#21) → Courtside integration (#22, deferred).

## Known unknowns / deferred

- Will Firestore's 1 MiB doc ceiling bite us for long plays? Schema is lean but track this once real plays land.
- Video import (drop a practice clip as a layer behind the animation) : not in MVP.
- Multi-team sharing outside CJ's own library : share URL is enough for MVP.

## Last updated

2026-04-18 : scaffold complete.
