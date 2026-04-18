// 1-2-2 Zone Defense : Basics.
//
// CJ's foundational defense teaching. Kids play X1-X5. Each branch is a core
// read : top pressure, same-side short-corner pop, weak-side sink, corner
// double, soft post double. Correct advances. Wrong shows the consequence and
// lets the kid retry.
//
// Labeling convention (matches CJ's rotations):
//   X1 top center
//   X2 LEFT wing       X3 RIGHT wing
//   X5 LEFT low block  X4 RIGHT low block
//   Wing doubles  : X1+X2 at left wing, X1+X3 at right wing
//   Corner doubles: X2+X5 at left corner, X3+X4 at right corner
//   Post double   : soft (middle defender helps with hands, never body)
//
// Coordinates: half-court, 50 wide x 47 deep. Baseline y=0, rim (25, 4.75).
// Vertical orientation. Offense attacks DOWN (toward y=0).
//
// Branch indices 0, 2, 4, 6, 8 : each read has a base frame and a
// "correct outcome" base frame that follows it.

import {
  createPlay, createActor, createFrame, createBranch, createBranchOption,
  createArrow, createAnnotation, PLAY_TYPES, COURT_VIEWS, COURT_ORIENTATIONS,
} from './schema.js';
import { ACTOR_TYPES, ARROW_TYPES } from '../court/constants.js';

export function build122ZoneBasicsPlay() {
  const play = createPlay({
    name: '1-2-2 Zone Defense : Basics',
    type: PLAY_TYPES.DEFENSE,
    description:
      'Five defenders shaped around the key. Five core reads : top pressure, same-side short corner, weak-side sink, corner double, soft post double.',
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

  // ---- Home (shell) map + helper -----------------------------------------

  const home = new Map([
    [o1.id, { x: 25, y: 30 }],  // top with ball
    [o2.id, { x: 42, y: 21 }],  // right wing
    [o3.id, { x: 8,  y: 21 }],  // left wing
    [o4.id, { x: 46, y: 8  }],  // right corner
    [o5.id, { x: 4,  y: 8  }],  // left corner
    [x1.id, { x: 25, y: 24 }],  // top of key
    [x2.id, { x: 17, y: 18 }],  // left wing, FT-line extended
    [x3.id, { x: 33, y: 18 }],  // right wing
    [x4.id, { x: 31, y: 8  }],  // right low block
    [x5.id, { x: 19, y: 8  }],  // left low block
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
    ballPosition: opts.ballPosition ?? null,
    arrows: opts.arrows ?? [],
    annotations: opts.annotations ?? [],
  });

  // ---- Base frames (10) ---------------------------------------------------

  // bf0 : shell. Ball at top with O1.
  const bf0 = mk('Shell. Ball at top.', pos(), o1.id, {
    durationMs: 900,
    annotations: [
      createAnnotation({ text: '1-2-2 shell. Shaped around the key.' }),
    ],
  });

  // bf1 : X1 pressures (correct outcome of Q1).
  const bf1 = mk('X1 pressures the top.', pos({
    [x1.id]: { x: 25, y: 28 },
  }), o1.id, {
    durationMs: 1000,
    arrows: [
      createArrow({
        type: ARROW_TYPES.CUT, actorId: x1.id,
        points: [{ x: 25, y: 24 }, { x: 25, y: 28 }],
      }),
    ],
    annotations: [
      createAnnotation({ text: 'X1 steps up. Pressure 3-4 feet past the arc.' }),
    ],
  });

  // bf2 : ball swung to left wing O3. X2 closing out. X5 still on the block.
  const bf2 = mk('Pass to the left wing.', pos({
    [x1.id]: { x: 22, y: 23 },
    [x2.id]: { x: 12, y: 20 },
  }), o3.id, {
    durationMs: 1200,
    arrows: [
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o1.id, toActorId: o3.id,
        points: [{ x: 25, y: 30 }, { x: 8, y: 21 }],
      }),
    ],
    annotations: [
      createAnnotation({ text: 'Ball at the left wing. X5 : read your rotation.' }),
    ],
  });

  // bf3 : X5 pops to short corner. X2+X1 double at the left wing.
  const bf3 = mk('Short corner pop. Left wing double.', pos({
    [x1.id]: { x: 13, y: 21 },
    [x2.id]: { x: 10, y: 20 },
    [x3.id]: { x: 28, y: 17 },
    [x4.id]: { x: 27, y: 10 },
    [x5.id]: { x: 14, y: 12 },
  }), o3.id, {
    durationMs: 1200,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
        points: [{ x: 19, y: 8 }, { x: 14, y: 12 }] }),
      createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
        points: [{ x: 22, y: 23 }, { x: 13, y: 21 }] }),
    ],
    annotations: [
      createAnnotation({ text: 'X5 to the short corner. X1 helps X2 at the wing.' }),
    ],
  });

  // bf4 : skip back across to right wing O2.
  const bf4 = mk('Skip to the right wing.', pos({
    [x1.id]: { x: 28, y: 22 },
    [x3.id]: { x: 38, y: 20 },
  }), o2.id, {
    durationMs: 1200,
    arrows: [
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o2.id,
        points: [{ x: 8, y: 21 }, { x: 42, y: 21 }],
      }),
    ],
    annotations: [
      createAnnotation({ text: 'Ball left your side, X2. Read it.' }),
    ],
  });

  // bf5 : X2 sinks. Right wing double X3+X1. X4 pops short corner.
  const bf5 = mk('Weak-side sink. Right wing double.', pos({
    [x1.id]: { x: 37, y: 21 },
    [x2.id]: { x: 25, y: 12 },
    [x3.id]: { x: 40, y: 20 },
    [x4.id]: { x: 33, y: 12 },
    [x5.id]: { x: 21, y: 10 },
  }), o2.id, {
    durationMs: 1200,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
        points: [{ x: 17, y: 18 }, { x: 25, y: 12 }] }),
      createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
        points: [{ x: 31, y: 8 }, { x: 33, y: 12 }] }),
    ],
    annotations: [
      createAnnotation({ text: 'X2 sinks. Cut off the cutters. X4 pops short corner.' }),
    ],
  });

  // bf6 : ball dropped to the right corner O4.
  const bf6 = mk('Ball to the right corner.', pos({
    [x1.id]: { x: 30, y: 20 },
    [x2.id]: { x: 25, y: 12 },
    [x3.id]: { x: 38, y: 15 },
    [x4.id]: { x: 33, y: 11 },
    [x5.id]: { x: 21, y: 10 },
  }), o4.id, {
    durationMs: 1200,
    arrows: [
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o2.id, toActorId: o4.id,
        points: [{ x: 42, y: 21 }, { x: 46, y: 8 }],
      }),
    ],
    annotations: [
      createAnnotation({ text: 'Ball in the corner. X4 : step up or sit?' }),
    ],
  });

  // bf7 : corner double X3+X4.
  const bf7 = mk('Corner double.', pos({
    [x1.id]: { x: 32, y: 16 },
    [x2.id]: { x: 25, y: 12 },
    [x3.id]: { x: 42, y: 11 },
    [x4.id]: { x: 44, y: 10 },
    [x5.id]: { x: 22, y: 10 },
  }), o4.id, {
    durationMs: 1200,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
        points: [{ x: 38, y: 15 }, { x: 42, y: 11 }] }),
      createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
        points: [{ x: 33, y: 11 }, { x: 44, y: 10 }] }),
    ],
    annotations: [
      createAnnotation({ text: 'X3 down, X4 up. Hands up, no fouls.' }),
    ],
  });

  // bf8 : O2 flashed to low post and caught it. X4 on him from behind.
  const bf8 = mk('Post catch. Who helps?', pos({
    [o2.id]: { x: 27, y: 7 },
    [x1.id]: { x: 32, y: 16 },
    [x2.id]: { x: 25, y: 12 },
    [x3.id]: { x: 40, y: 12 },
    [x4.id]: { x: 30, y: 9 },
    [x5.id]: { x: 22, y: 10 },
  }), o2.id, {
    durationMs: 1300,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: o2.id,
        points: [{ x: 42, y: 21 }, { x: 27, y: 7 }] }),
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o4.id, toActorId: o2.id,
        points: [{ x: 46, y: 8 }, { x: 27, y: 7 }],
      }),
    ],
    annotations: [
      createAnnotation({ text: 'O2 caught at the post. X2 : soft or hard?' }),
    ],
  });

  // bf9 : soft double on the post.
  const bf9 = mk('Soft double on the post.', pos({
    [o2.id]: { x: 27, y: 7 },
    [x1.id]: { x: 32, y: 16 },
    [x2.id]: { x: 27, y: 10 },
    [x3.id]: { x: 40, y: 12 },
    [x4.id]: { x: 29, y: 8 },
    [x5.id]: { x: 22, y: 10 },
  }), o2.id, {
    durationMs: 1400,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
        points: [{ x: 25, y: 12 }, { x: 27, y: 10 }] }),
    ],
    annotations: [
      createAnnotation({ text: 'Soft double : active hands, no body. Deny the kick-out.' }),
    ],
  });

  play.frames = [bf0, bf1, bf2, bf3, bf4, bf5, bf6, bf7, bf8, bf9];

  // ---- Teach clips (played on wrong answers) ------------------------------

  // Q1 wrong A : X1 stayed at the FT line.
  const q1_wrongA_stay = mk('Open three at the top.', pos({
    [o1.id]: { x: 25, y: 32 },
  }), o1.id, {
    durationMs: 1500,
    ballPosition: { x: 25, y: 4.75 },
    annotations: [
      createAnnotation({
        text: 'O1 pulled up for a wide-open three. You have to pressure the ball.',
        emphasis: true,
      }),
    ],
  });

  // Q1 wrong B : X1 chased past the arc.
  const q1_wrongB_chase = mk('Blow-by up the middle.', pos({
    [o1.id]: { x: 25, y: 18 },
    [x1.id]: { x: 25, y: 34 },
  }), o1.id, {
    durationMs: 1500,
    arrows: [
      createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o1.id,
        points: [{ x: 25, y: 30 }, { x: 25, y: 18 }] }),
    ],
    annotations: [
      createAnnotation({
        text: 'You chased past the arc. O1 drove right by you.',
        emphasis: true,
      }),
    ],
  });

  // Q2 wrong A : X5 stayed on the block.
  const q2_wrongA_stay = mk('Skip to the corner, open three.', pos({
    [x1.id]: { x: 13, y: 21 },
    [x2.id]: { x: 10, y: 20 },
  }), o5.id, {
    durationMs: 1500,
    arrows: [
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o5.id,
        points: [{ x: 8, y: 21 }, { x: 4, y: 8 }],
      }),
    ],
    annotations: [
      createAnnotation({
        text: 'Ball skipped to the corner for three. Pop to the short corner.',
        emphasis: true,
      }),
    ],
  });

  // Q2 wrong B : X5 sprinted out to the wing, lane empty.
  const q2_wrongB_triple = mk('Cutter to the rim.', pos({
    [o2.id]: { x: 25, y: 6 },
    [x2.id]: { x: 10, y: 20 },
    [x5.id]: { x: 11, y: 19 },
  }), o2.id, {
    durationMs: 1500,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: o2.id,
        points: [{ x: 42, y: 21 }, { x: 25, y: 6 }] }),
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o2.id,
        points: [{ x: 8, y: 21 }, { x: 25, y: 6 }],
      }),
    ],
    annotations: [
      createAnnotation({
        text: 'You left the lane. Cutter caught it at the rim.',
        emphasis: true,
      }),
    ],
  });

  // Q3 wrong A : X2 stayed at the left wing.
  const q3_wrongA_stay = mk('Cutter through the middle.', pos({
    [o3.id]: { x: 25, y: 12 },
    [x1.id]: { x: 37, y: 21 },
    [x3.id]: { x: 40, y: 20 },
  }), o3.id, {
    durationMs: 1500,
    arrows: [
      createArrow({ type: ARROW_TYPES.CUT, actorId: o3.id,
        points: [{ x: 8, y: 21 }, { x: 25, y: 12 }] }),
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o2.id, toActorId: o3.id,
        points: [{ x: 42, y: 21 }, { x: 25, y: 12 }],
      }),
    ],
    annotations: [
      createAnnotation({
        text: 'O3 cut through the middle and caught it. Sink into the key.',
        emphasis: true,
      }),
    ],
  });

  // Q3 wrong B : X2 chased all the way across to help trap the right wing.
  const q3_wrongB_chase = mk('Skipped back to your spot.', pos({
    [x1.id]: { x: 37, y: 21 },
    [x2.id]: { x: 34, y: 18 },
    [x3.id]: { x: 40, y: 20 },
  }), o3.id, {
    durationMs: 1500,
    arrows: [
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o2.id, toActorId: o3.id,
        points: [{ x: 42, y: 21 }, { x: 8, y: 21 }],
      }),
    ],
    annotations: [
      createAnnotation({
        text: 'They swung it right back. Wide-open three on your side.',
        emphasis: true,
      }),
    ],
  });

  // Q4 wrong A : X4 stayed at the short corner.
  const q4_wrongA_stay = mk('Baseline drive for a layup.', pos({
    [o4.id]: { x: 30, y: 3 },
    [x3.id]: { x: 42, y: 11 },
  }), o4.id, {
    durationMs: 1500,
    arrows: [
      createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o4.id,
        points: [{ x: 46, y: 8 }, { x: 30, y: 3 }] }),
    ],
    annotations: [
      createAnnotation({
        text: 'X3 alone on the corner. O4 drove baseline for a layup.',
        emphasis: true,
      }),
    ],
  });

  // Q4 wrong B : X4 overran past the 3-point line.
  const q4_wrongB_chase = mk('Overran the corner.', pos({
    [o4.id]: { x: 38, y: 10 },
    [x4.id]: { x: 45, y: 14 },
  }), o4.id, {
    durationMs: 1500,
    arrows: [
      createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o4.id,
        points: [{ x: 46, y: 8 }, { x: 38, y: 10 }] }),
    ],
    annotations: [
      createAnnotation({
        text: 'You overran the corner. O4 drove right by you.',
        emphasis: true,
      }),
    ],
  });

  // Q5 wrong A : X2 hard-doubled body-to-body, foul + kick-out three.
  const q5_wrongA_hard = mk('Foul + kick-out three.', pos({
    [o2.id]: { x: 27, y: 7 },
    [x2.id]: { x: 27, y: 8 },
    [x4.id]: { x: 28, y: 7 },
  }), o2.id, {
    durationMs: 1500,
    arrows: [
      createArrow({
        type: ARROW_TYPES.PASS, actorId: o2.id, toActorId: o3.id,
        points: [{ x: 27, y: 7 }, { x: 8, y: 21 }],
      }),
    ],
    annotations: [
      createAnnotation({
        text: 'Bodied him up, fouled him, kick-out for three. Soft double.',
        emphasis: true,
      }),
    ],
  });

  // Q5 wrong B : X2 stayed off, X4 solo. Drop-step layup.
  const q5_wrongB_off = mk('Drop-step layup.', pos({
    [o2.id]: { x: 25, y: 5 },
    [x4.id]: { x: 30, y: 9 },
  }), o2.id, {
    durationMs: 1500,
    arrows: [
      createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o2.id,
        points: [{ x: 27, y: 7 }, { x: 25, y: 5 }] }),
    ],
    annotations: [
      createAnnotation({
        text: 'O2 drop-stepped around X4 for a layup. Help with hands.',
        emphasis: true,
      }),
    ],
  });

  // ---- Branches (quizzes) -------------------------------------------------

  const q1 = createBranch({
    atFrameIdx: 0,
    prompt: 'Ball is at the top of the key. You are X1. What do you do?',
    isQuiz: true,
    role: { actorId: x1.id, description: 'You are X1 (top defender).' },
    options: [
      createBranchOption({
        label: 'Step up and pressure, 3-4 feet past the arc',
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay at the free-throw line',
        nextFrames: [q1_wrongA_stay],
        wrongReason: 'Open three at the top. You have to contest the ball.',
      }),
      createBranchOption({
        label: 'Chase past the arc and past half-court',
        nextFrames: [q1_wrongB_chase],
        wrongReason: 'You opened the whole lane. Stay at the top of the key.',
      }),
    ],
  });

  const q2 = createBranch({
    atFrameIdx: 2,
    prompt: 'Ball just went to the left wing. You are X5 at the left block. What do you do?',
    isQuiz: true,
    role: { actorId: x5.id, description: 'You are X5 (left-side low block).' },
    options: [
      createBranchOption({
        label: 'Pop up to the short corner',
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay on the low block',
        nextFrames: [q2_wrongA_stay],
        wrongReason: 'Open corner three for O5. Pop to the short corner.',
      }),
      createBranchOption({
        label: 'Sprint out to help trap the wing',
        nextFrames: [q2_wrongB_triple],
        wrongReason: 'Lane is wide open. Do not triple the wing.',
      }),
    ],
  });

  const q3 = createBranch({
    atFrameIdx: 4,
    prompt: 'Ball skipped across to the right wing. You are X2, the left wing defender. What do you do?',
    isQuiz: true,
    role: { actorId: x2.id, description: 'You are X2 (left wing, now weak side).' },
    options: [
      createBranchOption({
        label: 'Sink into the middle of the key',
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay at the left wing',
        nextFrames: [q3_wrongA_stay],
        wrongReason: 'Cutter came right through the middle. Sink into the key.',
      }),
      createBranchOption({
        label: 'Sprint across to help double',
        nextFrames: [q3_wrongB_chase],
        wrongReason: 'Ball swung back. You are nowhere near your spot.',
      }),
    ],
  });

  const q4 = createBranch({
    atFrameIdx: 6,
    prompt: 'Ball just went to the right corner. You are X4, already at the short corner. What do you do?',
    isQuiz: true,
    role: { actorId: x4.id, description: 'You are X4 (right short corner).' },
    options: [
      createBranchOption({
        label: 'Step up and meet X3 at the corner',
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay at the short corner',
        nextFrames: [q4_wrongA_stay],
        wrongReason: 'X3 cannot solo the corner. Baseline layup.',
      }),
      createBranchOption({
        label: 'Sprint past the 3-point line to trap',
        nextFrames: [q4_wrongB_chase],
        wrongReason: 'You overran the corner. He drove right by you.',
      }),
    ],
  });

  const q5 = createBranch({
    atFrameIdx: 8,
    prompt: 'O2 just caught the ball at the low post. X4 is on him. You are X2. What do you do?',
    isQuiz: true,
    role: { actorId: x2.id, description: 'You are X2 (middle of the key).' },
    options: [
      createBranchOption({
        label: 'Soft double : active hands, no body',
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Hard double, body him up',
        nextFrames: [q5_wrongA_hard],
        wrongReason: 'You fouled him and he kicked out for three. Soft double only.',
      }),
      createBranchOption({
        label: 'Stay off, let X4 handle it',
        nextFrames: [q5_wrongB_off],
        wrongReason: 'He drop-stepped around X4. You have to help with hands.',
      }),
    ],
  });

  play.branches = [q1, q2, q3, q4, q5];

  play.meta.id = '122-zone-basics';
  return play;
}
