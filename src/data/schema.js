// Play data schema for Courtside Plays.
//
// Design goals:
// 1. Keep actor identity stable across frames : we animate BY actorId, not by array index.
// 2. Arrows + annotations attach to a specific frame. Branches attach to a specific
//    frame index and define what happens next based on a read.
// 3. JSON-serializable end-to-end so we can localStorage it, share via URL, and later
//    drop straight into Firestore under teams/{tid}/plays/{playId}.
// 4. Keep the shape flat enough that 1 MiB Firestore ceiling is never a problem
//    for a realistic play (target: < 20 KB per play).
//
// v2 adds quiz mode on top of branches: isQuiz, role (which actor the kid is
// playing), per-option isCorrect + wrongReason for teaching feedback.

import { v4 as uuid } from 'uuid';
import { ARROW_TYPES, ACTOR_TYPES } from '../court/constants.js';

export const CURRENT_SCHEMA_VERSION = 2;

export const PLAY_TYPES = {
  PRESS_BREAK: 'press_break',
  DEFENSE: 'defense',
  PRESS: 'press',
  OFFENSE: 'offense',
  SOB: 'sob',             // sideline out-of-bounds
  BLOB: 'blob',           // baseline out-of-bounds
  DRILL: 'drill',
  OTHER: 'other',
};

export const COURT_ORIENTATIONS = {
  HORIZONTAL: 'horizontal', // baseline at the bottom, natural for a coach drawing on a whiteboard
  VERTICAL: 'vertical',     // natural for mobile portrait
};

export const COURT_VIEWS = {
  HALF: 'half',
  FULL: 'full',
};

// ---- Factory helpers ----------------------------------------------------------

/**
 * Create a brand-new, empty Play with one blank frame.
 * Always call this : never hand-build a play object, or you will forget fields.
 */
export function createPlay({
  name = 'Untitled play',
  type = PLAY_TYPES.OFFENSE,
  description = '',
  tags = [],
  view = COURT_VIEWS.HALF,
  orientation = COURT_ORIENTATIONS.VERTICAL,
} = {}) {
  const now = Date.now();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      id: uuid(),
      name,
      type,
      description,
      tags,
      createdAt: now,
      updatedAt: now,
      createdBy: null,       // filled in when wired to Firestore / auth
    },
    court: {
      view,
      orientation,
    },
    actors: [],
    frames: [createFrame()],
    branches: [],
  };
}

/**
 * Create an actor (player or marker).
 * - offense: numbered jersey (1-5)
 * - defense: X mark, optional label
 * - coach:   used for "imagined opponent" markers in press-break drills
 * - ghost:   branch preview only, never authored directly
 */
export function createActor({
  kind = ACTOR_TYPES.OFFENSE,
  label = '',
  color = null,
} = {}) {
  return {
    id: uuid(),
    kind,
    label,          // e.g. "1", "PG", "X5"
    color,          // optional override, null = use kind default
  };
}

/**
 * Create a single keyframe. A play is a sequence of these.
 * Each frame holds every actor's position AT that moment plus any
 * arrows drawn FROM this frame to the next (or to a branch target).
 */
export function createFrame({
  label = '',
  durationMs = 1200,         // how long to animate INTO this frame from the previous
  positions = [],            // [{ actorId, x, y }] in court feet
  ballHolder = null,         // actorId currently holding the ball, or null for loose / pass-in-air
  ballPosition = null,       // { x, y } when the ball is not tied to an actor
  arrows = [],
  annotations = [],
  quizStop = false,          // v2.1: in quiz mode, playback pauses here until the kid drags defenders + submits
  coachNote = '',            // v2.1: the rotation rule / reason, shown on the submit bar + wrong-answer overlay
} = {}) {
  return {
    id: uuid(),
    label,
    durationMs,
    positions,
    ballHolder,
    ballPosition,
    arrows,
    annotations,
    quizStop,
    coachNote,
  };
}

/**
 * Create an arrow. Type controls the rendering style:
 *  - PASS: dashed
 *  - CUT: solid
 *  - DRIBBLE: wavy
 *  - SCREEN: solid with T-bar end cap
 *
 * Points are court-feet positions. Most arrows are 2 points (start/end) but
 * we allow N for curved cuts (think: L-cut, flare).
 */
export function createArrow({
  type = ARROW_TYPES.CUT,
  actorId = null,     // the actor this arrow belongs to (for cut/dribble), may be null for a pass start
  toActorId = null,   // for a pass: the receiver
  points = [],        // [{x,y}, ...] : at least 2 points
  color = null,       // optional override
  label = '',         // optional tag like "1" or "SCREEN"
} = {}) {
  return {
    id: uuid(),
    type,
    actorId,
    toActorId,
    points,
    color,
    label,
  };
}

/**
 * Per-frame coach note. Shown as an overlay callout during playback.
 */
export function createAnnotation({
  text = '',
  pinTo = null,   // optional { actorId } or { x, y } anchor
  emphasis = false,
} = {}) {
  return {
    id: uuid(),
    text,
    pinTo,
    emphasis,
  };
}

/**
 * Branch : the core "read the game" mechanic.
 *
 * At a given frame index, playback pauses and the viewer picks an option.
 * Each option has a label (what the defense did) and a list of `nextFrames`
 * which get played in order.
 *
 * Quiz mode (v2): if `isQuiz` is true, the branch renders as a question
 * and each option carries `isCorrect` + `wrongReason`. Wrong answers play
 * the teaching clip (option.nextFrames), show the reason, then let the kid
 * retry. Correct answers advance normally.
 *
 * `role` is optional: { actorId, description } tells the kid WHICH player
 * they are for this decision. The viewer highlights that actor on the court.
 *
 * Storing branch frames inline keeps the play self-contained. A future
 * version can add a `nextFrameIds` variant that references frames by id
 * if we need DAG reuse.
 */
export function createBranch({
  atFrameIdx = 0,
  prompt = 'What is the defense doing?',
  options = [],   // [{ id, label, nextFrames: Frame[], isCorrect, wrongReason }]
  isQuiz = false,
  role = null,    // optional { actorId, description }
} = {}) {
  return {
    id: uuid(),
    atFrameIdx,
    prompt,
    options,
    isQuiz,
    role,
  };
}

export function createBranchOption({
  label = '',
  nextFrames = [],
  isCorrect = false,
  wrongReason = '',
} = {}) {
  return {
    id: uuid(),
    label,
    nextFrames,
    isCorrect,
    wrongReason,
  };
}

// ---- Validation ---------------------------------------------------------------

/**
 * Minimal runtime validation. Returns { ok, errors[] }.
 * Used by the storage layer before saving and after loading from a share URL.
 */
export function validatePlay(play) {
  const errors = [];
  if (!play || typeof play !== 'object') {
    errors.push('play is not an object');
    return { ok: false, errors };
  }
  if (play.schemaVersion !== 1 && play.schemaVersion !== 2) {
    errors.push(`unsupported schemaVersion: ${play.schemaVersion}`);
  }
  if (!play.meta?.id) errors.push('missing meta.id');
  if (!play.meta?.name) errors.push('missing meta.name');
  if (!Array.isArray(play.actors)) errors.push('actors is not an array');
  if (!Array.isArray(play.frames)) errors.push('frames is not an array');
  if (!Array.isArray(play.branches)) errors.push('branches is not an array');
  if (play.frames?.length === 0) errors.push('play has no frames');

  const actorIds = new Set((play.actors || []).map(a => a.id));
  (play.frames || []).forEach((frame, i) => {
    if (!frame.id) errors.push(`frame[${i}] missing id`);
    (frame.positions || []).forEach((p, j) => {
      if (!actorIds.has(p.actorId)) {
        errors.push(`frame[${i}].positions[${j}] references unknown actor ${p.actorId}`);
      }
    });
    if (frame.ballHolder && !actorIds.has(frame.ballHolder)) {
      errors.push(`frame[${i}].ballHolder references unknown actor ${frame.ballHolder}`);
    }
  });

  (play.branches || []).forEach((b, i) => {
    if (b.atFrameIdx < 0 || b.atFrameIdx >= (play.frames?.length ?? 0)) {
      errors.push(`branches[${i}].atFrameIdx out of range`);
    }
    if (!Array.isArray(b.options) || b.options.length < 2) {
      errors.push(`branches[${i}] needs at least 2 options`);
    }
    if (b.isQuiz) {
      if (b.role?.actorId && !actorIds.has(b.role.actorId)) {
        errors.push(`branches[${i}].role references unknown actor ${b.role.actorId}`);
      }
      const correctCount = (b.options || []).filter(o => o.isCorrect).length;
      if (correctCount < 1) {
        errors.push(`branches[${i}] is a quiz but has no option marked isCorrect`);
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

// ---- Migrations ---------------------------------------------------------------

/**
 * Migrate old plays forward. v1 -> v2 adds quiz fields on branches + options.
 * Safe to call on already-current plays (no-op).
 */
export function migratePlay(play) {
  if (!play) return play;
  if (!play.schemaVersion) {
    play = { ...play, schemaVersion: 1 };
  }
  if (play.schemaVersion === 1) {
    const branches = (play.branches || []).map(b => ({
      ...b,
      isQuiz: b.isQuiz ?? false,
      role: b.role ?? null,
      options: (b.options || []).map(o => ({
        ...o,
        isCorrect: o.isCorrect ?? false,
        wrongReason: o.wrongReason ?? '',
      })),
    }));
    play = { ...play, schemaVersion: 2, branches };
  }
  return play;
}
