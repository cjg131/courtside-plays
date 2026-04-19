// useQuizDragger : owns the quiz-mode drag state + validation.
//
// Given a target frame (the "answer key" defender positions) and a seed
// of starting positions (previous frame's defender positions), this hook
// tracks live drag positions, exposes pointer handlers, and validates on
// submit against a tolerance.
//
// Returns everything a view layer needs:
//   dragPositions       : Map<actorId, {x,y}>  current drag state
//   targets             : Map<actorId, {x,y}>  answer key
//   startDrag(actorId)  : pointerdown handler factory
//   handleSubmit()      : runs validation, sets `result` to 'correct'|'wrong'
//   handleReset()       : snap back to seed positions
//   result              : 'correct'|'wrong'|null
//   setResult           : direct setter (parent may clear on frame change)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACTOR_TYPES } from '../court/constants.js';

const TOLERANCE = 4.5; // feet

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function useQuizDragger({ play, currentFrame, seedPositionsByActor, svgRef }) {
  // Answer key : just the defender positions for this frame.
  const targets = useMemo(() => {
    const m = new Map();
    if (!play || !currentFrame) return m;
    for (const p of currentFrame.positions || []) {
      const actor = play.actors.find(a => a.id === p.actorId);
      if (actor?.kind === ACTOR_TYPES.DEFENSE) {
        m.set(p.actorId, { x: p.x, y: p.y });
      }
    }
    return m;
  }, [play, currentFrame]);

  // Live drag positions. Seeded when the frame (or the seed map) changes.
  const [dragPositions, setDragPositions] = useState(() => new Map());
  const [result, setResult] = useState(null);

  const frameId = currentFrame?.id;
  useEffect(() => {
    const m = new Map();
    if (play && seedPositionsByActor) {
      for (const [id, pos] of seedPositionsByActor.entries()) {
        const actor = play.actors.find(a => a.id === id);
        if (actor?.kind === ACTOR_TYPES.DEFENSE) m.set(id, { ...pos });
      }
    }
    setDragPositions(m);
    setResult(null);
  }, [frameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pointer conversion : screen -> court feet.
  const toCourt = useCallback((clientX, clientY) => {
    const svg = svgRef?.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }, [svgRef]);

  const draggingRef = useRef(null);

  const startDrag = useCallback((actorId) => (e) => {
    const current = dragPositions.get(actorId);
    if (!current) return;
    e.preventDefault?.();
    const { x, y } = toCourt(e.clientX, e.clientY);
    draggingRef.current = {
      actorId,
      pointerId: e.pointerId,
      offsetX: x - current.x,
      offsetY: y - current.y,
    };
    e.currentTarget?.setPointerCapture?.(e.pointerId);
    setResult(null);
  }, [dragPositions, toCourt]);

  useEffect(() => {
    const onMove = (e) => {
      const d = draggingRef.current;
      if (!d) return;
      const { x, y } = toCourt(e.clientX, e.clientY);
      setDragPositions(prev => {
        const next = new Map(prev);
        next.set(d.actorId, {
          x: clamp(x - d.offsetX, 0.8, 49.2),
          y: clamp(y - d.offsetY, 0.8, 46.2),
        });
        return next;
      });
    };
    const onUp = () => { draggingRef.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [toCourt]);

  const handleSubmit = useCallback(() => {
    let allInside = true;
    const misses = [];
    for (const [id, target] of targets.entries()) {
      const drag = dragPositions.get(id);
      if (!drag) { allInside = false; misses.push(id); continue; }
      const dist = Math.hypot(drag.x - target.x, drag.y - target.y);
      if (dist > TOLERANCE) { allInside = false; misses.push(id); }
    }
    setResult(allInside ? 'correct' : 'wrong');
    return { ok: allInside, misses };
  }, [targets, dragPositions]);

  const handleReset = useCallback(() => {
    const m = new Map();
    if (play && seedPositionsByActor) {
      for (const [id, pos] of seedPositionsByActor.entries()) {
        const actor = play.actors.find(a => a.id === id);
        if (actor?.kind === ACTOR_TYPES.DEFENSE) m.set(id, { ...pos });
      }
    }
    setDragPositions(m);
    setResult(null);
  }, [play, seedPositionsByActor]);

  return {
    dragPositions,
    targets,
    result,
    setResult,
    startDrag,
    handleSubmit,
    handleReset,
  };
}
