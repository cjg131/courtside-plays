// Ball : renders the basketball. Can be attached to an actor (positioned on its shoulder)
// or free at an absolute court position (pass in the air).

import { motion } from 'framer-motion';
import { ACTORS, COLORS } from './constants.js';

export default function Ball({
  x,
  y,
  dribble = false,
  transition = { type: 'tween', duration: 0.8, ease: 'easeInOut' },
  layoutId = 'ball',
}) {
  return (
    <motion.g
      layoutId={layoutId}
      initial={false}
      animate={{ x, y }}
      transition={transition}
      pointerEvents="none"
    >
      <circle
        r={ACTORS.ballRadius}
        fill={COLORS.ball}
        stroke="#7c2d12"
        strokeWidth="0.1"
        className={dribble ? 'animate-dribble' : ''}
      />
      {/* ball seams : simple cross */}
      <line x1={-ACTORS.ballRadius} y1="0" x2={ACTORS.ballRadius} y2="0"
            stroke="#7c2d12" strokeWidth="0.08" />
      <line x1="0" y1={-ACTORS.ballRadius} x2="0" y2={ACTORS.ballRadius}
            stroke="#7c2d12" strokeWidth="0.08" />
    </motion.g>
  );
}
