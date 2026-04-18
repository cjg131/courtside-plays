// Annotations : per-frame coach notes. Renders as SVG text pinned to an actor
// or to a court position, plus a "coach's note" callout at the top for any
// annotations without a pin.

import { motion } from 'framer-motion';

export default function Annotations({ frame, positionsByActor }) {
  if (!frame?.annotations?.length) return null;

  const pinned = [];
  const floating = [];
  for (const a of frame.annotations) {
    if (a.pinTo?.actorId) {
      const pos = positionsByActor.get(a.pinTo.actorId);
      if (pos) pinned.push({ a, x: pos.x, y: pos.y });
    } else if (a.pinTo?.x != null) {
      pinned.push({ a, x: a.pinTo.x, y: a.pinTo.y });
    } else {
      floating.push(a);
    }
  }

  return (
    <>
      {/* SVG-space pinned annotations */}
      {pinned.map(({ a, x, y }) => (
        <motion.g
          key={a.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          pointerEvents="none"
        >
          <rect
            x={x - a.text.length * 0.4 - 0.6}
            y={y - 4.2}
            width={a.text.length * 0.8 + 1.2}
            height={2}
            rx="0.3"
            fill="#0f172a"
            fillOpacity="0.85"
            stroke={a.emphasis ? '#f97316' : '#475569'}
            strokeWidth="0.1"
          />
          <text
            x={x}
            y={y - 2.9}
            fontSize="1.1"
            fontWeight={a.emphasis ? '700' : '500'}
            fill={a.emphasis ? '#f97316' : '#f1f5f9'}
            textAnchor="middle"
          >
            {a.text}
          </text>
        </motion.g>
      ))}

      {/* The floating (unpinned) annotations are rendered by the viewer in HTML, not SVG.
          We return a fragment here so the caller can also read floating via a ref-less pattern. */}
    </>
  );
}

/**
 * Get unpinned annotations so the viewer can render them as an HTML callout.
 */
export function getFloatingAnnotations(frame) {
  return (frame?.annotations ?? []).filter(a => !a.pinTo);
}
