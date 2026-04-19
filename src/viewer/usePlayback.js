// usePlayback : the animation engine.
//
// Responsibilities:
//  1. Resolve a play's linear frame list given which branches have been taken.
//  2. Track current frame index, playing/paused, speed multiplier.
//  3. Advance frames automatically, respecting each frame's durationMs.
//  4. Pause at branch points and expose pendingBranch for the UI.
//  5. Pause at the end of a WRONG quiz branch option's teaching clip.
//  6. (New) Pause at frames with `quizStop: true` when `pauseOnQuizStops` is on,
//     so the UI can gate progress behind "drag all defenders, then submit".
//  7. Expose resolved actor positions + ball position for the current frame.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
      if (!selectedOptionId) continue;
      const option = b.options.find(o => o.id === selectedOptionId);
      if (!option) continue;
      (option.nextFrames || []).forEach((f, j) => pushBranch(f, b.id, option.id, j));
    }
  }
  return out;
}

function findNextUnresolvedBranch(play, selections, fromBaseIdx) {
  for (let i = fromBaseIdx; i < (play?.frames?.length ?? 0); i++) {
    const attached = (play.branches || []).filter(b => b.atFrameIdx === i);
    for (const b of attached) {
      if (!selections.has(b.id)) return { branch: b, baseIdx: i };
    }
  }
  return null;
}

export function usePlayback(play, {
  autoplay = false,
  speed: initialSpeed = 1,
  pauseOnQuizStops = false,
} = {}) {
  const [selections, setSelections] = useState(() => new Map());
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(initialSpeed);

  // Set of resolved-frame indices the user has explicitly cleared past.
  // A quiz-stop frame needs the user to submit correctly before playback
  // continues past it; once cleared, we remember so re-entering play doesn't
  // get stuck at the same stop again.
  const [clearedQuizIdxs, setClearedQuizIdxs] = useState(() => new Set());

  const resolved = useMemo(() => resolveFrames(play, selections), [play, selections]);
  const currentEntry = resolved[frameIdx] ?? null;
  const currentFrame = currentEntry?.frame ?? null;

  const pendingBranch = useMemo(() => {
    if (!currentEntry) return null;
    const isAtEnd = frameIdx >= resolved.length - 1;
    if (!isAtEnd) return null;
    let baseIdx = 0;
    if (currentEntry.origin.kind === 'base') {
      baseIdx = currentEntry.origin.baseIdx + 1;
    } else if (currentEntry.origin.kind === 'branch') {
      const parent = (play.branches || []).find(b => b.id === currentEntry.origin.branchId);
      baseIdx = parent ? parent.atFrameIdx + 1 : 0;
    }
    return findNextUnresolvedBranch(play, selections, baseIdx);
  }, [play, selections, resolved, frameIdx, currentEntry]);

  const wrongAttempt = useMemo(() => {
    if (!currentEntry || currentEntry.origin.kind !== 'branch') return null;
    const branch = (play?.branches || []).find(b => b.id === currentEntry.origin.branchId);
    if (!branch?.isQuiz) return null;
    const option = branch.options.find(o => o.id === currentEntry.origin.optionId);
    if (!option || option.isCorrect) return null;
    const nextEntry = resolved[frameIdx + 1];
    const isLast =
      !nextEntry ||
      nextEntry.origin.kind !== 'branch' ||
      nextEntry.origin.branchId !== currentEntry.origin.branchId ||
      nextEntry.origin.optionId !== currentEntry.origin.optionId;
    if (!isLast) return null;
    return { branch, option };
  }, [currentEntry, resolved, frameIdx, play]);

  const correctAttempt = useMemo(() => {
    if (!currentEntry || currentEntry.origin.kind !== 'branch') return null;
    const branch = (play?.branches || []).find(b => b.id === currentEntry.origin.branchId);
    if (!branch?.isQuiz) return null;
    const option = branch.options.find(o => o.id === currentEntry.origin.optionId);
    if (!option || !option.isCorrect) return null;
    const nextEntry = resolved[frameIdx + 1];
    const isLast =
      !nextEntry ||
      nextEntry.origin.kind !== 'branch' ||
      nextEntry.origin.branchId !== currentEntry.origin.branchId ||
      nextEntry.origin.optionId !== currentEntry.origin.optionId;
    if (!isLast) return null;
    return { branch, option };
  }, [currentEntry, resolved, frameIdx, play]);

  // Is the current frame a quiz stop we haven't cleared yet?
  const pendingQuizStop = useMemo(() => {
    if (!pauseOnQuizStops) return false;
    if (!currentFrame?.quizStop) return false;
    if (clearedQuizIdxs.has(frameIdx)) return false;
    return true;
  }, [pauseOnQuizStops, currentFrame, clearedQuizIdxs, frameIdx]);

  const atEnd = frameIdx >= resolved.length - 1 && !pendingBranch;

  // Auto-advance timer.
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!playing) return;
    if (pendingBranch) return;
    if (pendingQuizStop) {
      setPlaying(false);
      return;
    }
    if (wrongAttempt) {
      setPlaying(false);
      return;
    }
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
  }, [playing, frameIdx, resolved, speed, pendingBranch, pendingQuizStop, wrongAttempt, atEnd]);

  // Controls ----------------------------------------------------------------
  const play_ = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const step = useCallback((n = 1) => {
    setPlaying(false);
    setFrameIdx(i => Math.max(0, Math.min(i + n, resolved.length - 1)));
  }, [resolved.length]);
  const seekTo = useCallback((i) => {
    setPlaying(false);
    setFrameIdx(Math.max(0, Math.min(i, resolved.length - 1)));
  }, [resolved.length]);
  const restart = useCallback(() => {
    setPlaying(false);
    setFrameIdx(0);
    setSelections(new Map());
    setClearedQuizIdxs(new Set());
  }, []);
  const chooseBranchOption = useCallback((branchId, optionId) => {
    setSelections(prev => {
      const next = new Map(prev);
      next.set(branchId, optionId);
      return next;
    });
    setFrameIdx(i => i + 1);
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

  const retryBranch = useCallback((branchId) => {
    if (!play) return;
    const branch = (play.branches || []).find(b => b.id === branchId);
    if (!branch) return;
    setSelections(prev => {
      const next = new Map(prev);
      next.delete(branchId);
      return next;
    });
    setPlaying(false);
    const nextSelections = new Map(selections);
    nextSelections.delete(branchId);
    const nextResolved = resolveFrames(play, nextSelections);
    const target = nextResolved.findIndex(
      e => e.origin.kind === 'base' && e.origin.baseIdx === branch.atFrameIdx
    );
    if (target >= 0) setFrameIdx(target);
  }, [play, selections]);

  /**
   * Clear the current quiz stop and resume playback. Called by the viewer
   * after the kid submits the correct defender positions in quiz mode.
   */
  const clearQuizStopAndAdvance = useCallback(() => {
    setClearedQuizIdxs(prev => {
      const next = new Set(prev);
      next.add(frameIdx);
      return next;
    });
    setPlaying(true);
    setFrameIdx(i => Math.min(i + 1, resolved.length - 1));
  }, [frameIdx, resolved.length]);

  /**
   * Rewind to the nearest previous quiz stop (or frame 0). Used by the
   * viewer's "reset this round" button so the kid can re-watch what led in.
   */
  const rewindToPrevQuizStop = useCallback(() => {
    setPlaying(false);
    let target = 0;
    for (let i = frameIdx - 1; i >= 0; i--) {
      if (resolved[i]?.frame?.quizStop) { target = i; break; }
    }
    setFrameIdx(target);
  }, [frameIdx, resolved]);

  // Derive actor positions for the current frame, keyed by actorId.
  const positionsByActor = useMemo(() => {
    const map = new Map();
    if (!currentFrame) return map;
    for (const p of currentFrame.positions || []) {
      map.set(p.actorId, { x: p.x, y: p.y });
    }
    return map;
  }, [currentFrame]);

  // Also expose the PREVIOUS frame's positions : the quiz drag UI starts
  // defenders here so the kid drags from the last-known state.
  const prevPositionsByActor = useMemo(() => {
    const map = new Map();
    const prev = resolved[frameIdx - 1]?.frame;
    if (!prev) return map;
    for (const p of prev.positions || []) {
      map.set(p.actorId, { x: p.x, y: p.y });
    }
    return map;
  }, [resolved, frameIdx]);

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
    prevPositionsByActor,
    ballPosition,
    playing,
    speed,
    pendingBranch,
    pendingQuizStop,
    wrongAttempt,
    correctAttempt,
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
    retryBranch,
    clearQuizStopAndAdvance,
    rewindToPrevQuizStop,
  };
}
