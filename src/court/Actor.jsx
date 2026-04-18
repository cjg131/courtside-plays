// Actor : renders one player (offense circle, defense X, coach marker).
// Accepts motion props so the parent animation engine can animate position with Framer Motion.

import { motion } from 'framer-motion';
import { ACTORS, COLORS, ACTOR_TYPES } from './constants.js';

export default function Actor({
  actor,
  x,
  y,
  highlighted = false,
  hasBall = false,
  onPointerDown,
  transition = { type: 'tween', duration: 0.8, ease: 'easeInOut' },
  layoutId, // Framer uses this to interpolate between frames
}) {
  const kind = actor.kind ?? ACTOR_TYPES.OFFENSE;
  const color =
    actor.color ??
    (kind === ACTOR_TYPES.DEFENSE
      ? COLORS.defense
      : kind === ACTOR_TYPES.GHOST
      ? COLORS.ghost
      : COLORS.offense);
  const label = actor.label ?? '';

  // Defense markers are rendered as an X. Offense / ghost / coach as a filled circle with label.
  if (kind === ACTOR_TYPES.DEFENSE) {
    return (
      <motion.g
        layoutId={layoutId}
        initial={false}
        animate={{ x, y }}
        transition={transition}
        className={onPointerDown ? 'actor-handle' : ''}
        onPointerDown={onPointerDown}
      >
        {highlighted && (
          <circle r={ACTORS.playerRadius + 0.5} fill="none" stroke={color}
                  strokeWidth="0.25" strokeOpacity="0.7"
                  className="animate-pulse-ring" />
        )}
        <line x1={-ACTORS.playerRadius} y1={-ACTORS.playerRadius}
              x2={ACTORS.playerRadius} y2={ACTORS.playerRadius}
              stroke={color} strokeWidth={ACTORS.defenderStrokeWidth} strokeLinecap="round" />
        <line x1={ACTORS.playerRadius} y1={-ACTORS.playerRadius}
              x2={-ACTORS.playerRadius} y2={ACTORS.playerRadius}
              stroke={color} strokeWidth={ACTORS.defenderStrokeWidth} strokeLinecap="round" />
        {label && (
          <text x={0} y={ACTORS.playerRadius + 1.6}
                textAnchor="middle" fontSize={ACTORS.jerseyFontSize}
                fill={color} fontWeight="600">
            {label}
          </text>
        )}
      </motion.g>
    );
  }

  // Offense / ghost / coach : circle + jersey number / label
  const isGhost = kind === ACTOR_TYPES.GHOST;
  return (
    <motion.g
      layoutId={layoutId}
      initial={false}
      animate={{ x, y }}
      transition={transition}
      className={onPointerDown ? 'actor-handle' : ''}
      onPointerDown={onPointerDown}
    >
      {highlighted && (
        <circle r={ACTORS.playerRadius + 0.6} fill="none" stroke={color}
                strokeWidth="0.3" strokeOpacity="0.8"
                className="animate-pulse-ring" />
      )}
      <circle
        r={ACTORS.playerRadius}
        fill={color}
        fillOpacity={isGhost ? 0.35 : 1}
        stroke="#ffffff"
        strokeOpacity={isGhost ? 0.3 : 0.6}
        strokeWidth="0.18"
      />
      {hasBall && (
        <circle r={ACTORS.playerRadius + 0.55} fill="none"
                stroke={COLORS.ball} strokeWidth="0.3" />
      )}
      <text
        x="0"
        y={ACTORS.jerseyFontSize / 2.8}
        textAnchor="middle"
        fontSize={ACTORS.jerseyFontSize}
        fill="#ffffff"
        fontWeight="700"
        pointerEvents="none"
      >
        {label}
      </text>
    </motion.g>
  );
}
