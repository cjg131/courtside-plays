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

## Location

Canonical working copy: `~/cjwork/code/courtside-plays/` (NOT in Dropbox). Set up by running `bash ~/Dropbox/CJ/Claude/CoWork/About\ Me/scripts/cjwork-migrate.sh` once per Mac. See `CLAUDE.md` for the full workspace explanation.

This CONTEXT.md travels with the code — after migration it lives at `~/cjwork/code/courtside-plays/CONTEXT.md`. Before migration it was at `Apps/CourtsidePlays/CONTEXT.md` in Dropbox.

## GitHub + Netlify

- **Repo:** https://github.com/cjg131/courtside-plays (public, default branch `main`)
- **Auth:** PAT in `About Me/START-HERE.md`. Remote URL pattern: `https://<token>@github.com/cjg131/courtside-plays.git` for push; strip the token back out afterward.
- **Netlify:** `netlify.toml` is already in the repo (SPA fallback + cache headers + Node 20). To wire deploys: https://app.netlify.com/start → "Import from Git" → pick `cjg131/courtside-plays`. Zero build config required.

### Session rhythm

Start: `cd ~/cjwork/code/courtside-plays && git pull`
End: `git add -A && git commit -m "..." && git push`

## Last updated

2026-04-18 : scaffold complete, editor + viewer + share URL all live, GitHub repo up, Netlify config staged. Canonical checkout moved to `~/cjwork/code/courtside-plays/` (out of Dropbox).

## Quiz mode (shipped 2026-04-18)

- Schema v2 adds `isQuiz`, `role: { actorId, description }` on branches and `isCorrect` + `wrongReason` on options.
- `migratePlay` forward-ports v1 plays (fills quiz fields with defaults).
- `usePlayback` pauses at unresolved branches, splices wrong-answer teaching clips inline, then lets the kid retry.
- `QuizPrompt` + `WrongAnswerFeedback` render the question, highlight the "you are" actor on court, and show the specific reason after a miss.
- Editor (`BranchEditor`) has the full quiz authoring UI.

## Sample play: 1-2-2 Zone Defense : Basics (id `122-zone-basics`)

- File: `src/data/zone122Quiz.js`, export `build122ZoneBasicsPlay()`.
- Five basics-first reads: top pressure (X1), same-side short-corner pop (X5), weak-side sink (X2), corner double (X3+X4), soft post double (X2).
- Labeling convention (matches CJ's rotations): X2/X5 LEFT side, X3/X4 RIGHT side. Corner doubles are X2+X5 (left) or X3+X4 (right). Post double is SOFT: active hands, never body.
- 10 base frames + 10 teaching clips. Branches attached at frame idx 0, 2, 4, 6, 8.
- Skip-pass and high-post variants deferred to a future advanced play.

## Last updated

2026-04-18 : 1-2-2 zone play rebuilt (basics-first, correct alignment). Deployed via Netlify commit 8a07fb5.
