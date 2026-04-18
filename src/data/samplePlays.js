// Sample plays: wire-up content so the viewer has something to render while we build.
// Real CJ plays (press break, defense, press) get encoded in Task #19.

import { createPlay, createActor, createFrame, createBranch, createBranchOption, createArrow, createAnnotation, PLAY_TYPES } from './schema.js';
import { build122ZoneBasicsPlay } from './zone122Quiz.js';
import { ACTOR_TYPES, ARROW_TYPES } from '../court/constants.js';

/**
 * Build a small demo play: 1-4 set, ball-handler drives, defense helps, kick to the corner.
 * Includes one branch: "Did help defender stay home or rotate?"
 */
export function buildDemoFlowPlay() {
  const play = createPlay({
    name: 'Demo: 1-4 drive & kick (with read)',
    type: PLAY_TYPES.OFFENSE,
    description: 'Dev content. Illustrates frames, animation, and one branching read.',
    tags: ['demo'],
  });

  // Actors with stable ids
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

  // Helper to build a frame with named positions
  const frame = (opts, positions, ballHolder = o1.id, extras = {}) => createFrame({
    ...opts,
    positions: positions.map(p => ({ actorId: p.actor.id, x: p.x, y: p.y })),
    ballHolder,
    ...extras,
  });

  // Frame 0: starting 1-4 alignment
  play.frames[0] = frame(
    { label: 'Start: 1-4 high', durationMs: 800 },
    [
      { actor: o1, x: 25, y: 38 },
      { actor: o2, x: 8,  y: 30 },
      { actor: o3, x: 42, y: 30 },
      { actor: o4, x: 15, y: 16 },
      { actor: o5, x: 35, y: 16 },
      { actor: x1, x: 25, y: 33 },
      { actor: x2, x: 10, y: 26 },
      { actor: x3, x: 40, y: 26 },
      { actor: x4, x: 16, y: 12 },
      { actor: x5, x: 34, y: 12 },
    ],
    o1.id,
  );
  play.frames[0].annotations = [
    createAnnotation({
      text: 'Spread the floor. Give 1 room to read the D.',
    }),
  ];

  // Frame 1: ball-handler attacks middle. Arrows show the dribble + spacing cuts.
  const f1 = frame(
    { label: '1 drives middle', durationMs: 1400 },
    [
      { actor: o1, x: 25, y: 22 },  // attacking
      { actor: o2, x: 5,  y: 28 },  // spaces to corner
      { actor: o3, x: 45, y: 28 },  // spaces to corner
      { actor: o4, x: 15, y: 16 },
      { actor: o5, x: 35, y: 16 },
      { actor: x1, x: 25, y: 20 },
      { actor: x2, x: 8,  y: 26 },
      { actor: x3, x: 42, y: 26 },
      { actor: x4, x: 20, y: 14 },  // tags the roller? branch point
      { actor: x5, x: 34, y: 12 },
    ],
    o1.id,
  );
  f1.arrows = [
    createArrow({
      type: ARROW_TYPES.DRIBBLE,
      actorId: o1.id,
      points: [{ x: 25, y: 38 }, { x: 25, y: 30 }, { x: 25, y: 22 }],
      label: '1',
    }),
    createArrow({
      type: ARROW_TYPES.CUT,
      actorId: o2.id,
      points: [{ x: 8, y: 30 }, { x: 5, y: 28 }],
    }),
    createArrow({
      type: ARROW_TYPES.CUT,
      actorId: o3.id,
      points: [{ x: 42, y: 30 }, { x: 45, y: 28 }],
    }),
  ];
  f1.annotations = [
    createAnnotation({
      text: 'Eyes up, watch X4',
      emphasis: true,
      pinTo: { actorId: o1.id },
    }),
    createAnnotation({
      text: "2 and 3: stretch the corners. Don't stand still.",
    }),
  ];
  play.frames.push(f1);

  // Frame 2a: if X4 helped, kick to corner 2 (dashed pass arrow)
  const f2aArrows = [
    createArrow({ type: ARROW_TYPES.PASS, actorId: o1.id, toActorId: o2.id, points: [{ x: 25, y: 22 }, { x: 5, y: 28 }], label: 'Kick' }),
  ];
  const f2a = frame(
    { label: 'Kick to corner 2 (help came)', durationMs: 1200 },
    [
      { actor: o1, x: 22, y: 22 },
      { actor: o2, x: 5,  y: 28 },
      { actor: o3, x: 45, y: 28 },
      { actor: o4, x: 13, y: 17 },
      { actor: o5, x: 35, y: 16 },
      { actor: x1, x: 22, y: 20 },
      { actor: x2, x: 10, y: 26 },  // closes out late
      { actor: x3, x: 42, y: 26 },
      { actor: x4, x: 22, y: 16 },  // dragged in
      { actor: x5, x: 34, y: 12 },
    ],
    o2.id,
  );
  f2a.arrows = f2aArrows;
  f2a.annotations = [
    createAnnotation({
      text: 'X4 helped. Punish it: kick to the open corner.',
      emphasis: true,
    }),
    createAnnotation({
      text: 'Catch ready to shoot',
      pinTo: { actorId: o2.id },
    }),
  ];

  // Frame 2b: if X4 stayed home, dump to 4 at the rim (dashed pass + cut to rim)
  const f2bArrows = [
    createArrow({ type: ARROW_TYPES.PASS, actorId: o1.id, toActorId: o4.id, points: [{ x: 22, y: 22 }, { x: 18, y: 10 }], label: 'Dump' }),
    createArrow({ type: ARROW_TYPES.CUT, actorId: o4.id, points: [{ x: 15, y: 16 }, { x: 18, y: 10 }] }),
  ];
  const f2b = frame(
    { label: 'Dump to 4 (help stayed home)', durationMs: 1200 },
    [
      { actor: o1, x: 22, y: 22 },
      { actor: o2, x: 5,  y: 28 },
      { actor: o3, x: 45, y: 28 },
      { actor: o4, x: 18, y: 10 },  // cuts to rim
      { actor: o5, x: 35, y: 16 },
      { actor: x1, x: 22, y: 20 },
      { actor: x2, x: 8,  y: 26 },
      { actor: x3, x: 42, y: 26 },
      { actor: x4, x: 15, y: 12 },  // stayed
      { actor: x5, x: 34, y: 12 },
    ],
    o4.id,
  );
  f2b.arrows = f2bArrows;
  f2b.annotations = [
    createAnnotation({
      text: 'X4 stayed home. 4 has a step, dump it.',
      emphasis: true,
    }),
    createAnnotation({
      text: 'Seal and go',
      pinTo: { actorId: o4.id },
    }),
  ];

  // Branch attached to frame index 1: "What did X4 do?"
  const branch = createBranch({
    atFrameIdx: 1,
    prompt: 'What did X4 do?',
    options: [
      createBranchOption({ label: 'Helped on the drive', nextFrames: [f2a] }),
      createBranchOption({ label: 'Stayed home on 4', nextFrames: [f2b] }),
    ],
  });
  play.branches = [branch];

  play.meta.id = 'demo-flow';
  return play;
}

/** Registry of preloaded dev plays. */
export function getSamplePlays() {
  return [buildDemoFlowPlay(), build122ZoneBasicsPlay()];
}

export function getSamplePlayById(id) {
  return getSamplePlays().find(p => p.meta.id === id) ?? null;
}
