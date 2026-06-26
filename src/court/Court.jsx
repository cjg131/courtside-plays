// Court : the SVG basketball court. Renders half or full court, horizontal or vertical.
//
// Coordinate system: 1 unit = 1 foot. Origin is top-left of the rendered court.
// - Half court: width 50, height 47 (from baseline at bottom up through midline at top).
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
  const baseW = COURT.fullWidth;                              // 50
  const baseH = isFull ? COURT.fullLength : COURT.halfLength; // 94 or 47

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
        {/* Floor */}
        <rect x="0" y="0" width={baseW} height={baseH} fill="url(#wood)" />

        {/* Sideline + baseline bounding rect */}
        <rect x="0" y="0" width={baseW} height={baseH}
              fill="none" stroke={COLORS.courtLine} strokeWidth="0.3" />

        {/* Full-court midline + center jump circle */}
        {isFull && (
          <g>
            <line x1="0" y1={baseH / 2} x2={baseW} y2={baseH / 2}
                  stroke={COLORS.courtLine} strokeWidth="0.4" />
            <circle cx={baseW / 2} cy={baseH / 2} r={COURT.centerRadius}
                    fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />
            <circle cx={baseW / 2} cy={baseH / 2} r={COURT.centerRadius / 3}
                    fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />
          </g>
        )}

        {/* Half-court view: draw the midcourt line (top edge) boldly and show the bottom
            half of the center jump circle bulging down into the offensive half. This
            is the key visual cue that we're looking at a half-court diagram. */}
        {!isFull && (
          <g>
            <line x1="0" y1="0" x2={baseW} y2="0"
                  stroke={COLORS.courtLine} strokeWidth="0.5" />
            <path
              d={`M ${baseW / 2 - COURT.centerRadius} 0
                  A ${COURT.centerRadius} ${COURT.centerRadius} 0 0 0
                    ${baseW / 2 + COURT.centerRadius} 0`}
              fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />
          </g>
        )}

        {/* Bottom half (attack basket at bottom). Always drawn. */}
        <HalfCourtElements baseW={baseW} baseY={baseH} flipped={false} />

        {/* Top half for full-court view. */}
        {isFull && <HalfCourtElements baseW={baseW} baseY={0} flipped={true} />}

        {/* Children : actors, ball, arrows, annotations. */}
        {children}
      </g>
    </svg>
  );
}

/**
 * Renders the elements of one half court: paint, free-throw line, 3-point arc, rim.
 * `baseY` is the baseline's y-coordinate. `flipped=true` draws the half toward the top
 * of the canvas (used for the top half of a full-court view).
 */
function HalfCourtElements({ baseW, baseY, flipped }) {
  const dir = flipped ? -1 : 1;
  const laneX = (baseW - COURT.laneWidth) / 2;
  const laneY = flipped ? baseY : baseY - COURT.laneLength;

  const ftCircleCy = flipped ? baseY + COURT.laneLength : baseY - COURT.laneLength;
  const rimCy = flipped ? baseY + COURT.rimOffsetFromBaseline : baseY - COURT.rimOffsetFromBaseline;

  // Modern 3-point geometry:
  //   arc = circle of radius 23.75 centered on the rim
  //   corners = straight lines at x = center ± 22, from baseline up to where the arc meets.
  //   the tangent y-offset from the rim = sqrt(23.75^2 - 22^2) ≈ 8.948
  const cornerX = COURT.threePtCornerX;                         // 22
  const arcR = COURT.threePtArcRadius;                          // 23.75
  const cornerOffset = Math.sqrt(arcR * arcR - cornerX * cornerX); // ≈ 8.948
  const cornerY = flipped ? rimCy + cornerOffset : rimCy - cornerOffset;

  // SVG arc sweep: start at the left corner tangent, end at the right corner tangent,
  // with the rim as the implicit center. The arc should bulge AWAY from the baseline.
  //   non-flipped (baseline at bottom, rim below the corners in SVG terms... wait, rim
  //     is at y = baseY - 5.25 which is above the baseline on screen; corners are at
  //     y = rimCy - 8.95 which is further above): rim sits BELOW the chord in SVG,
  //     arc passes through 12 o'clock (top) = clockwise = sweep 1.
  //   flipped (rim above the chord in SVG): arc passes through 6 o'clock (bottom) =
  //     counter-clockwise = sweep 0.
  const arcSweepFlag = flipped ? 0 : 1;

  return (
    <g>
      {/* Paint / lane */}
      <rect x={laneX} y={laneY} width={COURT.laneWidth} height={COURT.laneLength}
            fill={COLORS.paint} fillOpacity="0.22"
            stroke={COLORS.courtLine} strokeWidth="0.25" />

      {/* Free-throw line (top of the paint, where the FT line meets the key) */}
      <line
        x1={laneX} y1={ftCircleCy}
        x2={laneX + COURT.laneWidth} y2={ftCircleCy}
        stroke={COLORS.courtLine} strokeWidth="0.3"
      />

      {/* Free-throw circle */}
      <circle cx={baseW / 2} cy={ftCircleCy} r={COURT.freeThrowRadius}
              fill="none" stroke={COLORS.courtLine} strokeWidth="0.25" />

      {/* Restricted arc (semicircle centered on rim, radius 4) */}
      <path
        d={`M ${baseW / 2 - COURT.restrictedRadius} ${rimCy}
            A ${COURT.restrictedRadius} ${COURT.restrictedRadius} 0 0 ${flipped ? 0 : 1}
              ${baseW / 2 + COURT.restrictedRadius} ${rimCy}`}
        fill="none" stroke={COLORS.courtLine} strokeWidth="0.2" />

      {/* Backboard (in front of rim) */}
      <line
        x1={baseW / 2 - 3} y1={rimCy + dir * 0.5}
        x2={baseW / 2 + 3} y2={rimCy + dir * 0.5}
        stroke={COLORS.courtLine} strokeWidth="0.35"
      />

      {/* Rim */}
      <circle cx={baseW / 2} cy={rimCy} r={COURT.rimRadius}
              fill="none" stroke="#f87171" strokeWidth="0.3" />

      {/* 3-point corner straight lines : baseline up to cornerY */}
      <line x1={baseW / 2 - cornerX} y1={baseY}
            x2={baseW / 2 - cornerX} y2={cornerY}
            stroke={COLORS.courtLine} strokeWidth="0.3" />
      <line x1={baseW / 2 + cornerX} y1={baseY}
            x2={baseW / 2 + cornerX} y2={cornerY}
            stroke={COLORS.courtLine} strokeWidth="0.3" />

      {/* 3-point arc : circle radius 23.75 centered on the rim, between the two corner tangent points */}
      <path
        d={`M ${baseW / 2 - cornerX} ${cornerY}
            A ${arcR} ${arcR} 0 0 ${arcSweepFlag}
              ${baseW / 2 + cornerX} ${cornerY}`}
        fill="none" stroke={COLORS.courtLine} strokeWidth="0.3" />
    </g>
  );
}
