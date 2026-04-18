// usePlayback : the animation engine.
//
// Responsibilities:
//  1. Resolve a play's linear frame list given which branches have been taken so far.
//  2. Track current frame index, playing/paused, speed multiplier.
//  3. Advance frames automatically, respecting each frame's durationMs.
//  4. Pause at branch points and expose the pendingBranch for the UI to render.
//  5. Expose resolved actor positions + ball position for the current frame.
//
// Everything here is pure state management. The Court / Actor / Ball components
// do the actual rendering and Framer Motion handles the interpolation between
// the positions we return for the current frame and the ones we returned before.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Resolve the effective frame list from a play given the branch selections.
 *
 * selections: Map<branchId, optionId>
 *
 * The algorithm: walk the base frames. If a branch attaches to the current frame
 * index AND has been selected, splice in that option's nextFrames before continuing.
 * Each spliced frame is marked with an origin so the UI can visualize the path.
 */
export function resolveFrames(play, selections = new Map()) {
  if (!play?.frames?.length) return [];
  const branchesByIdx = new Map();
  (play.branches || []).forEach(b => {
    if (!branchesByIdx.has(b.atFrameIdx)) branchesByIdx.set(b.atFrameIdx, []);
    branchesByIdx.get(b.atFrameIdx).push(b);
  });

  const out = [];
  const pushBase = (frame, i) => out.push({ frame, origin: { kind: 'base', baseIdx: i } });
  const pushBranch = (frame, branchId, optionId, j) =>
    out.push({ frame, origin: { kind: 'branch', branchId, optionId, step: j } });

  for (let i = 0; i < play.frames.length; i++) {
    pushBase(play.frames[i], i);
    const here = branchesByIdx.get(i) || [];
    for (const b of here) {
      const selectedOptionId = selections.get(b.id);
      if (!selectedOptionId) continue; // unresolved : stop here, UI will pause
      const option = b.options.find(o => o.id === selectedOptionId);
      if (!option) continue;
      (option.nextFrames || []).forEach((f, j) => pushBranch(f, b.id, option.id, j));
    }
  }
  return out;
}

/**
 * Find the next unresolved branch starting from the given base frame index.
 * Returns { branch, baseIdx } or null.
 */
function findNextUnresolvedBranch(play, selections, fromBaseIdx) {
  for (let i = fromBaseIdx; i < (play?.frames?.length ?? 0); i++) {
    const attached = (play.branches || []).filter(b => b.atFrameIdx === i);
    for (const b of attached) {
      if (!selections.has(b.id)) return { branch: b, baseIdx: i };
    }
  }
  return null;
}

export function usePlayback(play, { autoplay = false, speed: initialSpeed = 1 } = {}) {
  const [selections, setSelections] = useState(() => new Map());
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(initialSpeed);

  const resolved = useMemo(() => resolveFrames(play, selections), [play, selections]);
  const currentEntry = resolved[frameIdx] ?? null;
  const currentFrame = currentEntry?.frame ?? null;

  // Is the next step a branch decision? We detect this when the resolved list ends
  // but the play's base frames have more to come : meaning an unresolved branch
  // blocked resolution.
  const pendingBranch = useMemo(() => {
    if (!currentEntry) return null;
    const isAtEnd = frameIdx >= resolved.length - 1;
    if (!isAtEnd) return null;
    // Determine which base index we're effectively at.
    let baseIdx = 0;
    if (currentEntry.origin.kind === 'base') {
      baseIdx = currentEntry.origin.baseIdx + 1;
    } else if (currentEntry.origin.kind === 'branch') {
      // still inside a branch : look for branches attached to the branch's parent frame
      // only AFTER the branch's steps complete; most plays won't nest branches in MVP.
      const parent = (play.branches || []).find(b => b.id === currentEntry.origin.branchId);
      baseIdx = parent ? parent.atFrameIdx + 1 : 0;
    }
    return findNextUnresolvedBranch(play, selections, baseIdx);
  }, [play, selections, resolved, frameIdx, currentEntry]);

  const atEnd = frameIdx >= resolved.length - 1 && !pendingBranch;

  // Auto-advance timer.
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!playing) return;
    if (pendingBranch) return; // pause on branch
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const nextEntry = resolved[frameIdx + 1];
    if (!nextEntry) return;
    const dur = Math.max(80, (nextEntry.frame.durationMs ?? 1000) / speed);
    timerRef.current = setTimeout(() => {
      setFrameIdx(i => Math.min(i + 1, resolved.length - 1));
    }, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, frameIdx, resolved, speed, pendingBranch, atEnd]);

  // Controls ------------------------------------------------------------------
  const play_ = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const step = useCallback((n = 1) => {
    setPlaying(false);
    setFrameIdx(i => {
      const target = Math.max(0, Math.min(i + n, resolved.length - 1));
      return target;
    });
  }, [resolved.length]);
  const seekTo = useCallback((i) => {
    setPlaying(false);
    setFrameIdx(Math.max(0, Math.min(i, resolved.length - 1)));
  }, [resolved.length]);
  const restart = useCallback(() => {
    setPlaying(false);
    setFrameIdx(0);
    setSelections(new Map());
  }, []);
  const chooseBranchOption = useCallback((branchId, optionId) => {
    setSelections(prev => {
      const next = new Map(prev);
      next.set(branchId, optionId);
      return next;
    });
    // The effect recomputes resolved and we advance into the new frames on next tick.
    setFrameIdx(i => i + 1); // step into the first frame of the chosen branch
    setPlaying(true);
  }, []);
  const unchooseLastBranch = useCallback(() => {
    setSelections(prev => {
      const keys = [...prev.keys()];
      if (!keys.length) return prev;
      const next = new Map(prev);
      next.delete(keys[keys.length - 1]);
      return next;
    });
  }, []);

  // Derive actor positions for the current frame, keyed by actorId.
  const positionsByActor = useMemo(() => {
    const map = new Map();
    if (!currentFrame) return map;
    for (const p of currentFrame.positions || []) {
      map.set(p.actorId, { x: p.x, y: p.y });
    }
    return map;
  }, [currentFrame]);

  // Resolve ball position: attached to ballHolder, or use explicit ballPosition, or hide.
  const ballPosition = useMemo(() => {
    if (!currentFrame) return null;
    if (currentFrame.ballHolder) {
      const pos = positionsByActor.get(currentFrame.ballHolder);
      if (!pos) return null;
      return { x: pos.x + 1.6, y: pos.y - 0.2 };
    }
    if (currentFrame.ballPosition) return currentFrame.ballPosition;
    return null;
  }, [currentFrame, positionsByActor]);

  return {
    // state
    resolved,
    frameIdx,
    currentFrame,
    currentEntry,
    positionsByActor,
    ballPosition,
    playing,
    speed,
    pendingBranch,
    atEnd,
    selections,
    // controls
    play: play_,
    pause,
    togglePlay,
    step,
    seekTo,
    restart,
    setSpeed,
    chooseBranchOption,
    unchooseLastBranch,
  };
}
