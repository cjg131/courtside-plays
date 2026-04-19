// 1-2-2 Zone Defense : Basics.
//
// CJ's foundational defense teaching. Kids play X1-X5. Linear storyline :
//   shell -> swing to wing -> wing rotation [QUIZ]
//         -> swing to corner -> corner rotation [QUIZ]
//         -> skip back -> wing recovery
//         -> reversal to top -> top recovery [QUIZ]
//         -> back to shell.
//
// Every pass is broken into release + in-flight + arrival, and every
// rotation shows an intermediate step plus a final resting picture. Ball
// movement on non-quiz frames is autoplayed; quizStop frames pause for the
// kid to drag all five defenders into the right spot.
//
// Coordinate system (confirmed against Court.jsx):
//   - Half court, 50 wide x 47 deep. Vertical. Baseline BOTTOM (y=47),
//     midcourt TOP (y=0). Rim at (25, 41.75). FT line y=28. Arc top y=19.75.
//   - Lane: x in [19, 31], y in [28, 47]. Elbows (19, 28) / (31, 28).
//   - Low blocks ~3ft off baseline on lane line: (19, 44) / (31, 44).
//   - Offense attacks DOWN the screen.

import {
  createPlay, createActor, createFrame,
  createArrow, createAnnotation, PLAY_TYPES, COURT_VIEWS, COURT_ORIENTATIONS,
} from './schema.js';
import { ACTOR_TYPES, ARROW_TYPES } from '../court/constants.js';

export function build122ZoneBasicsPlay() {
  const play = createPlay({
    name: '1-2-2 Zone Defense : Basics',
    type: PLAY_TYPES.DEFENSE,
    description:
      'Watch Teach mode to see the full rotation. Flip to Quiz mode: the ball ' +
      'moves on its own, and at each read you drag all five defenders into the ' +
      'right spots and submit. Three reads: wing, corner, and recovery.',
    tags: ['defense', 'zone', '1-2-2', 'basics', 'quiz', 'cyo'],
    view: COURT_VIEWS.HALF,
    orientation: COURT_ORIENTATIONS.VERTICAL,
  });

  // ---- Actors -------------------------------------------------------------
  const o1 = createActor({ kind: ACTOR_TYPES.OFFENSE, label: '1' });
  const o2 = createActor({ kind: ACTOR_TYPES.OFFENSE, label: '2' });
  const o3 = createActor({ kind: ACTOR_TYPES.OFFENSE, label: '3' });
  const o4 = createActor({ kind: ACTOR_TYPES.OFFENSE, label: '4' });
  const o5 = createActor({ kind: ACTOR_TYPES.OFFENSE, label: '5' });
  const x1 = createActor({ kind: ACTOR_TYPES.DEFENSE, label: 'X1' });
  const x2 = createActor({ kind: ACTOR_TYPES.DEFENSE, label: 'X2' });
  const x3 = createActor({ kind: ACTOR_TYPES.DEFENSE, label: 'X3' });
  const x4 = createActor({ kind: ACTOR_TYPES.DEFENSE, label: 'X4' });
  const x5 = createActor({ kind: ACTOR_TYPES.DEFENSE, label: 'X5' });
  play.actors = [o1, o2, o3, o4, o5, x1, x2, x3, x4, x5];

  // ---- Offensive positions (stay put) -------------------------------------
  const OFF = {
    [o1.id]: { x: 25, y: 12 },
    [o2.id]: { x: 40, y: 22 },
    [o3.id]: { x: 10, y: 22 },
    [o4.id]: { x: 47, y: 43 },
    [o5.id]: { x: 3,  y: 43 },
  };

  // ---- Defensive rotation snapshots --------------------------------------
  // Shell : starting 1-2-2 alignment.
  const SHELL = {
    [x1.id]: { x: 25, y: 17 },
    [x2.id]: { x: 19, y: 28 },
    [x3.id]: { x: 31, y: 28 },
    [x4.id]: { x: 31, y: 44 },
    [x5.id]: { x: 19, y: 44 },
  };

  // Wing rotation, ball at right wing (O2). Same-side elbow (X3) goes,
  // top (X1) drops to complete the double, weak elbow (X2) slides over,
  // weak block (X5) bumps up to middle help, strong block (X4) holds.
  const WING = {
    [x1.id]: { x: 33, y: 19 },   // dropped to strong-side high help
    [x2.id]: { x: 22, y: 22 },   // slid over to cover the top
    [x3.id]: { x: 37, y: 22 },   // out to the ball, wing-level
    [x4.id]: { x: 31, y: 44 },   // holds the strong block
    [x5.id]: { x: 24, y: 38 },   // middle help, front of the rim
  };

  // Wing halfway : defenders mid-slide. Intermediate teach frame.
  const WING_HALF = {
    [x1.id]: { x: 29, y: 18 },
    [x2.id]: { x: 21, y: 25 },
    [x3.id]: { x: 34, y: 25 },
    [x4.id]: { x: 31, y: 44 },
    [x5.id]: { x: 21, y: 41 },
  };

  // Corner rotation, ball at right corner (O4). Strong-side block (X4)
  // goes to ball. Strong-side wing (X3) slides down with the ball to trap.
  // Weak block (X5) crosses the lane to cover the block X4 left. Top (X1)
  // drops HARD into the paint/strong-side elbow next to X2 : this is CJ's
  // correction. X2 bumps to middle help.
  const CORNER = {
    [x1.id]: { x: 29, y: 28 },   // strong-side elbow, paint-adjacent, next to X2
    [x2.id]: { x: 24, y: 30 },   // middle help, front of the rim
    [x3.id]: { x: 42, y: 36 },   // trap with X4 in the corner
    [x4.id]: { x: 44, y: 42 },   // on ball in the corner
    [x5.id]: { x: 31, y: 44 },   // crossed to the strong block
  };

  // Corner halfway : defenders mid-rotation.
  const CORNER_HALF = {
    [x1.id]: { x: 31, y: 23 },
    [x2.id]: { x: 23, y: 26 },
    [x3.id]: { x: 40, y: 29 },
    [x4.id]: { x: 38, y: 43 },
    [x5.id]: { x: 27, y: 41 },
  };

  // Wing recovery : ball skipped from corner back to O2. Defense has to
  // undo the corner trap and re-establish wing coverage.
  const WING_RECOVER_HALF = {
    [x1.id]: { x: 31, y: 22 },
    [x2.id]: { x: 24, y: 27 },
    [x3.id]: { x: 39, y: 28 },
    [x4.id]: { x: 37, y: 43 },
    [x5.id]: { x: 27, y: 42 },
  };

  // Top recovery : ball reversed from O2 back to O1 at the top. Weak-side
  // defender bumps the ball until X1 recovers home.
  const RECOVER_HALF = {
    [x1.id]: { x: 29, y: 19 },
    [x2.id]: { x: 25, y: 22 },
    [x3.id]: { x: 33, y: 25 },
    [x4.id]: { x: 33, y: 44 },
    [x5.id]: { x: 23, y: 43 },
  };

  const RECOVER = SHELL; // shell is the recovery target

  // ---- Helpers ------------------------------------------------------------
  // Build a positions array from a defense snapshot; offense is fixed.
  function pos(defense) {
    return [
      ...Object.entries(OFF).map(([id, p]) => ({ actorId: id, x: p.x, y: p.y })),
      ...Object.entries(defense).map(([id, p]) => ({ actorId: id, x: p.x, y: p.y })),
    ];
  }

  const mk = (label, positions, ballHolder, opts = {}) => createFrame({
    label,
    durationMs: opts.durationMs ?? 900,
    positions,
    ballHolder: ballHolder ?? null,
    ballPosition: opts.ballPosition ?? null,
    arrows: opts.arrows ?? [],
    annotations: opts.annotations ?? [],
    quizStop: opts.quizStop ?? false,
    coachNote: opts.coachNote ?? '',
  });

  // Ball-in-flight frame builder. Ball sits at a midpoint, no holder.
  const flight = (label, defense, from, to, t = 0.5, opts = {}) =>
    mk(label, pos(defense), null, {
      ...opts,
      ballPosition: {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      },
      durationMs: opts.durationMs ?? 350,
    });

  // Offensive positions shortcuts.
  const P_O1 = OFF[o1.id];
  const P_O2 = OFF[o2.id];
  const P_O4 = OFF[o4.id];

  const frames = [];

  // ---- Frame 1 : Shell ---------------------------------------------------
  frames.push(mk(
    '1-2-2 shell alignment',
    pos(SHELL),
    o1.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'Starting shape. X1 above the arc. X2/X3 on the elbows. X4/X5 on the blocks.',
      })],
    },
  ));

  // ---- Frames 2-4 : O1 -> O2 (swing to wing) -----------------------------
  frames.push(mk(
    'O1 passes to the right wing',
    pos(SHELL),
    o1.id,
    {
      durationMs: 600,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS, actorId: o1.id,
        points: [P_O1, P_O2],
      })],
    },
  ));
  frames.push(flight('Ball in flight to O2', SHELL, P_O1, P_O2, 0.55));
  frames.push(mk(
    'O2 catches on the wing',
    pos(SHELL),
    o2.id,
    {
      durationMs: 800,
      annotations: [createAnnotation({
        text: 'Ball is on the wing. Defense still in shell. Who closes?',
      })],
    },
  ));

  // ---- Frames 5-6 : Wing rotation (intermediate + final QUIZ) ------------
  frames.push(mk(
    'Wing rotation (sliding)',
    pos(WING_HALF),
    o2.id,
    {
      durationMs: 700,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [SHELL[x3.id], WING[x3.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [SHELL[x1.id], WING[x1.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [SHELL[x2.id], WING[x2.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [SHELL[x5.id], WING[x5.id]] }),
      ],
    },
  ));
  frames.push(mk(
    'Wing rotation : X3 + X1 double',
    pos(WING),
    o2.id,
    {
      durationMs: 1600,
      quizStop: true,
      coachNote:
        'Same-side elbow goes. X3 sprints to the ball. X1 drops down to double. ' +
        'X2 slides across to cover the top. X5 bumps to middle help. X4 stays on the block.',
    },
  ));

  // ---- Frames 7-9 : O2 -> O4 (swing to corner) ---------------------------
  frames.push(mk(
    'O2 passes to the corner',
    pos(WING),
    o2.id,
    {
      durationMs: 600,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS, actorId: o2.id,
        points: [P_O2, P_O4],
      })],
    },
  ));
  frames.push(flight('Ball in flight to O4', WING, P_O2, P_O4, 0.55));
  frames.push(mk(
    'O4 catches in the corner',
    pos(WING),
    o4.id,
    {
      durationMs: 800,
      annotations: [createAnnotation({
        text: 'Ball in the corner. Defense still in wing shape. Who traps?',
      })],
    },
  ));

  // ---- Frames 10-11 : Corner rotation (intermediate + final QUIZ) --------
  frames.push(mk(
    'Corner rotation (sliding)',
    pos(CORNER_HALF),
    o4.id,
    {
      durationMs: 700,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [WING[x4.id], CORNER[x4.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [WING[x3.id], CORNER[x3.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [WING[x5.id], CORNER[x5.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [WING[x1.id], CORNER[x1.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [WING[x2.id], CORNER[x2.id]] }),
      ],
    },
  ));
  frames.push(mk(
    'Corner rotation : X4 + X3 trap',
    pos(CORNER),
    o4.id,
    {
      durationMs: 1600,
      quizStop: true,
      coachNote:
        'Same-side block goes. X4 sprints to the ball. X3 slides down to trap. ' +
        'X5 crosses the lane to cover the block X4 left. X1 DROPS into the paint ' +
        'at the strong-side elbow, right next to X2. X2 bumps to middle help. ' +
        'X1 near X2 takes away the skip to the wing AND the high-post flash.',
    },
  ));

  // ---- Frames 12-14 : O4 -> O2 (skip back) -------------------------------
  frames.push(mk(
    'O4 skips back to the wing',
    pos(CORNER),
    o4.id,
    {
      durationMs: 600,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS, actorId: o4.id,
        points: [P_O4, P_O2],
      })],
    },
  ));
  frames.push(flight('Skip pass in flight', CORNER, P_O4, P_O2, 0.5));
  frames.push(mk(
    'O2 catches on the wing again',
    pos(CORNER),
    o2.id,
    {
      durationMs: 800,
      annotations: [createAnnotation({
        text: 'Skip back to the wing. Defense is in the corner shape and has to recover.',
      })],
    },
  ));

  // ---- Frames 15-16 : Wing recovery --------------------------------------
  frames.push(mk(
    'Wing recovery (sliding)',
    pos(WING_RECOVER_HALF),
    o2.id,
    {
      durationMs: 700,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [CORNER[x1.id], WING[x1.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [CORNER[x3.id], WING[x3.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [CORNER[x4.id], WING[x4.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [CORNER[x5.id], WING[x5.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [CORNER[x2.id], WING[x2.id]] }),
      ],
    },
  ));
  frames.push(mk(
    'Wing recovered : back in wing rotation',
    pos(WING),
    o2.id,
    {
      durationMs: 1200,
      annotations: [createAnnotation({
        text: 'Back in wing rotation. Defense survives the skip.',
      })],
    },
  ));

  // ---- Frames 17-19 : O2 -> O1 (reversal to top) -------------------------
  frames.push(mk(
    'O2 reverses to the top',
    pos(WING),
    o2.id,
    {
      durationMs: 600,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS, actorId: o2.id,
        points: [P_O2, P_O1],
      })],
    },
  ));
  frames.push(flight('Ball in flight to O1', WING, P_O2, P_O1, 0.55));
  frames.push(mk(
    'O1 catches at the top',
    pos(WING),
    o1.id,
    {
      durationMs: 800,
      annotations: [createAnnotation({
        text: 'Reversal. Weak-side defender has to bump until X1 recovers.',
      })],
    },
  ));

  // ---- Frames 20-21 : Top recovery (intermediate + final QUIZ) ----------
  frames.push(mk(
    'Top recovery (sliding)',
    pos(RECOVER_HALF),
    o1.id,
    {
      durationMs: 700,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [WING[x2.id], RECOVER[x2.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [WING[x1.id], RECOVER[x1.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [WING[x3.id], RECOVER[x3.id]] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [WING[x5.id], RECOVER[x5.id]] }),
      ],
    },
  ));
  frames.push(mk(
    'Back to shell',
    pos(RECOVER),
    o1.id,
    {
      durationMs: 1600,
      quizStop: true,
      coachNote:
        'On a reversal, the nearest weak-side defender bumps the ball until X1 recovers. ' +
        'X1 sprints back to the top. X2, X3 slide back to their elbows. X5 slides back to ' +
        'the weak block. Shape returns. Never leave the top-of-key shooter alone.',
    },
  ));

  // ---- Frame 22 : Shell reset --------------------------------------------
  frames.push(mk(
    'Shell : ready for the next possession',
    pos(SHELL),
    o1.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'Shape always returns to the shell. The shape does the work.',
      })],
    },
  ));

  play.frames = frames;
  play.branches = [];

  return play;
}
