// 1-2-2 Zone Defense : Basics.
//
// CJ's foundational defense teaching. Kids play X1-X5. Each quizStop is a
// core rotation read. The play is linear : ball moves, defense rotates, ball
// moves again, defense rotates again. In teach mode it all animates through.
// In quiz mode, the kid drags every defender into position at each quizStop
// and submits. Right answer = ball advances. Wrong = overlay shows the
// correct rotation and the reason behind it.
//
// Labeling convention (matches CJ's rotations):
//   X1 top center (above the arc)
//   X2 LEFT elbow       X3 RIGHT elbow
//   X5 LEFT low block   X4 RIGHT low block
//   Wing doubles   : X1+X2 at left wing, X1+X3 at right wing (same-side elbow goes)
//   Corner doubles : X2+X5 at left corner, X3+X4 at right corner (same-side block goes)
//   Ball reversal  : nearest weak-side defender bumps up until X1 recovers
//
// Coordinate system (confirmed against Court.jsx):
//   - Half court, 50 wide x 47 deep. Vertical orientation.
//   - Baseline at BOTTOM of SVG (y = 47). Midcourt at TOP (y = 0).
//   - Rim at (25, 41.75). FT line at y = 28. Top of arc at y = 19.75.
//   - Lane: x in [19, 31], y in [28, 47]. Elbows = (19, 28) and (31, 28).
//   - Low blocks ~3ft from baseline on the lane line: (19, 44) and (31, 44).
//   - Offense attacks DOWN the screen (toward y=47).

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
      'Watch once in Teach mode, then switch to Quiz mode. The ball moves, you drag all 5 defenders into the right spots, and submit. Three core reads: wing double, corner double, weak-side bump on reversal.',
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

  // ---- Home positions (shell) --------------------------------------------

  const home = new Map([
    // Offense : 5-out, all behind the arc
    [o1.id, { x: 25, y: 12 }],
    [o2.id, { x: 40, y: 22 }],
    [o3.id, { x: 10, y: 22 }],
    [o4.id, { x: 47, y: 43 }],
    [o5.id, { x: 3,  y: 43 }],
    // Defense : 1-2-2 shell
    [x1.id, { x: 25, y: 17 }],
    [x2.id, { x: 19, y: 28 }],
    [x3.id, { x: 31, y: 28 }],
    [x5.id, { x: 19, y: 44 }],
    [x4.id, { x: 31, y: 44 }],
  ]);

  // Build a positions array from home + overrides keyed by actor id.
  function pos(overrides = {}) {
    return Array.from(home.entries()).map(([id, base]) => {
      const o = overrides[id];
      return { actorId: id, x: o ? o.x : base.x, y: o ? o.y : base.y };
    });
  }

  const mk = (label, positions, ballHolder, opts = {}) => createFrame({
    label,
    durationMs: opts.durationMs ?? 1200,
    positions,
    ballHolder: ballHolder ?? null,
    arrows: opts.arrows ?? [],
    annotations: opts.annotations ?? [],
    // v2 extras (tolerated by schema.createFrame + validatePlay):
    quizStop: opts.quizStop ?? false,
    coachNote: opts.coachNote ?? '',
  });

  // ---- The rotations the kids have to nail -------------------------------
  //
  // Each is a defender-only position delta from the previous state. Stored
  // as a const so the quiz frame (target state) and any downstream "ball
  // moves while defense holds" frames can share the same defensive snapshot.

  const wingRotation = {
    [x3.id]: { x: 37, y: 23 },   // X3 closes out on the ball on the wing
    [x1.id]: { x: 34, y: 20 },   // X1 drops to complete the wing double
    [x2.id]: { x: 22, y: 22 },   // X2 slides to cover the top
    [x5.id]: { x: 24, y: 38 },   // X5 bumps to middle help
    // X4 stays at the right block
  };

  // Corner coverage. X1 DROPS into the 4->2 skip-pass lane at the same y
  // as X2. This is the fix CJ flagged : X1 can't stay at the top or the
  // skip back to the wing is wide open.
  const cornerRotation = {
    [x4.id]: { x: 44, y: 42 },   // X4 sprints to the corner
    [x3.id]: { x: 42, y: 38 },   // X3 slides down with the ball for the trap
    [x5.id]: { x: 31, y: 44 },   // X5 crosses the lane to cover the block X4 just left
    [x1.id]: { x: 40, y: 28 },   // X1 drops into the 4->2 skip-pass lane (CJ's fix)
    [x2.id]: { x: 25, y: 30 },   // X2 bumps to weak-side middle help
  };

  // Recovery on ball reversal. Weak-side defender (X2) bumps up to cover
  // the ball at the top of the key until X1 recovers. Everyone slides back
  // toward shell as the ball is in the air.
  const recoveryRotation = {
    [x1.id]: { x: 25, y: 17 },   // X1 recovers all the way back to the top
    [x2.id]: { x: 25, y: 20 },   // X2 bumps up to the ball at the top
    [x3.id]: { x: 31, y: 28 },   // X3 slides back to right elbow
    [x4.id]: { x: 31, y: 44 },   // X4 retreats to right block
    [x5.id]: { x: 19, y: 44 },   // X5 slides back across to left block
  };

  // ---- Frames (linear, no branches) --------------------------------------

  // bf0 : Shell alignment. The starting picture.
  const bf0 = mk(
    'Shell : 1-2-2 alignment',
    pos(),
    o1.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'The 1-2-2 shell. X1 above the arc. X2 + X3 on the elbows. X4 + X5 on the blocks.',
      })],
    },
  );

  // bf1 : Ball moves from O1 to O2 on the right wing. Defense has not
  //       rotated yet : they are still in the shell.
  const bf1 = mk(
    'Ball swings to the right wing',
    pos(),
    o2.id,
    {
      durationMs: 1000,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS,
        actorId: o1.id,
        points: [{ x: 25, y: 12 }, { x: 40, y: 22 }],
      })],
      annotations: [createAnnotation({
        text: 'Ball on the right wing. Defense still in shell. Who closes?',
      })],
    },
  );

  // bf2 : QUIZ. Defense rotates to the wing coverage. Same ball position
  //       as bf1. Kid has to drag the defenders here.
  const bf2 = mk(
    'Wing rotation : X3 + X1 double',
    pos(wingRotation),
    o2.id,
    {
      durationMs: 1400,
      quizStop: true,
      coachNote:
        'Same-side elbow goes. X3 sprints out to the ball on the wing. X1 drops down ' +
        'from the top to complete the double team. X2 slides over to cover where X1 ' +
        'left. X5 bumps to middle help. X4 holds the block.',
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [{ x: 31, y: 28 }, { x: 37, y: 23 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [{ x: 25, y: 17 }, { x: 34, y: 20 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [{ x: 19, y: 28 }, { x: 22, y: 22 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [{ x: 19, y: 44 }, { x: 24, y: 38 }] }),
      ],
    },
  );

  // bf3 : Ball moves from O2 wing to O4 right corner. Defense holds its
  //       wing-rotation shape while the ball is in the air.
  const bf3 = mk(
    'Ball swings to the right corner',
    pos(wingRotation),
    o4.id,
    {
      durationMs: 1000,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS,
        actorId: o2.id,
        points: [{ x: 40, y: 22 }, { x: 47, y: 43 }],
      })],
      annotations: [createAnnotation({
        text: 'O2 breaks the double with a pass to the corner. Now what?',
      })],
    },
  );

  // bf4 : QUIZ. Corner trap rotation. This is the one CJ flagged : X1 has
  //       to drop way lower than shell to take away the skip back to O2.
  const bf4 = mk(
    'Corner rotation : X4 + X3 trap',
    pos(cornerRotation),
    o4.id,
    {
      durationMs: 1500,
      quizStop: true,
      coachNote:
        'Same-side block goes to the corner. X4 sprints to the ball. X3 slides down ' +
        'to complete the trap. X5 crosses the lane to cover the block X4 just left. ' +
        'X1 DROPS into the 4->2 skip-pass lane, roughly equal to X2 in height. X2 ' +
        'bumps to middle help. The two hardest passes to give up here are the skip ' +
        'to the wing and the dump to the block.',
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [{ x: 31, y: 44 }, { x: 44, y: 42 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [{ x: 37, y: 23 }, { x: 42, y: 38 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [{ x: 24, y: 38 }, { x: 31, y: 44 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [{ x: 34, y: 20 }, { x: 40, y: 28 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [{ x: 22, y: 22 }, { x: 25, y: 30 }] }),
      ],
    },
  );

  // bf5 : O4 bails out. Long reversal pass back to O1 at the top. Defense
  //       still in corner-trap shape while the ball travels.
  const bf5 = mk(
    'O4 reverses to the top',
    pos(cornerRotation),
    o1.id,
    {
      durationMs: 1100,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS,
        actorId: o4.id,
        points: [{ x: 47, y: 43 }, { x: 25, y: 12 }],
      })],
      annotations: [createAnnotation({
        text: 'O4 reverses. Defense has to recover the shape on the fly.',
      })],
    },
  );

  // bf6 : QUIZ. Weak-side bump + recovery.
  const bf6 = mk(
    'Recovery : weak-side bump',
    pos(recoveryRotation),
    o1.id,
    {
      durationMs: 1500,
      quizStop: true,
      coachNote:
        'On a reversal, the nearest weak-side defender bumps the ball until X1 ' +
        'recovers. X2 was middle-help on the corner trap, so X2 bumps up to the ' +
        'top. X1 sprints back to the top. X3, X4, X5 retreat toward their shell ' +
        'spots. Never leave the top-of-key shooter alone on a swing.',
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [{ x: 25, y: 30 }, { x: 25, y: 20 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [{ x: 40, y: 28 }, { x: 25, y: 17 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [{ x: 42, y: 38 }, { x: 31, y: 28 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [{ x: 44, y: 42 }, { x: 31, y: 44 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [{ x: 31, y: 44 }, { x: 19, y: 44 }] }),
      ],
    },
  );

  // bf7 : Shell reset. The shape always returns.
  const bf7 = mk(
    'Shell reset',
    pos(),
    o1.id,
    {
      durationMs: 1200,
      annotations: [createAnnotation({
        text: 'Back to shell. Every possession the shape returns. The shape does the work.',
      })],
    },
  );

  play.frames = [bf0, bf1, bf2, bf3, bf4, bf5, bf6, bf7];
  play.branches = [];

  return play;
}
