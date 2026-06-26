// QuizDefenderLayer : SVG group that renders draggable defenders for quiz mode.
// Renders inside the parent's Court <svg>. Target ghosts only appear after a
// wrong submit, as a visual hint of where the defenders should have been.

import Actor from '../court/Actor.jsx';
import { ACTOR_TYPES, ACTORS } from '../court/constants.js';

export default function QuizDefenderLayer({
  play,
  dragPositions,
  targets,
  result,
  startDrag,
}) {
  const defenders = play.actors.filter(a => a.kind === ACTOR_TYPES.DEFENSE);

  return (
    <g>
      {/* Ghost targets : only visible after a wrong submit. */}
      {result === 'wrong' && Array.from(targets.entries()).map(([id, t]) => {
        const actor = defenders.find(a => a.id === id);
        if (!actor) return null;
        return (
          <g key={`ghost-${id}`} transform={`translate(${t.x} ${t.y})`} opacity="0.55">
            <circle r={ACTORS.playerRadius + 0.9} fill="none"
                    stroke="#22d3ee" strokeWidth="0.28"
                    strokeDasharray="0.7 0.45" />
            <line x1={-ACTORS.playerRadius} y1={-ACTORS.playerRadius}
                  x2={ACTORS.playerRadius}  y2={ACTORS.playerRadius}
                  stroke="#22d3ee" strokeWidth="0.25" strokeLinecap="round" />
            <line x1={ACTORS.playerRadius}  y1={-ACTORS.playerRadius}
                  x2={-ACTORS.playerRadius} y2={ACTORS.playerRadius}
                  stroke="#22d3ee" strokeWidth="0.25" strokeLinecap="round" />
            <text x={0} y={ACTORS.playerRadius + 1.8} textAnchor="middle"
                  fontSize={ACTORS.jerseyFontSize} fill="#22d3ee" fontWeight="700">
              {actor.label}
            </text>
          </g>
        );
      })}
      {/* Draggable defenders at their current drag positions. */}
      {defenders.map(actor => {
        const pos = dragPositions.get(actor.id);
        if (!pos) return null;
        return (
          <Actor
            key={actor.id}
            actor={actor}
            x={pos.x}
            y={pos.y}
            layoutId={`quiz-actor-${actor.id}`}
            hasBall={false}
            highlighted={result === 'correct'}
            onPointerDown={startDrag(actor.id)}
            transition={{ type: 'tween', duration: 0, ease: 'linear' }}
          />
        );
      })}
    </g>
  );
}
