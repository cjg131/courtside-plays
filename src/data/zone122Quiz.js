// 1-2-2 Zone Defense : Basics.
//
// CJ's foundational defense teaching. Kids play X1-X5. Each read is a core
// rotation : wing double, corner double, weak-side bump on ball reversal.
// Correct advances. Wrong shows the consequence and lets the kid retry.
//
// Labeling convention (matches CJ's rotations):
//   X1 top center (above the arc)
//   X2 LEFT elbow       X3 RIGHT elbow
//   X5 LEFT low block   X4 RIGHT low block
//   Wing doubles  : X1+X2 at left wing, X1+X3 at right wing (same-side elbow goes)
//   Corner doubles: X2+X5 at left corner, X3+X4 at right corner (same-side block goes)
//   Post double   : soft (middle defender helps with hands, never body)
//
// Coordinate system (confirmed against Court.jsx, not inverted this time):
//   - Half court, 50 wide x 47 deep. Vertical orientation.
//   - Baseline at BOTTOM of SVG (y = 47). Midcourt at TOP (y = 0).
//   - Rim at (25, 41.75). FT line at y = 28. Top of arc at y = 19.75.
//   - Lane: x in [19, 31], y in [28, 47]. Elbows = (19, 28) and (31, 28).
//   - Low blocks ~3ft from baseline on the lane line: (19, 44) and (31, 44).
//   - Offense attacks DOWN the screen (toward y=47).

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
      'Shell around the key. Three core reads : wing double, corner double, weak-side bump on ball reversal. No skips, no post catches. This is the starting point.',
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

  // Shell alignment. Offense in 5-out. Defense in textbook 1-2-2 around the key.
  const home = new Map([
    // Offense -- 5-out, all behind the arc
    [o1.id, { x: 25, y: 12 }],   // point guard, top of key (arc peak at y=19.75)
    [o2.id, { x: 40, y: 22 }],   // right wing, behind arc
    [o3.id, { x: 10, y: 22 }],   // left wing, behind arc
    [o4.id, { x: 47, y: 43 }],   // right corner 3 (corner 3 line at x=47)
    [o5.id, { x: 3,  y: 43 }],   // left corner 3
    // Defense -- 1-2-2 shell around the key
    [x1.id, { x: 25, y: 17 }],   // TOP : above the arc (arc peak y=19.75)
    [x2.id, { x: 19, y: 28 }],   // LEFT ELBOW : exact corner of paint at FT line
    [x3.id, { x: 31, y: 28 }],   // RIGHT ELBOW
    [x5.id, { x: 19, y: 44 }],   // LEFT BLOCK : 3ft from baseline on left lane line
    [x4.id, { x: 31, y: 44 }],   // RIGHT BLOCK
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
  });

  // ---- Base frames --------------------------------------------------------

  // bf0 : Shell alignment. The starting picture.
  const bf0 = mk(
    'Shell : 1-2-2 alignment',
    pos(),
    o1.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'The 1-2-2 shell. X1 above the arc. X2 & X3 on the elbows. X4 & X5 on the blocks. Every rotation starts from here.',
      })],
    },
  );

  // bf1 : Ball goes to the right wing. O1 passes to O2.
  const bf1 = mk(
    'Ball to the right wing',
    pos(),
    o2.id,
    {
      durationMs: 1100,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS,
        actorId: o1.id,
        points: [{ x: 25, y: 12 }, { x: 40, y: 22 }],
      })],
      annotations: [createAnnotation({
        text: 'Ball swings to the right wing. Who closes out?',
      })],
    },
  );

  // bf2 : Quiz frame. Static, ball with O2 on the wing.
  // Same picture as bf1 but without the pass arrow -- kid reads the state.
  const bf2 = mk(
    'Quiz : wing closeout',
    pos(),
    o2.id,
    { durationMs: 1000 },
  );

  // bf3 : X1 + X3 double O2 on the right wing.
  const bf3 = mk(
    'X1 + X3 double the right wing',
    pos({
      [x3.id]: { x: 37, y: 23 },   // X3 sprints from right elbow to ball
      [x1.id]: { x: 34, y: 20 },   // X1 drops down from top to complete the double
      [x2.id]: { x: 22, y: 22 },   // X2 slides over to cover the top
      [x5.id]: { x: 24, y: 38 },   // X5 bumps to middle help
      // X4 stays home on right block
    }),
    o2.id,
    {
      durationMs: 1400,
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
      annotations: [createAnnotation({
        text: 'Double the wing. X3 on the ball, X1 from the top. Hands high. Force the skip or the turnover.',
      })],
    },
  );

  // bf4 : O2 escapes the double with a pass to O4 in the right corner.
  const bf4 = mk(
    'O2 swings to the right corner',
    pos({
      [x3.id]: { x: 37, y: 23 },
      [x1.id]: { x: 34, y: 20 },
      [x2.id]: { x: 22, y: 22 },
      [x5.id]: { x: 24, y: 38 },
    }),
    o4.id,
    {
      durationMs: 1100,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS,
        actorId: o2.id,
        points: [{ x: 40, y: 22 }, { x: 47, y: 43 }],
      })],
      annotations: [createAnnotation({
        text: 'O2 breaks the double by hitting the corner. Now the corner defender has a choice.',
      })],
    },
  );

  // bf5 : Quiz frame. Ball with O4 in the corner. Defensive rotation from bf3/bf4 held.
  const bf5 = mk(
    'Quiz : corner closeout',
    pos({
      [x3.id]: { x: 37, y: 23 },
      [x1.id]: { x: 34, y: 20 },
      [x2.id]: { x: 22, y: 22 },
      [x5.id]: { x: 24, y: 38 },
    }),
    o4.id,
    { durationMs: 1000 },
  );

  // bf6 : X4 + X3 double O4 in the corner. Rotations behind.
  const bf6 = mk(
    'X4 + X3 double the right corner',
    pos({
      [x4.id]: { x: 44, y: 42 },   // X4 sprints out to the corner
      [x3.id]: { x: 42, y: 38 },   // X3 slides down with the ball
      [x5.id]: { x: 31, y: 44 },   // X5 crosses the lane to cover the right block
      [x1.id]: { x: 25, y: 22 },   // X1 recovers back toward the top
      [x2.id]: { x: 20, y: 30 },   // X2 drops to weak-side middle help
    }),
    o4.id,
    {
      durationMs: 1500,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [{ x: 31, y: 44 }, { x: 44, y: 42 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [{ x: 37, y: 23 }, { x: 42, y: 38 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [{ x: 24, y: 38 }, { x: 31, y: 44 }] }),
      ],
      annotations: [createAnnotation({
        text: 'Corner trap. Hardest pass on the floor to escape. X5 slides across to cover the block X4 just left.',
      })],
    },
  );

  // bf7 : O4 bails out -- long pass back to O1 at the top.
  const bf7 = mk(
    'O4 reverses to the top',
    pos({
      [x4.id]: { x: 44, y: 42 },
      [x3.id]: { x: 42, y: 38 },
      [x5.id]: { x: 31, y: 44 },
      [x1.id]: { x: 25, y: 22 },
      [x2.id]: { x: 20, y: 30 },
    }),
    o1.id,
    {
      durationMs: 1200,
      arrows: [createArrow({
        type: ARROW_TYPES.PASS,
        actorId: o4.id,
        points: [{ x: 47, y: 43 }, { x: 25, y: 12 }],
      })],
      annotations: [createAnnotation({
        text: 'O4 bails out and reverses the ball. Defense has to recover the shape on the fly.',
      })],
    },
  );

  // bf8 : Quiz frame. Ball at the top with O1. Defense mid-rotation.
  const bf8 = mk(
    'Quiz : weak-side recovery',
    pos({
      [x4.id]: { x: 44, y: 42 },
      [x3.id]: { x: 42, y: 38 },
      [x5.id]: { x: 31, y: 44 },
      [x1.id]: { x: 25, y: 22 },
      [x2.id]: { x: 20, y: 30 },
    }),
    o1.id,
    { durationMs: 1000 },
  );

  // bf9 : Reset to shell.
  const bf9 = mk(
    'Shell reset',
    pos(),
    o1.id,
    {
      durationMs: 1400,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
          points: [{ x: 20, y: 30 }, { x: 25, y: 20 }, { x: 19, y: 28 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
          points: [{ x: 25, y: 22 }, { x: 25, y: 17 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [{ x: 42, y: 38 }, { x: 31, y: 28 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [{ x: 44, y: 42 }, { x: 31, y: 44 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
          points: [{ x: 31, y: 44 }, { x: 19, y: 44 }] }),
      ],
      annotations: [createAnnotation({
        text: 'Back to shell. Every possession the shape returns. The shape does the work.',
      })],
    },
  );

  play.frames = [bf0, bf1, bf2, bf3, bf4, bf5, bf6, bf7, bf8, bf9];

  // ---- Teach clips (wrong-answer mini-sequences) -------------------------

  // --- Branch at bf2 : X3 right elbow -- ball just went to right wing. ---

  // Wrong #1 : X3 stays at the elbow. O2 takes the open three.
  const wrongStayElbowA = mk(
    'X3 stays at the elbow',
    pos(),
    o2.id,
    {
      durationMs: 1200,
      annotations: [createAnnotation({
        text: 'X3 held the elbow. Nobody closed out.',
      })],
    },
  );
  const wrongStayElbowB = mk(
    'O2 steps into an open three',
    pos(),
    o2.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'OPEN THREE. No closeout = free look from the wing.',
      })],
    },
  );

  // Wrong #2 : X3 closes out alone. O2 splits and drives.
  const wrongSoloCloseA = mk(
    'X3 closes out alone',
    pos({
      [x3.id]: { x: 38, y: 23 },   // solo closeout
      // x1 stays at top
    }),
    o2.id,
    {
      durationMs: 1100,
      arrows: [createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
        points: [{ x: 31, y: 28 }, { x: 38, y: 23 }] })],
      annotations: [createAnnotation({
        text: 'X3 closed alone. X1 stayed at the top. Now O2 has a one-on-one.',
      })],
    },
  );
  const wrongSoloCloseB = mk(
    'O2 drives past X3 into the paint',
    pos({
      [o2.id]: { x: 30, y: 36 },
      [x3.id]: { x: 36, y: 28 },   // beaten
    }),
    o2.id,
    {
      durationMs: 1400,
      arrows: [createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o2.id,
        points: [{ x: 40, y: 22 }, { x: 34, y: 30 }, { x: 30, y: 36 }] })],
      annotations: [createAnnotation({
        text: 'LAYUP. A solo closeout on a shooter is a blow-by waiting to happen.',
      })],
    },
  );

  // --- Branch at bf5 : X4 right block -- ball is in the right corner. ---

  // Wrong #1 : X4 stays on the block. O4 takes the open corner three.
  const wrongStayBlockA = mk(
    'X4 stays on the block',
    pos({
      [x3.id]: { x: 37, y: 23 },
      [x1.id]: { x: 34, y: 20 },
      [x2.id]: { x: 22, y: 22 },
      [x5.id]: { x: 24, y: 38 },
    }),
    o4.id,
    {
      durationMs: 1200,
      annotations: [createAnnotation({
        text: 'X4 held the block. Nobody went to the corner.',
      })],
    },
  );
  const wrongStayBlockB = mk(
    'O4 lines up an open corner three',
    pos({
      [x3.id]: { x: 37, y: 23 },
      [x1.id]: { x: 34, y: 20 },
      [x2.id]: { x: 22, y: 22 },
      [x5.id]: { x: 24, y: 38 },
    }),
    o4.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'OPEN CORNER THREE. The corner 3 is the highest-value shot in basketball. Never give it up.',
      })],
    },
  );

  // Wrong #2 : X4 rotates weak-side instead. X3 has to chase -- arrives late.
  const wrongRotateWeakA = mk(
    'X4 drifts to weak side -- X3 chases alone',
    pos({
      [x4.id]: { x: 24, y: 40 },
      [x3.id]: { x: 44, y: 40 },
      [x1.id]: { x: 34, y: 20 },
      [x2.id]: { x: 22, y: 22 },
      [x5.id]: { x: 24, y: 38 },
    }),
    o4.id,
    {
      durationMs: 1300,
      arrows: [
        createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
          points: [{ x: 31, y: 44 }, { x: 24, y: 40 }] }),
        createArrow({ type: ARROW_TYPES.CUT, actorId: x3.id,
          points: [{ x: 37, y: 23 }, { x: 44, y: 40 }] }),
      ],
      annotations: [createAnnotation({
        text: 'X4 left the corner and X3 had to chase it alone. Too late.',
      })],
    },
  );
  const wrongRotateWeakB = mk(
    'O4 pumps, drives baseline',
    pos({
      [o4.id]: { x: 35, y: 45 },
      [x3.id]: { x: 40, y: 43 },
      [x4.id]: { x: 24, y: 40 },
      [x1.id]: { x: 34, y: 20 },
      [x2.id]: { x: 22, y: 22 },
      [x5.id]: { x: 24, y: 38 },
    }),
    o4.id,
    {
      durationMs: 1400,
      arrows: [createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o4.id,
        points: [{ x: 47, y: 43 }, { x: 40, y: 44 }, { x: 35, y: 45 }] })],
      annotations: [createAnnotation({
        text: 'Baseline drive. Corner double is the block defender\'s job -- not a help rotation.',
      })],
    },
  );

  // --- Branch at bf8 : X2 weak-side -- ball reversed back to the top. ---

  // Wrong #1 : X2 sprints straight back to the elbow spot. O1 has open three.
  const wrongRunToElbowA = mk(
    'X2 sprints back to the elbow',
    pos({
      [x4.id]: { x: 44, y: 42 },
      [x3.id]: { x: 42, y: 38 },
      [x5.id]: { x: 31, y: 44 },
      [x1.id]: { x: 25, y: 22 },
      // x2 goes home to (19, 28) via pos()
    }),
    o1.id,
    {
      durationMs: 1200,
      arrows: [createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
        points: [{ x: 20, y: 30 }, { x: 19, y: 28 }] })],
      annotations: [createAnnotation({
        text: 'X2 ran to the elbow spot. Nobody bumped up to the ball.',
      })],
    },
  );
  const wrongRunToElbowB = mk(
    'O1 rises up for an open top-of-key three',
    pos({
      [x4.id]: { x: 44, y: 42 },
      [x3.id]: { x: 42, y: 38 },
      [x5.id]: { x: 31, y: 44 },
      [x1.id]: { x: 25, y: 22 },
    }),
    o1.id,
    {
      durationMs: 1400,
      annotations: [createAnnotation({
        text: 'OPEN THREE AT THE TOP. On reversal, the first weak-side defender MUST bump up until X1 recovers.',
      })],
    },
  );

  // Wrong #2 : X2 stays on the block. X1 tries to recover alone. O1 splits it.
  const wrongStayOnBlockA = mk(
    'X2 stays on the block',
    pos({
      [x4.id]: { x: 44, y: 42 },
      [x3.id]: { x: 42, y: 38 },
      [x5.id]: { x: 31, y: 44 },
      [x1.id]: { x: 25, y: 22 },
      [x2.id]: { x: 19, y: 44 },
    }),
    o1.id,
    {
      durationMs: 1200,
      annotations: [createAnnotation({
        text: 'X2 stayed on the block. X1 is alone at the top in a full sprint.',
      })],
    },
  );
  const wrongStayOnBlockB = mk(
    'O1 attacks the scrambling defense',
    pos({
      [o1.id]: { x: 22, y: 28 },
      [x1.id]: { x: 20, y: 22 },
      [x4.id]: { x: 44, y: 42 },
      [x3.id]: { x: 42, y: 38 },
      [x5.id]: { x: 31, y: 44 },
      [x2.id]: { x: 19, y: 44 },
    }),
    o1.id,
    {
      durationMs: 1400,
      arrows: [createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o1.id,
        points: [{ x: 25, y: 12 }, { x: 22, y: 28 }] })],
      annotations: [createAnnotation({
        text: 'O1 drove right into the scramble. No weak-side help = easy penetration.',
      })],
    },
  );

  // ---- Branches (quiz reads) ---------------------------------------------

  const branchWingCloseout = createBranch({
    id: 'branch-wing-closeout',
    atFrameIdx: 2,
    prompt: 'Ball just swung to the right wing. What do you do?',
    isQuiz: true,
    role: {
      actorId: x3.id,
      description: 'You are X3 -- the right elbow defender in the 1-2-2.',
    },
    options: [
      createBranchOption({
        label: 'Sprint out hard to the wing. X1 comes down with me to double the ball.',
        isCorrect: true,
        nextFrames: [], // empty -> advance naturally to bf3
      }),
      createBranchOption({
        label: 'Hold the elbow -- protect the middle, let the wing shoot if he wants.',
        isCorrect: false,
        wrongReason: 'In this zone, the same-side elbow goes to the wing. Holding the elbow gives up the best shot on the floor : a rhythm three off the catch.',
        nextFrames: [wrongStayElbowA, wrongStayElbowB],
      }),
      createBranchOption({
        label: 'Close out alone -- X1 stays home at the top.',
        isCorrect: false,
        wrongReason: 'Solo closeouts get blown by. The wing double is X3 + X1 every time on this side.',
        nextFrames: [wrongSoloCloseA, wrongSoloCloseB],
      }),
    ],
  });

  const branchCornerCloseout = createBranch({
    id: 'branch-corner-closeout',
    atFrameIdx: 5,
    prompt: 'Ball in the right corner. What do you do?',
    isQuiz: true,
    role: {
      actorId: x4.id,
      description: 'You are X4 -- the right low block defender.',
    },
    options: [
      createBranchOption({
        label: 'Sprint to the corner and trap with X3. X5 crosses to cover the block.',
        isCorrect: true,
        nextFrames: [],
      }),
      createBranchOption({
        label: 'Stay on the block -- X3 will chase the ball to the corner.',
        isCorrect: false,
        wrongReason: 'Same-side block ALWAYS takes the corner. If X3 chases alone, he\'s late and the shooter has an uncontested corner three.',
        nextFrames: [wrongStayBlockA, wrongStayBlockB],
      }),
      createBranchOption({
        label: 'Rotate weak side to help -- X3 can recover to the corner.',
        isCorrect: false,
        wrongReason: 'The corner double is X4 + X3, not a help rotation. Leaving the strong side opens a baseline drive.',
        nextFrames: [wrongRotateWeakA, wrongRotateWeakB],
      }),
    ],
  });

  const branchWeakSideBump = createBranch({
    id: 'branch-weak-side-bump',
    atFrameIdx: 8,
    prompt: 'Ball just reversed back to the top. You rotated to weak-side middle help on the corner trap. What now?',
    isQuiz: true,
    role: {
      actorId: x2.id,
      description: 'You are X2 -- the left elbow defender, currently in middle help after the corner trap.',
    },
    options: [
      createBranchOption({
        label: 'Bump up to cover the ball at the top until X1 recovers, then slide back to my elbow.',
        isCorrect: true,
        nextFrames: [],
      }),
      createBranchOption({
        label: 'Run straight back to my elbow -- that\'s my spot in the shell.',
        isCorrect: false,
        wrongReason: 'On a reversal, the closest weak-side defender bumps the ball. Running to your spot leaves a huge open three at the top of the key.',
        nextFrames: [wrongRunToElbowA, wrongRunToElbowB],
      }),
      createBranchOption({
        label: 'Stay on the weak-side block -- X1 can get back on his own.',
        isCorrect: false,
        wrongReason: 'X1 is coming from the strong-side double. He can\'t recover to the top before the ball arrives. You\'re the bump.',
        nextFrames: [wrongStayOnBlockA, wrongStayOnBlockB],
      }),
    ],
  });

  play.branches = [branchWingCloseout, branchCornerCloseout, branchWeakSideBump];

  return play;
}
