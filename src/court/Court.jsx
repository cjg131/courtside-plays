// Court : the SVG basketball court. Renders half or full court, horizontal or vertical.
//
// Coordinate system: 1 unit = 1 foot. Origin is top-left of the rendered court.
// - Half court: width 50, height 47 (from baseline up through midline).
// - Full court: width 50, height 94.
//
// Orientation controls which axis is the "long" one. Vertical (default) is natural for
// mobile portrait : baseline at bottom. Horizontal is natural for a desktop whiteboard
// feel : baseline on the right.

import { COURT, COLORS } from './constants.js';

export default function Court({
  view = 'half',
  orientation = 'vertical',
  className = '',
  children,
  onBackgroundClick,
  svgRef,
}) {
  const isFull = view === 'full';
  const baseW = COURT.fullWidth;                           // 50
  const baseH = isFull ? COURT.fullLength : COURT.halfLength; // 94 or 47

  // In vertical orientation baseline is at the bottom of the svg; we mirror Y so
  // that "up the court" feels natural.
  const width = orientation === 'vertical' ? baseW : baseH;
  const height = orientation === 'vertical' ? baseH : baseW;

  const handleBgClick = (e) => {
    if (!onBackgroundClick) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    onBackgroundClick({ x: loc.x, y: loc.y, event: e });
  };

  // We draw the court in its "vertical" reference frame then rotate for horizontal.
  const rotate = orientation === 'horizontal' ? `rotate(-90 ${baseH / 2} ${baseH / 2})` : '';

  return (
    <svg
      ref={svgRef}
      className={`court-svg ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      onClick={handleBgClick}
    >
      {/* Floor */}
      <defs>
        <pattern id="wood" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={COLORS.courtFloor} />
          <path d="M0 0 L6 0" stroke="#b08060" strokeWidth="0.08" opacity="0.35" />
        </pattern>
        <marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
        </marker>
      </defs>

      <g transform={rotate}>
        <rect x="0" y="0" width={baseW} height={baseH} fill="url(#wood)" />

        {/* Sideline + baseline */}
        <rect x="0" y="0" width={baseW} height={baseH}
              fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />

        {/* Full-court midline + center circle */}
        {isFull && (
          <g>
            <line x1="0" y1={baseH / 2} x2={baseW} y2={baseH / 2}
                  stroke={COLORS.courtLine} strokeWidth="0.25" />
            <circle cx={baseW / 2} cy={baseH / 2} r={COURT.centerRadius}
                    fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />
          </g>
        )}

        {/* Bottom half (attack basket at bottom). Always drawn. */}
        <HalfCourtElements baseW={baseW} baseY={baseH} flipped={false} />

        {/* Top half for full-court view. */}
        {isFull && <HalfCourtElements baseW={baseW} baseY={0} flipped={true} />}

        {/* Children = actors, ball, arrows, annotations. Rendered in play coordinates. */}
        {children}
      </g>
    </svg>
  );
}

/**
 * Renders the elements of one half court: paint, free-throw line, 3-point arc, rim.
 * `baseY` is the baseline's y-coordinate. `flipped=true` draws toward the top.
 */
function HalfCourtElements({ baseW, baseY, flipped }) {
  const dir = flipped ? -1 : 1;
  const laneX = (baseW - COURT.laneWidth) / 2;
  const laneY = flipped ? baseY : baseY - COURT.laneLength;

  const ftCircleCy = flipped ? baseY + COURT.laneLength : baseY - COURT.laneLength;

  const rimCy = flipped ? baseY + COURT.rimOffsetFromBaseline : baseY - COURT.rimOffsetFromBaseline;

  // 3-point arc. Approximation: straight corner up to cornerY, then arc to the rim radius.
  const cornerY = flipped ? baseY + COURT.threePtCornerY : baseY - COURT.threePtCornerY;
  const arcLargeFlag = 0;
  const arcSweepFlag = flipped ? 1 : 0;

  return (
    <g>
      {/* Paint / lane */}
      <rect x={laneX} y={laneY} width={COURT.laneWidth} height={COURT.laneLength}
            fill={COLORS.paint} fillOpacity="0.22"
            stroke={COLORS.courtLine} strokeWidth="0.25" />

      {/* Free-throw circle (lower half dashed traditionally : we draw solid for clarity) */}
      <circle cx={baseW / 2} cy={ftCircleCy} r={COURT.freeThrowRadius}
              fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />

      {/* Restricted arc */}
      <path
        d={`M ${baseW / 2 - COURT.restrictedRadius} ${rimCy}
            A ${COURT.restrictedRadius} ${COURT.restrictedRadius} 0 0 ${flipped ? 0 : 1}
              ${baseW / 2 + COURT.restrictedRadius} ${rimCy}`}
        fill="none" stroke={COLORS.courtLine} strokeWidth="0.2" />

      {/* Backboard */}
      <line
        x1={baseW / 2 - 3} y1={rimCy + dir * 0.5}
        x2={baseW / 2 + 3} y2={rimCy + dir * 0.5}
        stroke={COLORS.courtLine} strokeWidth="0.3"
      />

      {/* Rim */}
      <circle cx={baseW / 2} cy={rimCy} r={COURT.rimRadius}
              fill="none" stroke={COLORS.courtAccent ?? COLORS.courtLine} strokeWidth="0.25" />

      {/* 3-point corners */}
      <line x1={baseW / 2 - COURT.threePtRadius} y1={baseY}
            x2={baseW / 2 - COURT.threePtRadius} y2={cornerY}
            stroke={COLORS.courtLine} strokeWidth="0.25" />
      <line x1={baseW / 2 + COURT.threePtRadius} y1={baseY}
            x2={baseW / 2 + COURT.threePtRadius} y2={cornerY}
            stroke={COLORS.courtLine} strokeWidth="0.25" />

      {/* 3-point arc between the corners */}
      <path
        d={`M ${baseW / 2 - COURT.threePtRadius} ${cornerY}
            A ${COURT.threePtRadius} ${COURT.threePtRadius} 0 ${arcLargeFlag} ${arcSweepFlag}
              ${baseW / 2 + COURT.threePtRadius} ${cornerY}`}
        fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />
    </g>
  );
}
