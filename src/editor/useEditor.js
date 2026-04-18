// useEditor: single source of truth for the editor. Holds the working play,
// selected frame, active tool, and exposes action helpers that mutate the play
// immutably (so React rerenders and Framer Motion animates).
//
// Action granularity is designed around what the UI actually does:
//   - select / add / move actors on the current frame
//   - add / delete / reorder / duplicate frames
//   - propagate actor positions from the previous frame to a new frame
//   - add / edit / delete arrows
//   - add / edit / delete annotations
//   - add / edit / delete branches attached to the current frame

import { useState, useCallback } from 'react';
import {
  createPlay, createActor, createFrame, createArrow, createAnnotation,
  createBranch, createBranchOption, PLAY_TYPES,
} from '../data/schema.js';
import { ACTOR_TYPES, ARROW_TYPES } from '../court/constants.js';

export const TOOLS = {
  SELECT: 'select',
  ADD_OFFENSE: 'add_offense',
  ADD_DEFENSE: 'add_defense',
  ADD_COACH: 'add_coach',
  ARROW_PASS: 'arrow_pass',
  ARROW_CUT: 'arrow_cut',
  ARROW_DRIBBLE: 'arrow_dribble',
  ARROW_SCREEN: 'arrow_screen',
  ANNOTATE: 'annotate',
};

export function useEditor(initialPlay) {
  const [play, setPlay] = useState(() => initialPlay ?? createPlay({ name: 'New play', type: PLAY_TYPES.OFFENSE }));
  const [frameIdx, setFrameIdx] = useState(0);
  const [tool, setTool] = useState(TOOLS.SELECT);
  const [selectedActorId, setSelectedActorId] = useState(null);
  const [dirty, setDirty] = useState(false);

  const current = play.frames[frameIdx] ?? play.frames[0];

  // helpers --------------------------------------------------------------
  const update = useCallback((fn) => {
    setPlay(prev => {
      const next = fn(prev);
      next.meta = { ...next.meta, updatedAt: Date.now() };
      return next;
    });
    setDirty(true);
  }, []);

  const setMeta = useCallback((patch) => {
    update(p => ({ ...p, meta: { ...p.meta, ...patch } }));
  }, [update]);

  const setCourtConfig = useCallback((patch) => {
    update(p => ({ ...p, court: { ...p.court, ...patch } }));
  }, [update]);

  // actors ---------------------------------------------------------------
  const addActor = useCallback(({ x, y, kind, label }) => {
    const actor = createActor({ kind, label: label ?? autoLabelForKind(play.actors, kind) });
    update(p => {
      const next = { ...p, actors: [...p.actors, actor], frames: p.frames.map((f, i) => {
        // Place the new actor at (x,y) on the current frame and hold position on others.
        const pos = { actorId: actor.id, x, y };
        const positions = [...f.positions.filter(q => q.actorId !== actor.id), pos];
        return { ...f, positions };
      })};
      return next;
    });
    setSelectedActorId(actor.id);
    return actor.id;
  }, [play.actors, update]);

  const removeActor = useCallback((actorId) => {
    update(p => ({
      ...p,
      actors: p.actors.filter(a => a.id !== actorId),
      frames: p.frames.map(f => ({
        ...f,
        positions: f.positions.filter(q => q.actorId !== actorId),
        ballHolder: f.ballHolder === actorId ? null : f.ballHolder,
        arrows: (f.arrows ?? []).filter(ar => ar.actorId !== actorId && ar.toActorId !== actorId),
        annotations: (f.annotations ?? []).filter(an => an.pinTo?.actorId !== actorId),
      })),
    }));
    setSelectedActorId(id => id === actorId ? null : id);
  }, [update]);

  const moveActor = useCallback((actorId, x, y) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => {
        if (i !== frameIdx) return f;
        const positions = f.positions.map(q => q.actorId === actorId ? { ...q, x, y } : q);
        // If actor doesn't exist on this frame, add it.
        if (!f.positions.some(q => q.actorId === actorId)) positions.push({ actorId, x, y });
        return { ...f, positions };
      }),
    }));
  }, [frameIdx, update]);

  const setActorLabel = useCallback((actorId, label) => {
    update(p => ({ ...p, actors: p.actors.map(a => a.id === actorId ? { ...a, label } : a) }));
  }, [update]);

  const setBallHolder = useCallback((actorId) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx ? { ...f, ballHolder: actorId, ballPosition: null } : f),
    }));
  }, [frameIdx, update]);

  const clearBall = useCallback(() => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx ? { ...f, ballHolder: null, ballPosition: null } : f),
    }));
  }, [frameIdx, update]);

  // frames ---------------------------------------------------------------
  const addFrame = useCallback(({ copyFromCurrent = true, label = '' } = {}) => {
    let newIdx = frameIdx;
    update(p => {
      const source = p.frames[frameIdx];
      const newFrame = createFrame({
        label,
        positions: copyFromCurrent ? source.positions.map(q => ({ ...q })) : [],
        ballHolder: copyFromCurrent ? source.ballHolder : null,
        ballPosition: null,
        arrows: [],
        annotations: [],
      });
      const frames = [...p.frames.slice(0, frameIdx + 1), newFrame, ...p.frames.slice(frameIdx + 1)];
      newIdx = frameIdx + 1;
      // Branches whose atFrameIdx sits past the insertion point shift +1.
      const branches = p.branches.map(b => b.atFrameIdx > frameIdx ? { ...b, atFrameIdx: b.atFrameIdx + 1 } : b);
      return { ...p, frames, branches };
    });
    setFrameIdx(newIdx);
  }, [frameIdx, update]);

  const duplicateFrame = useCallback((idx) => {
    update(p => {
      const src = p.frames[idx];
      if (!src) return p;
      const copy = createFrame({
        label: src.label ? `${src.label} (copy)` : '',
        durationMs: src.durationMs,
        positions: src.positions.map(q => ({ ...q })),
        ballHolder: src.ballHolder,
        ballPosition: src.ballPosition ? { ...src.ballPosition } : null,
        arrows: (src.arrows ?? []).map(ar => ({ ...ar, id: crypto.randomUUID(), points: ar.points.map(pt => ({ ...pt })) })),
        annotations: (src.annotations ?? []).map(an => ({ ...an, id: crypto.randomUUID() })),
      });
      const frames = [...p.frames.slice(0, idx + 1), copy, ...p.frames.slice(idx + 1)];
      const branches = p.branches.map(b => b.atFrameIdx > idx ? { ...b, atFrameIdx: b.atFrameIdx + 1 } : b);
      return { ...p, frames, branches };
    });
    setFrameIdx(idx + 1);
  }, [update]);

  const deleteFrame = useCallback((idx) => {
    if (play.frames.length <= 1) return;
    update(p => {
      const frames = p.frames.filter((_, i) => i !== idx);
      // Drop branches that sat on this frame and shift the ones past it.
      const branches = p.branches
        .filter(b => b.atFrameIdx !== idx)
        .map(b => b.atFrameIdx > idx ? { ...b, atFrameIdx: b.atFrameIdx - 1 } : b);
      return { ...p, frames, branches };
    });
    setFrameIdx(i => Math.max(0, Math.min(i, play.frames.length - 2)));
  }, [play.frames.length, update]);

  const moveFrame = useCallback((from, to) => {
    if (from === to || from < 0 || to < 0) return;
    update(p => {
      if (from >= p.frames.length || to >= p.frames.length) return p;
      const frames = [...p.frames];
      const [moved] = frames.splice(from, 1);
      frames.splice(to, 0, moved);
      // Rewire branches by following the original frame's new position.
      const branches = p.branches.map(b => {
        if (b.atFrameIdx === from) return { ...b, atFrameIdx: to };
        if (from < b.atFrameIdx && b.atFrameIdx <= to) return { ...b, atFrameIdx: b.atFrameIdx - 1 };
        if (to <= b.atFrameIdx && b.atFrameIdx < from) return { ...b, atFrameIdx: b.atFrameIdx + 1 };
        return b;
      });
      return { ...p, frames, branches };
    });
    setFrameIdx(to);
  }, [update]);

  const updateFrame = useCallback((idx, patch) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === idx ? { ...f, ...patch } : f),
    }));
  }, [update]);

  // arrows ---------------------------------------------------------------
  const addArrow = useCallback(({ type, actorId = null, toActorId = null, points, label = '' }) => {
    const arrow = createArrow({ type, actorId, toActorId, points, label });
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx ? { ...f, arrows: [...(f.arrows ?? []), arrow] } : f),
    }));
    return arrow.id;
  }, [frameIdx, update]);

  const updateArrow = useCallback((arrowId, patch) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx
        ? { ...f, arrows: (f.arrows ?? []).map(a => a.id === arrowId ? { ...a, ...patch } : a) }
        : f),
    }));
  }, [frameIdx, update]);

  const deleteArrow = useCallback((arrowId) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx
        ? { ...f, arrows: (f.arrows ?? []).filter(a => a.id !== arrowId) }
        : f),
    }));
  }, [frameIdx, update]);

  // annotations ----------------------------------------------------------
  const addAnnotation = useCallback(({ text, pinTo = null, emphasis = false }) => {
    const an = createAnnotation({ text, pinTo, emphasis });
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx ? { ...f, annotations: [...(f.annotations ?? []), an] } : f),
    }));
    return an.id;
  }, [frameIdx, update]);

  const updateAnnotation = useCallback((anId, patch) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx
        ? { ...f, annotations: (f.annotations ?? []).map(a => a.id === anId ? { ...a, ...patch } : a) }
        : f),
    }));
  }, [frameIdx, update]);

  const deleteAnnotation = useCallback((anId) => {
    update(p => ({
      ...p,
      frames: p.frames.map((f, i) => i === frameIdx
        ? { ...f, annotations: (f.annotations ?? []).filter(a => a.id !== anId) }
        : f),
    }));
  }, [frameIdx, update]);

  // branches -------------------------------------------------------------
  const addBranch = useCallback(({ prompt = 'What is the defense doing?' } = {}) => {
    // Seed with two empty options so it's valid right away.
    const branch = createBranch({
      atFrameIdx: frameIdx,
      prompt,
      options: [
        createBranchOption({ label: 'Option A', nextFrames: [] }),
        createBranchOption({ label: 'Option B', nextFrames: [] }),
      ],
    });
    update(p => ({ ...p, branches: [...p.branches, branch] }));
    return branch.id;
  }, [frameIdx, update]);

  const updateBranch = useCallback((branchId, patch) => {
    update(p => ({ ...p, branches: p.branches.map(b => b.id === branchId ? { ...b, ...patch } : b) }));
  }, [update]);

  const deleteBranch = useCallback((branchId) => {
    update(p => ({ ...p, branches: p.branches.filter(b => b.id !== branchId) }));
  }, [update]);

  const addBranchOption = useCallback((branchId) => {
    const opt = createBranchOption({ label: `Option ${String.fromCharCode(65 + (findBranch(play, branchId)?.options.length ?? 0))}` });
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id === branchId ? { ...b, options: [...b.options, opt] } : b),
    }));
    return opt.id;
  }, [play, update]);

  const updateBranchOption = useCallback((branchId, optionId, patch) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id === branchId
        ? { ...b, options: b.options.map(o => o.id === optionId ? { ...o, ...patch } : o) }
        : b),
    }));
  }, [update]);

  const deleteBranchOption = useCallback((branchId, optionId) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id === branchId
        ? { ...b, options: b.options.filter(o => o.id !== optionId) }
        : b),
    }));
  }, [update]);

  // add a frame to a branch option. Seed from the current base frame so the coach
  // doesn't have to place ten actors again.
  const addBranchOptionFrame = useCallback((branchId, optionId, { label = '' } = {}) => {
    let newFrameId = null;
    update(p => {
      const branch = p.branches.find(b => b.id === branchId);
      if (!branch) return p;
      const base = p.frames[branch.atFrameIdx];
      const opt = branch.options.find(o => o.id === optionId);
      const seed = opt?.nextFrames.length ? opt.nextFrames[opt.nextFrames.length - 1] : base;
      const newFrame = createFrame({
        label,
        positions: (seed?.positions ?? []).map(q => ({ ...q })),
        ballHolder: seed?.ballHolder ?? null,
        ballPosition: null,
        arrows: [],
        annotations: [],
      });
      newFrameId = newFrame.id;
      return {
        ...p,
        branches: p.branches.map(b => b.id !== branchId ? b : {
          ...b,
          options: b.options.map(o => o.id !== optionId ? o : { ...o, nextFrames: [...o.nextFrames, newFrame] }),
        }),
      };
    });
    return newFrameId;
  }, [update]);

  // Update a single branch-option frame (label / duration / positions / annotations / etc.).
  const updateBranchOptionFrame = useCallback((branchId, optionId, frameId, patch) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => o.id !== optionId ? o : {
          ...o,
          nextFrames: o.nextFrames.map(f => f.id === frameId ? { ...f, ...patch } : f),
        }),
      }),
    }));
  }, [update]);

  const deleteBranchOptionFrame = useCallback((branchId, optionId, frameId) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => o.id !== optionId ? o : {
          ...o,
          nextFrames: o.nextFrames.filter(f => f.id !== frameId),
        }),
      }),
    }));
  }, [update]);

  const duplicateBranchOptionFrame = useCallback((branchId, optionId, frameId) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => {
          if (o.id !== optionId) return o;
          const idx = o.nextFrames.findIndex(f => f.id === frameId);
          if (idx === -1) return o;
          const src = o.nextFrames[idx];
          const copy = createFrame({
            label: src.label ? `${src.label} (copy)` : '',
            durationMs: src.durationMs,
            positions: src.positions.map(q => ({ ...q })),
            ballHolder: src.ballHolder,
            ballPosition: src.ballPosition ? { ...src.ballPosition } : null,
            arrows: (src.arrows ?? []).map(ar => ({ ...ar, id: crypto.randomUUID(), points: ar.points.map(pt => ({ ...pt })) })),
            annotations: (src.annotations ?? []).map(an => ({ ...an, id: crypto.randomUUID() })),
          });
          return { ...o, nextFrames: [...o.nextFrames.slice(0, idx + 1), copy, ...o.nextFrames.slice(idx + 1)] };
        }),
      }),
    }));
  }, [update]);

  // Move an actor's position on a specific branch-option frame.
  const moveActorInBranchFrame = useCallback((branchId, optionId, frameId, actorId, x, y) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => o.id !== optionId ? o : {
          ...o,
          nextFrames: o.nextFrames.map(f => {
            if (f.id !== frameId) return f;
            const exists = f.positions.some(q => q.actorId === actorId);
            const positions = exists
              ? f.positions.map(q => q.actorId === actorId ? { ...q, x, y } : q)
              : [...f.positions, { actorId, x, y }];
            return { ...f, positions };
          }),
        }),
      }),
    }));
  }, [update]);

  // Ball-holder and annotation helpers scoped to a branch-option frame.
  const setBranchFrameBallHolder = useCallback((branchId, optionId, frameId, actorId) => {
    updateBranchOptionFrame(branchId, optionId, frameId, { ballHolder: actorId, ballPosition: null });
  }, [updateBranchOptionFrame]);

  const addAnnotationToBranchFrame = useCallback((branchId, optionId, frameId, { text, pinTo = null, emphasis = false }) => {
    const an = createAnnotation({ text, pinTo, emphasis });
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => o.id !== optionId ? o : {
          ...o,
          nextFrames: o.nextFrames.map(f => f.id === frameId
            ? { ...f, annotations: [...(f.annotations ?? []), an] }
            : f),
        }),
      }),
    }));
    return an.id;
  }, [update]);

  const updateBranchFrameAnnotation = useCallback((branchId, optionId, frameId, anId, patch) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => o.id !== optionId ? o : {
          ...o,
          nextFrames: o.nextFrames.map(f => f.id === frameId
            ? { ...f, annotations: (f.annotations ?? []).map(a => a.id === anId ? { ...a, ...patch } : a) }
            : f),
        }),
      }),
    }));
  }, [update]);

  const deleteBranchFrameAnnotation = useCallback((branchId, optionId, frameId, anId) => {
    update(p => ({
      ...p,
      branches: p.branches.map(b => b.id !== branchId ? b : {
        ...b,
        options: b.options.map(o => o.id !== optionId ? o : {
          ...o,
          nextFrames: o.nextFrames.map(f => f.id === frameId
            ? { ...f, annotations: (f.annotations ?? []).filter(a => a.id !== anId) }
            : f),
        }),
      }),
    }));
  }, [update]);

  return {
    play, setPlay,
    frameIdx, setFrameIdx,
    currentFrame: current,
    tool, setTool,
    selectedActorId, setSelectedActorId,
    dirty, markClean: () => setDirty(false),

    // actions
    setMeta, setCourtConfig,
    addActor, removeActor, moveActor, setActorLabel,
    setBallHolder, clearBall,
    addFrame, duplicateFrame, deleteFrame, moveFrame, updateFrame,
    addArrow, updateArrow, deleteArrow,
    addAnnotation, updateAnnotation, deleteAnnotation,
    addBranch, updateBranch, deleteBranch,
    addBranchOption, updateBranchOption, deleteBranchOption,
    addBranchOptionFrame, updateBranchOptionFrame, deleteBranchOptionFrame, duplicateBranchOptionFrame,
    moveActorInBranchFrame, setBranchFrameBallHolder,
    addAnnotationToBranchFrame, updateBranchFrameAnnotation, deleteBranchFrameAnnotation,
  };
}

function findBranch(play, branchId) {
  return play.branches.find(b => b.id === branchId);
}

function autoLabelForKind(existing, kind) {
  if (kind === ACTOR_TYPES.OFFENSE) {
    const used = new Set(existing.filter(a => a.kind === kind).map(a => a.label));
    for (let n = 1; n <= 9; n++) if (!used.has(String(n))) return String(n);
    return String(existing.filter(a => a.kind === kind).length + 1);
  }
  if (kind === ACTOR_TYPES.DEFENSE) {
    const used = new Set(existing.filter(a => a.kind === kind).map(a => a.label));
    for (let n = 1; n <= 9; n++) if (!used.has(`X${n}`)) return `X${n}`;
    return `X${existing.filter(a => a.kind === kind).length + 1}`;
  }
  if (kind === ACTOR_TYPES.COACH) return 'C';
  return '';
}

export { ARROW_TYPES, ACTOR_TYPES };
