// EditorCanvas: the court surface. Handles:
//   - tool-based interactions (add actor, draw arrow, place annotation pin)
//   - dragging actors to new positions on the selected frame
//   - rendering a live preview of whatever is being drawn
//
// We manage our own SVG ref so we can translate pointer events from screen
// space into court-feet coordinates regardless of orientation/scale.

import { useRef, useState } from 'react';
import Court from '../court/Court.jsx';
import Actor from '../court/Actor.jsx';
import Ball from '../court/Ball.jsx';
import Arrow from '../court/Arrow.jsx';
import Annotations from '../viewer/Annotations.jsx';
import { TOOLS, ACTOR_TYPES } from './useEditor.js';
import { ARROW_TYPES, COLORS } from '../court/constants.js';

const TOOL_TO_ACTOR_KIND = {
  [TOOLS.ADD_OFFENSE]: ACTOR_TYPES.OFFENSE,
  [TOOLS.ADD_DEFENSE]: ACTOR_TYPES.DEFENSE,
  [TOOLS.ADD_COACH]: ACTOR_TYPES.COACH,
};

const TOOL_TO_ARROW_TYPE = {
  [TOOLS.ARROW_PASS]: ARROW_TYPES.PASS,
  [TOOLS.ARROW_CUT]: ARROW_TYPES.CUT,
  [TOOLS.ARROW_DRIBBLE]: ARROW_TYPES.DRIBBLE,
  [TOOLS.ARROW_SCREEN]: ARROW_TYPES.SCREEN,
};

export default function EditorCanvas({ editor }) {
  const {
    play, currentFrame, tool, selectedActorId,
    setSelectedActorId, addActor, moveActor, addArrow, addAnnotation,
  } = editor;

  const svgRef = useRef(null);
  const [draftArrow, setDraftArrow] = useState(null);   // { actorId, toActorId, points: [{x,y}, ...] }
  const [dragging, setDragging] = useState(null);       // { actorId, offsetX, offsetY }

  const toCourt = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  };

  const positionsById = new Map((currentFrame?.positions ?? []).map(p => [p.actorId, p]));
  const ballHolder = currentFrame?.ballHolder ?? null;

  // ---- background interactions ----
  const onBackgroundPointerDown = (e) => {
    if (e.target !== e.currentTarget) return; // let actor handle its own
    const { x, y } = toCourt(e.clientX, e.clientY);
    const kind = TOOL_TO_ACTOR_KIND[tool];
    const arrowType = TOOL_TO_ARROW_TYPE[tool];

    if (kind) {
      addActor({ x: clamp(x, 1, 49), y: clamp(y, 1, 46), kind });
      return;
    }
    if (arrowType) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDraftArrow({ type: arrowType, actorId: null, toActorId: null, points: [{ x, y }, { x, y }] });
      return;
    }
    if (tool === TOOLS.ANNOTATE) {
      const text = prompt('Coach note for this frame:');
      if (text?.trim()) addAnnotation({ text: text.trim(), pinTo: { x, y } });
      return;
    }
    // select tool on background = clear selection
    setSelectedActorId(null);
  };

  const onPointerMove = (e) => {
    if (draftArrow) {
      const { x, y } = toCourt(e.clientX, e.clientY);
      setDraftArrow(d => d ? { ...d, points: [d.points[0], { x, y }] } : d);
      return;
    }
    if (dragging) {
      const { x, y } = toCourt(e.clientX, e.clientY);
      moveActor(dragging.actorId, clamp(x, 0.5, 49.5), clamp(y, 0.5, 46.5));
    }
  };

  const onPointerUp = (e) => {
    if (draftArrow) {
      const a = draftArrow.points[0];
      const b = draftArrow.points[1];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist > 1) {
        // attach to the actor nearest each endpoint (within snapping radius)
        const aActor = nearestActor(a, positionsById);
        const bActor = nearestActor(b, positionsById);
        addArrow({
          type: draftArrow.type,
          actorId: aActor?.actorId ?? null,
          toActorId: draftArrow.type === ARROW_TYPES.PASS ? bActor?.actorId ?? null : null,
          points: [
            aActor ? { x: aActor.x, y: aActor.y } : a,
            bActor ? { x: bActor.x, y: bActor.y } : b,
          ],
        });
      }
      setDraftArrow(null);
    }
    setDragging(null);
  };

  // ---- actor interactions ----
  const onActorPointerDown = (actor, e) => {
    e.stopPropagation();
    setSelectedActorId(actor.id);
    if (tool === TOOLS.SELECT) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragging({ actorId: actor.id });
      return;
    }
    const arrowType = TOOL_TO_ARROW_TYPE[tool];
    if (arrowType) {
      const pos = positionsById.get(actor.id);
      if (!pos) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDraftArrow({
        type: arrowType,
        actorId: actor.id,
        toActorId: null,
        points: [{ x: pos.x, y: pos.y }, { x: pos.x, y: pos.y }],
      });
    }
  };

  const cursor = {
    [TOOLS.SELECT]: 'default',
    [TOOLS.ADD_OFFENSE]: 'copy',
    [TOOLS.ADD_DEFENSE]: 'copy',
    [TOOLS.ADD_COACH]: 'copy',
    [TOOLS.ANNOTATE]: 'text',
    [TOOLS.ARROW_PASS]: 'crosshair',
    [TOOLS.ARROW_CUT]: 'crosshair',
    [TOOLS.ARROW_DRIBBLE]: 'crosshair',
    [TOOLS.ARROW_SCREEN]: 'crosshair',
  }[tool] || 'default';

  return (
    <div
      className="relative w-full"
      style={{ cursor }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Court
        svgRef={svgRef}
        view={play.court?.view ?? 'half'}
        orientation={play.court?.orientation ?? 'vertical'}
        className="w-full h-full rounded-md select-none touch-none"
      >
        <rect
          x={-1}
          y={-1}
          width={52}
          height={isFullView(play) ? 96 : 49}
          fill="transparent"
          onPointerDown={onBackgroundPointerDown}
        />

        {/* Existing arrows */}
        {(currentFrame?.arrows ?? []).map(arrow => (
          <Arrow key={arrow.id} arrow={arrow} />
        ))}

        {/* Draft arrow preview */}
        {draftArrow && (
          <Arrow
            arrow={{
              id: 'draft',
              type: draftArrow.type,
              actorId: draftArrow.actorId,
              toActorId: draftArrow.toActorId,
              points: draftArrow.points,
              label: '',
            }}
          />
        )}

        {/* Actors */}
        {play.actors.map(actor => {
          const pos = positionsById.get(actor.id);
          if (!pos) return null;
          const isSelected = selectedActorId === actor.id;
          return (
            <g
              key={actor.id}
              onPointerDown={(e) => onActorPointerDown(actor, e)}
              style={{ cursor: tool === TOOLS.SELECT ? 'grab' : 'pointer' }}
            >
              {isSelected && (
                <circle cx={pos.x} cy={pos.y} r={2.1} fill="none" stroke={COLORS.ball} strokeWidth="0.2" strokeDasharray="0.4 0.3" />
              )}
              <Actor
                actor={actor}
                x={pos.x}
                y={pos.y}
                hasBall={ballHolder === actor.id}
                transition={{ type: 'tween', duration: 0.15 }}
              />
            </g>
          );
        })}

        {/* Ball (free-floating if no holder but ballPosition set) */}
        {!ballHolder && currentFrame?.ballPosition && (
          <Ball x={currentFrame.ballPosition.x} y={currentFrame.ballPosition.y} dribble={false} />
        )}
        {ballHolder && (() => {
          const pos = positionsById.get(ballHolder);
          return pos ? <Ball x={pos.x + 1.6} y={pos.y - 0.2} dribble /> : null;
        })()}

        <Annotations frame={currentFrame} positionsByActor={positionsById} />
      </Court>
    </div>
  );
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function nearestActor(pt, positionsById, radius = 2.2) {
  let best = null;
  let bestDist = radius;
  for (const pos of positionsById.values()) {
    const d = Math.hypot(pos.x - pt.x, pos.y - pt.y);
    if (d < bestDist) { best = pos; bestDist = d; }
  }
  return best;
}

function isFullView(play) { return (play?.court?.view ?? 'half') === 'full'; }
