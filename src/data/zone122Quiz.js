// 1-2-2 Zone Defense : Basics.
//
// Full rotation teaching drill. Ball swings top -> right wing -> right corner,
// skip back to wing, reversal to top, then MIRRORS to the left side: top ->
// left wing -> left corner, skip back, reversal. Ends on the shell.
//
// Each pass is structured as THREE frames so the animation reads naturally:
//   1. Release   ball at the passer      defense at the pre-pass snapshot
//   2. In-flight ball at the midpoint    defense at the HALFWAY slide
//   3. Arrival   ball at the receiver    defense at the ROTATED snapshot
// The defenders are already moving while the ball is in the air, and they
// are ALREADY in position by the time the receiver catches it. That is how a
// real zone plays : no teleporting after the catch.
//
// QUIZ STOPS happen on the arrival frame of each new rotation (wing right,
// corner right, wing left, corner left). In quiz mode, playback autoplays
// until the first quiz stop, then pauses. The kid drags all five defenders
// into the right spots and submits. Correct advances; wrong shows the coach
// note.
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
      'Watch Teach mode to see the full rotation across both sides of the floor. ' +
      'Flip to Quiz mode: the ball moves on its own, and at each wing and corner ' +
      'you drag all five defenders into the right spots and submit. Four reads total.',
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

  // ---- Offensive positions (fixed for the whole drill) -------------------
  // O1 top, O2 right wing, O3 left wing, O4 right corner, O5 left corner.
  const OFF = {
    [o1.id]: { x: 25, y: 12 },
    [o2.id]: { x: 40, y: 22 },
    [o3.id]: { x: 10, y: 22 },
    [o4.id]: { x: 47, y: 43 },
    [o5.id]: { x:  3, y: 43 },
  };

  // ---- Defensive snapshots : 1-2-2 alignment and rotations --------------
  // SHELL. X1 above arc, X2 LEFT elbow, X3 RIGHT elbow, X4 RIGHT block,
  // X5 LEFT block.
  const SHELL = {
    [x1.id]: { x: 25, y: 17 },
    [x2.id]: { x: 19, y: 28 },
    [x3.id]: { x: 31, y: 28 },
    [x4.id]: { x: 31, y: 44 },
    [x5.id]: { x: 19, y: 44 },
  };

  // WING_R : ball at right wing. X1 extends out to pressure the ball,
  // X3 sinks down-and-over toward the 3pt line to deflect the skip to
  // the corner, X2 drops to the free throw line in the middle, X4 holds
  // strong-side block, X5 is weak-side middle help.
  const WING_R = {
    [x1.id]: { x: 37, y: 22 },
    [x2.id]: { x: 25, y: 28 },
    [x3.id]: { x: 41, y: 30 },
    [x4.id]: { x: 31, y: 44 },
    [x5.id]: { x: 24, y: 38 },
  };

  // CORNER_R : ball at right corner. X4 on ball, X3 topside of the trap
  // hugging the 3pt line to kill the skip back to the wing, X5 crosses
  // to the strong-side block, X1 drops into the strong-side elbow inside
  // the paint, X2 bumps to middle help.
  const CORNER_R = {
    [x1.id]: { x: 29, y: 28 },
    [x2.id]: { x: 24, y: 30 },
    [x3.id]: { x: 43, y: 38 },
    [x4.id]: { x: 44, y: 42 },
    [x5.id]: { x: 31, y: 44 },
  };

  // WING_L : mirror of WING_R. X1 extends out to pressure the ball on
  // the LEFT wing, X2 sinks down-and-over toward the 3pt line to deflect
  // the skip to the left corner, X3 drops to the free throw line in the
  // middle, X5 holds the strong-side block, X4 is weak-side middle help.
  const WING_L = {
    [x1.id]: { x: 13, y: 22 },
    [x2.id]: { x:  9, y: 30 },
    [x3.id]: { x: 25, y: 28 },
    [x4.id]: { x: 26, y: 38 },
    [x5.id]: { x: 19, y: 44 },
  };

  // CORNER_L : mirror of CORNER_R. X2 on ball in LEFT corner, X5 topside
  // of the trap hugging the 3pt line to kill the skip back to the wing,
  // X4 crosses to the left block, X1 drops into the LEFT strong-side
  // elbow inside the paint, X3 bumps to middle help.
  const CORNER_L = {
    [x1.id]: { x: 21, y: 28 },
    [x2.id]: { x:  6, y: 42 },
    [x3.id]: { x: 26, y: 30 },
    [x4.id]: { x: 19, y: 44 },
    [x5.id]: { x:  7, y: 38 },
  };

  // Halfway slide between two snapshots : averages each defender's position.
  // Used on every in-flight frame so the defense is clearly MOVING while
  // the ball is in the air.
  function halfway(from, to) {
    const m = {};
    for (const id of Object.keys(from)) {
      const a = from[id], b = to[id];
      m[id] = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    return m;
  }

  // ---- Helpers -----------------------------------------------------------
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

  // Shortcuts.
  const P_O1 = OFF[o1.id];
  const P_O2 = OFF[o2.id];
  const P_O3 = OFF[o3.id];
  const P_O4 = OFF[o4.id];
  const P_O5 = OFF[o5.id];

  // Build a full 3-frame pass segment: release, in-flight-with-defense-moving,
  // arrival. Defense is at `fromDef` on release, halfway on flight, `toDef`
  // on arrival. `quiz` marks the arrival as a quiz stop with a coach note.
  function pass({ label, fromActor, toActor, fromPt, toPt, fromDef, toDef, quiz = null }) {
    const mid = { x: (fromPt.x + toPt.x) / 2, y: (fromPt.y + toPt.y) / 2 };
    return [
      mk(
        `${label} : release`,
        pos(fromDef),
        fromActor.id,
        {
          durationMs: 500,
          arrows: [createArrow({
            type: ARROW_TYPES.PASS, actorId: fromActor.id,
            points: [fromPt, toPt],
          })],
        },
      ),
      mk(
        `${label} : ball in flight`,
        pos(halfway(fromDef, toDef)),
        null,
        {
          durationMs: 450,
          ballPosition: mid,
        },
      ),
      mk(
        quiz ? `${label} : QUIZ` : `${label} : arrival`,
        pos(toDef),
        toActor.id,
        {
          durationMs: quiz ? 1600 : 900,
          quizStop: !!quiz,
          coachNote: quiz?.coachNote ?? '',
        },
      ),
    ];
  }

  const frames = [];

  // ---- 1. Shell opening --------------------------------------------------
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

  // ---- 2. Top -> Right Wing (QUIZ) ---------------------------------------
  frames.push(...pass({
    label: 'O1 swings to right wing',
    fromActor: o1, toActor: o2,
    fromPt: P_O1, toPt: P_O2,
    fromDef: SHELL, toDef: WING_R,
    quiz: {
      coachNote:
        'X1 extends out to pressure the ball on the wing. X3 sinks down ' +
        'and over toward the 3pt line to deflect the skip pass to the ' +
        'corner. X2 drops to the free throw line in the middle. X4 holds ' +
        'the strong-side block. X5 is weak-side middle help in front of ' +
        'the rim.',
    },
  }));

  // ---- 3. Right Wing -> Right Corner (QUIZ) ------------------------------
  frames.push(...pass({
    label: 'O2 feeds the right corner',
    fromActor: o2, toActor: o4,
    fromPt: P_O2, toPt: P_O4,
    fromDef: WING_R, toDef: CORNER_R,
    quiz: {
      coachNote:
        'X4 sprints to the ball in the corner. X3 is topside of the trap, ' +
        'hugging the 3pt line to kill the skip back to the wing. X5 ' +
        'crosses the lane to cover the strong-side block. X1 drops to the ' +
        'strong-side elbow inside the paint, killing the high-post flash. ' +
        'X2 bumps to middle help in front of the rim.',
    },
  }));

  // ---- 4. Right Corner -> Right Wing (skip back, recovery) ---------------
  frames.push(...pass({
    label: 'O4 skips back to the wing',
    fromActor: o4, toActor: o2,
    fromPt: P_O4, toPt: P_O2,
    fromDef: CORNER_R, toDef: WING_R,
  }));

  // ---- 5. Right Wing -> Top (reversal) -----------------------------------
  frames.push(...pass({
    label: 'O2 reverses to the top',
    fromActor: o2, toActor: o1,
    fromPt: P_O2, toPt: P_O1,
    fromDef: WING_R, toDef: SHELL,
  }));

  // ---- 6. Top -> Left Wing (QUIZ) ---------------------------------------
  frames.push(...pass({
    label: 'O1 swings to left wing',
    fromActor: o1, toActor: o3,
    fromPt: P_O1, toPt: P_O3,
    fromDef: SHELL, toDef: WING_L,
    quiz: {
      coachNote:
        'Mirror of the right side. X1 extends out to pressure the ball on ' +
        'the LEFT wing. X2 sinks down and over toward the 3pt line to ' +
        'deflect the skip to the left corner. X3 drops to the free throw ' +
        'line in the middle. X5 holds the strong-side block. X4 is ' +
        'weak-side middle help.',
    },
  }));

  // ---- 7. Left Wing -> Left Corner (QUIZ) --------------------------------
  frames.push(...pass({
    label: 'O3 feeds the left corner',
    fromActor: o3, toActor: o5,
    fromPt: P_O3, toPt: P_O5,
    fromDef: WING_L, toDef: CORNER_L,
    quiz: {
      coachNote:
        'Mirror of the right corner. X2 sprints to the ball in the LEFT ' +
        'corner. X5 is topside of the trap, hugging the 3pt line to kill ' +
        'the skip back to the wing. X4 crosses the lane to the left ' +
        'block. X1 drops to the LEFT strong-side elbow inside the paint. ' +
        'X3 bumps to middle help.',
    },
  }));

  // ---- 8. Left Corner -> Left Wing (skip back, recovery) -----------------
  frames.push(...pass({
    label: 'O5 skips back to the wing',
    fromActor: o5, toActor: o3,
    fromPt: P_O5, toPt: P_O3,
    fromDef: CORNER_L, toDef: WING_L,
  }));

  // ---- 9. Left Wing -> Top (reversal) ------------------------------------
  frames.push(...pass({
    label: 'O3 reverses to the top',
    fromActor: o3, toActor: o1,
    fromPt: P_O3, toPt: P_O1,
    fromDef: WING_L, toDef: SHELL,
  }));

  // ---- 10. Shell reset ---------------------------------------------------
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
