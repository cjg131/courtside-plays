// 1-2-2 zone defense with constant trap : the quiz play.
//
// This is CJ's CYO defensive scheme. Kids play the defense (X1-X5). Each
// branch is a teaching moment that asks "you're X_, what do you do?" The
// correct read advances the play forward. Wrong reads show the consequence
// then let the kid retry.
//
// Five reads, in order:
//   Q1. X1 (top) : ball goes to wing, do you trap?
//   Q2. X2 (weak-side wing) : trap is set, where do you go?
//   Q3. X5 (ball-side bottom) : O5 flashes short corner, what do you do?
//   Q4. X4 (weak-side bottom) : they skip it out, who closes out?
//   Q5. X2 again : offense splits the trap to the high post, how do you react?
//
// Coordinate system: half-court, 50 wide by 47 deep. Baseline at y=0, rim at
// (25, 4.75). Vertical orientation. Offense attacks DOWN (toward y=0).

import {
  createPlay, createActor, createFrame, createBranch, createBranchOption,
  createArrow, createAnnotation, PLAY_TYPES, COURT_VIEWS, COURT_ORIENTATIONS,
} from './schema.js';
import { ACTOR_TYPES, ARROW_TYPES } from '../court/constants.js';

export function build122ZoneTrapQuiz() {
  const play = createPlay({
    name: '1-2-2 zone with constant trap : quiz',
    type: PLAY_TYPES.DEFENSE,
    description: "CJ's CYO zone defense. Five reads : trap the wing, deny the high post, step up on the short corner, close out on the skip, double the high post.",
    tags: ['defense', 'zone', 'quiz', 'cyo'],
    view: COURT_VIEWS.HALF,
    orientation: COURT_ORIENTATIONS.VERTICAL,
  });

  // --- Actors ---------------------------------------------------------------
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

  // Position library : named snapshots of the defensive + offensive shape
  // at each key moment. Building frames by spreading these keeps positions
  // in sync across branches.
  const P = {};

  // Pre-pass setup : 1-2-2 vs. offense in 1-3-1-ish alignment
  P.setup = {
    [o1.id]: { x: 25, y: 30 },
    [o2.id]: { x: 8,  y: 22 },
    [o3.id]: { x: 42, y: 22 },
    [o4.id]: { x: 20, y: 11 },
    [o5.id]: { x: 36, y: 10 },
    [x1.id]: { x: 25, y: 22 },
    [x2.id]: { x: 12, y: 15 },
    [x3.id]: { x: 38, y: 15 },
    [x4.id]: { x: 14, y: 7  },
    [x5.id]: { x: 36, y: 7  },
  };

  // After O1 passes to O3 (right wing). O3 has caught. Defense hasn't moved yet.
  P.passToWing = {
    ...P.setup,
    [o1.id]: { x: 25, y: 30 },        // still at top
    [o3.id]: { x: 42, y: 20 },        // shows catch
  };

  // After Q1-correct: X1 has sprinted to trap with X3 on O3.
  P.trapSet = {
    ...P.passToWing,
    [x1.id]: { x: 37, y: 19 },
    [x3.id]: { x: 43, y: 18 },
  };

  // After Q2-correct: X2 sinks to the high post / elbow to deny.
  // X4 slides toward the ball-side rim. X5 creeps up ready for short corner.
  P.x2Sunk = {
    ...P.trapSet,
    [x2.id]: { x: 25, y: 14 },        // at the elbow
    [x4.id]: { x: 22, y: 6  },        // cover weak-side / rim
    [x5.id]: { x: 36, y: 9  },        // slight step up
    [o4.id]: { x: 22, y: 14 },        // O4 flashed to high post (denied)
    [o5.id]: { x: 42, y: 14 },        // O5 flashes toward short corner
  };

  // Q3 trigger: O5 clearly in short corner now, looking for a pass.
  P.shortCornerThreat = {
    ...P.x2Sunk,
    [o5.id]: { x: 44, y: 13 },
  };

  // After Q3-correct: X5 has stepped up to deny the short corner.
  P.x5StepUp = {
    ...P.shortCornerThreat,
    [x5.id]: { x: 42, y: 13 },
  };

  // Q4 trigger: O3 skips it across to O2 on the weak side.
  P.skipToWeak = {
    ...P.x5StepUp,
    [o2.id]: { x: 8,  y: 22 },        // still there, about to receive
  };

  // After Q4-correct: X4 sprints up to close out on O2; X2 slides back out
  // toward ball-side high-post region as X4 vacates.
  P.x4CloseOut = {
    ...P.skipToWeak,
    [x4.id]: { x: 10, y: 18 },        // closeout position
    [o2.id]: { x: 8,  y: 22 },
  };

  // Q5 trigger: before X4 fully gets there, O4 catches in the high post
  // (the splitting pass). X2 is the nearest wing defender.
  P.highPostCatch = {
    ...P.x4CloseOut,
    [o4.id]: { x: 25, y: 15 },
  };

  // After Q5-correct: X1 drops back, X2 comes up and they double the ball
  // at the high post.
  P.highPostDouble = {
    ...P.highPostCatch,
    [x1.id]: { x: 27, y: 16 },
    [x2.id]: { x: 23, y: 14 },
  };

  // --- Frame factory --------------------------------------------------------
  const posArr = (snap) =>
    Object.entries(snap).map(([actorId, { x, y }]) => ({ actorId, x, y }));

  const f = (opts, snap, ballHolder, arrows = [], annotations = []) =>
    createFrame({
      ...opts,
      positions: posArr(snap),
      ballHolder,
      arrows,
      annotations,
    });

  // --- Base frames (the "correct narrative" : what good D looks like) -------
  const bf0 = f(
    { label: 'Setup : 1-2-2 zone, offense in attack set', durationMs: 1000 },
    P.setup,
    o1.id,
    [],
    [createAnnotation({ text: 'Coach: eyes up. Ball moves, we move.' })],
  );

  const bf1 = f(
    { label: 'Pass : ball swings to the right wing', durationMs: 1000 },
    P.passToWing,
    o3.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o1.id, toActorId: o3.id,
        points: [{ x: 25, y: 30 }, { x: 42, y: 20 }], label: 'Pass' }),
    ],
    [createAnnotation({ text: 'Right wing catches. Trap trigger.', emphasis: true })],
  );

  const bf2 = f(
    { label: 'Trap set : X1 + X3 squeeze the wing', durationMs: 1200 },
    P.trapSet,
    o3.id,
    [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
        points: [{ x: 25, y: 22 }, { x: 37, y: 19 }], label: 'Sprint' }),
    ],
    [createAnnotation({ text: 'Trap is live. Who plugs the high post?', emphasis: true })],
  );

  const bf3 = f(
    { label: 'Weak-side wing denies high post', durationMs: 1200 },
    P.x2Sunk,
    o3.id,
    [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
        points: [{ x: 12, y: 15 }, { x: 25, y: 14 }], label: 'Sink' }),
      createArrow({ type: ARROW_TYPES.CUT, actorId: o4.id,
        points: [{ x: 20, y: 11 }, { x: 22, y: 14 }] }),
      createArrow({ type: ARROW_TYPES.CUT, actorId: o5.id,
        points: [{ x: 36, y: 10 }, { x: 42, y: 14 }] }),
    ],
    [createAnnotation({ text: 'X2 kills the high post. O5 flashes short corner.', emphasis: true })],
  );

  const bf4 = f(
    { label: 'X5 steps up : short corner denied', durationMs: 1100 },
    P.x5StepUp,
    o3.id,
    [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x5.id,
        points: [{ x: 36, y: 9 }, { x: 42, y: 13 }], label: 'Step up' }),
    ],
    [createAnnotation({ text: 'O3 is stuck. Skip pass is coming.', emphasis: true })],
  );

  const bf5 = f(
    { label: 'Skip : ball swung to the weak-side wing', durationMs: 1200 },
    P.skipToWeak,
    o2.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o2.id,
        points: [{ x: 42, y: 20 }, { x: 8, y: 22 }], label: 'Skip' }),
    ],
    [createAnnotation({ text: 'Long pass buys us time : but someone has to close out.', emphasis: true })],
  );

  const bf6 = f(
    { label: 'X4 sprints up : weak-side closeout', durationMs: 1100 },
    P.x4CloseOut,
    o2.id,
    [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x4.id,
        points: [{ x: 22, y: 6 }, { x: 10, y: 18 }], label: 'Closeout' }),
    ],
    [createAnnotation({ text: 'Hands high on the closeout. Next threat : high post.', emphasis: true })],
  );

  const bf7 = f(
    { label: 'High post catch : splitting pass from O2', durationMs: 1100 },
    P.highPostCatch,
    o4.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o2.id, toActorId: o4.id,
        points: [{ x: 8, y: 22 }, { x: 25, y: 15 }], label: 'Split' }),
    ],
    [createAnnotation({ text: 'Ball in the middle. Dangerous. Double it now.', emphasis: true })],
  );

  const bf8 = f(
    { label: 'Double team the high post : trap completes', durationMs: 1400 },
    P.highPostDouble,
    o4.id,
    [
      createArrow({ type: ARROW_TYPES.CUT, actorId: x1.id,
        points: [{ x: 37, y: 19 }, { x: 27, y: 16 }] }),
      createArrow({ type: ARROW_TYPES.CUT, actorId: x2.id,
        points: [{ x: 25, y: 14 }, { x: 23, y: 14 }] }),
    ],
    [createAnnotation({
      text: 'Hands up, active. Turn them toward a sideline. Stall wins.',
      emphasis: true,
    })],
  );

  play.frames = [bf0, bf1, bf2, bf3, bf4, bf5, bf6, bf7, bf8];

  // --- Wrong-answer teaching clips (1-2 frames each) ------------------------

  // Helper: build a "beat" frame (no branch-recursion), re-using the snap.
  const bf = (label, durationMs, snap, ballHolder, arrows = [], notes = []) =>
    f({ label, durationMs }, snap, ballHolder, arrows, notes.map(t => createAnnotation({ text: t, emphasis: true })));

  // Q1 WRONG A : "Stay at the top of the key"
  const q1WrongA_1 = bf(
    'You stayed home : wing has a rhythm three',
    1400,
    { ...P.passToWing, [o3.id]: { x: 42, y: 22 } },
    o3.id,
    [],
    ['X1 stayed. O3 rises and fires : wide-open three.'],
  );

  // Q1 WRONG B : "Sag to help on the middle"
  const q1WrongB_1 = bf(
    'You sagged middle : wing gets a clean look',
    1400,
    {
      ...P.passToWing,
      [x1.id]: { x: 27, y: 15 },
    },
    o3.id,
    [],
    ["Middle wasn't the threat. Wing catches, rises, scores."],
  );

  // Q2 WRONG A : "Stay out on the weak-side wing"
  const q2WrongA_1 = bf(
    'High post splits the trap',
    1300,
    {
      ...P.trapSet,
      [o4.id]: { x: 25, y: 15 },
    },
    o4.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o4.id,
        points: [{ x: 42, y: 20 }, { x: 25, y: 15 }], label: 'Split' }),
    ],
    ['Weak-side stayed. O4 flashes high post, catches clean.'],
  );
  const q2WrongA_2 = bf(
    'High post turns : layup',
    1200,
    {
      ...P.trapSet,
      [o4.id]: { x: 25, y: 8 },
      [x4.id]: { x: 22, y: 6 },
    },
    o4.id,
    [
      createArrow({ type: ARROW_TYPES.DRIBBLE, actorId: o4.id,
        points: [{ x: 25, y: 15 }, { x: 25, y: 8 }] }),
    ],
    ['Straight line to the rim. That pass has to be dead.'],
  );

  // Q2 WRONG B : "Drop to the weak-side corner"
  const q2WrongB_1 = bf(
    'You dropped too deep : high post wide open',
    1400,
    {
      ...P.trapSet,
      [x2.id]: { x: 6, y: 8 },
      [o4.id]: { x: 25, y: 15 },
    },
    o4.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o4.id,
        points: [{ x: 42, y: 20 }, { x: 25, y: 15 }] }),
    ],
    ["Corner wasn't the threat. High post was."],
  );

  // Q3 WRONG A : "Stay home on the block"
  const q3WrongA_1 = bf(
    'Short corner cashes : open 10-footer',
    1400,
    {
      ...P.x2Sunk,
      [o5.id]: { x: 44, y: 13 },
    },
    o5.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o5.id,
        points: [{ x: 42, y: 20 }, { x: 44, y: 13 }] }),
    ],
    ['You stayed. O5 catches short corner, rises, buckets.'],
  );

  // Q3 WRONG B : "Close out on the long corner"
  const q3WrongB_1 = bf(
    'Wrong direction : long corner was empty',
    1400,
    {
      ...P.x2Sunk,
      [x5.id]: { x: 46, y: 8 },
      [o5.id]: { x: 42, y: 13 },
    },
    o5.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o5.id,
        points: [{ x: 42, y: 20 }, { x: 42, y: 13 }] }),
    ],
    ['You chased a ghost. The actual threat was right above you.'],
  );

  // Q4 WRONG A : "Stay on the weak-side block"
  const q4WrongA_1 = bf(
    'Weak-side wing : wide-open three',
    1400,
    {
      ...P.skipToWeak,
    },
    o2.id,
    [
      createArrow({ type: ARROW_TYPES.PASS, actorId: o3.id, toActorId: o2.id,
        points: [{ x: 42, y: 20 }, { x: 8, y: 22 }] }),
    ],
    ['Nobody closed out. O2 catches, shoots, cash.'],
  );

  // Q4 WRONG B : "Rotate to the ball side"
  const q4WrongB_1 = bf(
    'You went the wrong way',
    1400,
    {
      ...P.skipToWeak,
      [x4.id]: { x: 36, y: 7 },
    },
    o2.id,
    [],
    ['Trap was already there. The skip-pass shooter was the threat.'],
  );

  // Q5 WRONG A : "Retreat out to the wing"
  const q5WrongA_1 = bf(
    'High post turns and attacks',
    1300,
    {
      ...P.highPostCatch,
      [x2.id]: { x: 12, y: 18 },
    },
    o4.id,
    [],
    ['You bailed. O4 rips through, one dribble, layup.'],
  );

  // Q5 WRONG B : "Switch onto the wing"
  const q5WrongB_1 = bf(
    'Ball in the middle, nobody on it',
    1400,
    {
      ...P.highPostCatch,
      [x2.id]: { x: 8, y: 22 },
      [x1.id]: { x: 40, y: 18 },
    },
    o4.id,
    [],
    ['You both abandoned the ball. High post kicks to a shooter : bucket.'],
  );

  // --- Branches -------------------------------------------------------------
  const q1 = createBranch({
    atFrameIdx: 1, // bf1 : pass to right wing
    isQuiz: true,
    prompt: 'Ball just hit the right wing. What do you do?',
    role: { actorId: x1.id, description: 'X1, top of the 1-2-2 zone' },
    options: [
      createBranchOption({
        label: 'Sprint to trap O3 with X3',
        nextFrames: [],
        isCorrect: true,
        wrongReason: '',
      }),
      createBranchOption({
        label: 'Stay at the top of the key',
        nextFrames: [q1WrongA_1],
        isCorrect: false,
        wrongReason: 'In a trap zone, the top defender is HALF of every wing trap. If you stay, the wing catches, rises, and shoots a rhythm three over a late contest.',
      }),
      createBranchOption({
        label: 'Sag to help in the middle',
        nextFrames: [q1WrongB_1],
        isCorrect: false,
        wrongReason: "The ball is on the wing, not in the middle. Middle help isn't your read. Trap the wing : make O3 give it up.",
      }),
    ],
  });

  const q2 = createBranch({
    atFrameIdx: 2, // bf2 : trap set
    isQuiz: true,
    prompt: 'Trap is live on the right wing. Where do you go?',
    role: { actorId: x2.id, description: 'X2, weak-side (left) wing defender' },
    options: [
      createBranchOption({
        label: 'Sink to the elbow : deny the high post',
        nextFrames: [],
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay out on the weak-side wing',
        nextFrames: [q2WrongA_1, q2WrongA_2],
        isCorrect: false,
        wrongReason: 'The most dangerous pass out of a wing trap is to the high post : it splits your whole zone. Weak-side wing is your second read, not your first. Sink first, recover out.',
      }),
      createBranchOption({
        label: 'Drop to the weak-side corner',
        nextFrames: [q2WrongB_1],
        isCorrect: false,
        wrongReason: "The corner is three passes away. The high post is one. Protect the nearest, most damaging pass first.",
      }),
    ],
  });

  const q3 = createBranch({
    atFrameIdx: 3, // bf3 : O5 flashing short corner
    isQuiz: true,
    prompt: 'O5 flashes to the short corner ball-side. What do you do?',
    role: { actorId: x5.id, description: 'X5, ball-side bottom defender' },
    options: [
      createBranchOption({
        label: 'Step up : deny the short corner',
        nextFrames: [],
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay home on the block',
        nextFrames: [q3WrongA_1],
        isCorrect: false,
        wrongReason: 'The short corner against a wing trap is a 10-foot open jumper. You have to step up and take it away. Block is empty : no threat until the ball gets there.',
      }),
      createBranchOption({
        label: 'Close out on the long corner',
        nextFrames: [q3WrongB_1],
        isCorrect: false,
        wrongReason: 'Long corner is covered by the closeout rotation later. Right now the live threat is the short corner pressure valve. Take care of the pass you can actually stop.',
      }),
    ],
  });

  const q4 = createBranch({
    atFrameIdx: 5, // bf5 : skip pass shown, now the closeout question
    isQuiz: true,
    prompt: 'O3 skips it across to the weak-side wing. Who closes out?',
    role: { actorId: x4.id, description: 'X4, weak-side bottom defender' },
    options: [
      createBranchOption({
        label: 'Sprint up and close out on O2',
        nextFrames: [],
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Stay on the weak-side block',
        nextFrames: [q4WrongA_1],
        isCorrect: false,
        wrongReason: "X2 is in the high post, X3 is in the trap : nobody else can get to that shooter. It's you. Every skip pass out of the trap gets closed out by the weak-side bottom.",
      }),
      createBranchOption({
        label: 'Rotate to the ball side',
        nextFrames: [q4WrongB_1],
        isCorrect: false,
        wrongReason: "The trap is already there. Rotating toward it leaves the shooter uncovered. Always rotate AWAY from where the ball is going, not toward where it's been.",
      }),
    ],
  });

  const q5 = createBranch({
    atFrameIdx: 7, // bf7 : high post catch shown : who attacks it?
    isQuiz: true,
    prompt: 'O2 splits a pass into O4 at the high post. You are closest. What do you do?',
    role: { actorId: x2.id, description: 'X2, now the nearest defender to the high post' },
    options: [
      createBranchOption({
        label: 'Jump the catch : double team the high post',
        nextFrames: [],
        isCorrect: true,
      }),
      createBranchOption({
        label: 'Retreat out to the wing',
        nextFrames: [q5WrongA_1],
        isCorrect: false,
        wrongReason: "Ball in the middle of the paint is the easiest layup in basketball. You have to attack it, not retreat from it. Contain first, recover out second.",
      }),
      createBranchOption({
        label: 'Switch onto the passer at the wing',
        nextFrames: [q5WrongB_1],
        isCorrect: false,
        wrongReason: "Switching away from the ball is the opposite of a trap defense. Commit to the ball : the off-ball shooter is somebody else's rotation.",
      }),
    ],
  });

  play.branches = [q1, q2, q3, q4, q5];
  play.meta.id = 'demo-122-zone-trap-quiz';
  return play;
}
