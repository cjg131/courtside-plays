// Arrow : renders the four coaching arrow types on top of the court.
//
// Coaching conventions (match standard whiteboard notation):
//   PASS     : dashed line, triangle head
//   CUT      : solid line, triangle head
//   DRIBBLE  : wavy line (sine), triangle head
//   SCREEN   : solid line with a perpendicular bar at the end (T-cap)
//
// Arrows are scoped to a single frame and fade in/out with the frame.

import { motion } from 'framer-motion';
import { ARROWS, COLORS, ARROW_TYPES } from './constants.js';

export default function Arrow({ arrow, points, color, show = true }) {
  const type = arrow.type;
  const pts = points?.length ? points : arrow.points ?? [];
  if (pts.length < 2) return null;

  const strokeColor =
    color ??
    arrow.color ??
    (type === ARROW_TYPES.PASS ? COLORS.passArrow
      : type === ARROW_TYPES.DRIBBLE ? COLORS.dribbleArrow
      : type === ARROW_TYPES.SCREEN ? COLORS.screenArrow
      : COLORS.cutArrow);

  const common = {
    stroke: strokeColor,
    strokeWidth: ARROWS.strokeWidth,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    color: strokeColor, // cascades into markers
  };

  // Compute path by type
  let d = '';
  if (type === ARROW_TYPES.DRIBBLE) {
    d = wavyPath(pts, ARROWS.wavyAmplitude, ARROWS.wavyPeriod);
  } else {
    d = polyPath(pts);
  }

  const dash = type === ARROW_TYPES.PASS ? ARROWS.dashPattern : undefined;
  const marker = type === ARROW_TYPES.SCREEN ? null : 'url(#arrow-head)';

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      pointerEvents="none"
    >
      <path
        d={d}
        {...common}
        strokeDasharray={dash}
        markerEnd={marker}
        className={type === ARROW_TYPES.PASS ? 'dash-march' : ''}
      />
      {type === ARROW_TYPES.SCREEN && <ScreenCap pts={pts} color={strokeColor} />}
      {arrow.label && pts[0] && (
        <text
          x={pts[0].x}
          y={pts[0].y - 1.6}
          fontSize="1.2"
          fill={strokeColor}
          fontWeight="600"
          textAnchor="middle"
        >
          {arrow.label}
        </text>
      )}
    </motion.g>
  );
}

function polyPath(pts) {
  if (pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/**
 * Wavy path for dribble arrows. We walk the overall line in small segments
 * and offset perpendicular to the direction of travel using a sine wave.
 */
function wavyPath(pts, amp, period) {
  if (pts.length < 2) return '';
  const result = [];
  // Accumulate length along the polyline
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    segs.push({ a, b, dx, dy, len, start: total });
    total += len;
  }

  const steps = Math.max(20, Math.ceil(total / 0.25));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * total;
    // find which segment t falls in
    const seg = segs.find(s => t <= s.start + s.len) || segs[segs.length - 1];
    const localT = (t - seg.start) / seg.len;
    const px = seg.a.x + seg.dx * localT;
    const py = seg.a.y + seg.dy * localT;
    const nx = -seg.dy / seg.len;
    const ny = seg.dx / seg.len;
    const wave = Math.sin((t / period) * Math.PI * 2) * amp;
    const x = px + nx * wave;
    const y = py + ny * wave;
    result.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  return result.join(' ');
}

/** Perpendicular T-cap at the end of a screen arrow. */
function ScreenCap({ pts, color }) {
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = ARROWS.screenBarLength / 2;
  return (
    <line
      x1={b.x + nx * half}
      y1={b.y + ny * half}
      x2={b.x - nx * half}
      y2={b.y - ny * half}
      stroke={color}
      strokeWidth={ARROWS.strokeWidth}
      strokeLinecap="round"
    />
  );
}
