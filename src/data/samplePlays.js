// Sample plays: preloaded content for the viewer.
//
// Currently registering just the 1-2-2 zone basics teaching play. Demo-flow
// removed per CJ : cluttered the library and distracted from the real play.

import { build122ZoneBasicsPlay } from './zone122Quiz.js';

/** Registry of preloaded plays. */
export function getSamplePlays() {
  return [build122ZoneBasicsPlay()];
}

export function getSamplePlayById(id) {
  return getSamplePlays().find(p => p.meta.id === id) ?? null;
}
