// Court geometry constants. We render the court in "court units" then scale to pixels via SVG viewBox.
// This keeps math simple regardless of screen size.
//
// Full court baseline dimensions (NBA/HS hybrid, close enough for visualization):
//   94 ft long × 50 ft wide.
// We use 1 unit = 1 foot so positions are intuitive.

export const COURT = {
  // full court
  fullWidth: 50,     // feet (x-axis, baseline to baseline is the long axis)
  fullLength: 94,    // feet (y-axis)
  // half court (rendered default for most CYO plays)
  halfLength: 47,
  // lane / paint
  laneWidth: 12,     // NBA width, wider than HS but reads cleaner
  laneLength: 19,
  // three-point line (modern NBA style)
  //   - arc is a circle of radius 23.75 centered on the rim
  //   - corner straight lines are 22 ft from the center of the court
  //   - the straight line meets the arc where x = ±22 from center,
  //     at y distance sqrt(23.75^2 - 22^2) ≈ 8.95 from the rim
  threePtArcRadius: 23.75,
  threePtCornerX: 22,
  // rim
  rimRadius: 0.75,
  rimOffsetFromBaseline: 5.25,
  // free throw circle
  freeThrowRadius: 6,
  // centerjump circle
  centerRadius: 6,
  // restricted arc
  restrictedRadius: 4,
};

// Actor / ball render sizes (in court feet)
export const ACTORS = {
  playerRadius: 1.4,
  jerseyFontSize: 1.4,
  ballRadius: 0.8,
  defenderStrokeWidth: 0.35, // for the X mark
};

// Arrow styling (in court feet)
export const ARROWS = {
  strokeWidth: 0.3,
  headSize: 1.1,
  screenBarLength: 1.6,
  dashPattern: '0.9 0.6',   // pass (dashed)
  wavyAmplitude: 0.45,      // dribble wiggle
  wavyPeriod: 1.4,
};

// Jersey color tokens (kept in sync with tailwind config)
export const COLORS = {
  offense: '#2563eb',
  defense: '#dc2626',
  ghost: '#94a3b8',
  ball: '#f97316',
  passArrow: '#fde68a',
  cutArrow: '#60a5fa',
  dribbleArrow: '#f97316',
  screenArrow: '#a78bfa',
  courtFloor: '#d4a373',
  courtLine: '#f8fafc',
  paint: '#3b82f6',
};

// Arrow types : keep as an enum-like const so editor + renderer stay in lock-step.
export const ARROW_TYPES = {
  PASS: 'pass',       // dashed line, triangle head
  CUT: 'cut',         // solid line, triangle head
  DRIBBLE: 'dribble', // wavy line, triangle head
  SCREEN: 'screen',   // solid line, T-bar at end
};

// Actor types
export const ACTOR_TYPES = {
  OFFENSE: 'offense',
  DEFENSE: 'defense',
  COACH: 'coach',
  GHOST: 'ghost', // used for branch previews
};
