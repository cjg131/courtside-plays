// PlayViewer: resolves a play by id (sample or localStorage) and renders PlayStage.
// The actual playback UI lives in PlayStage.jsx so SharedViewer can reuse it.

import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Share2, Edit3, Library, Check } from 'lucide-react';
import PlayStage from './PlayStage.jsx';
import { getSamplePlayById, getSamplePlays } from '../data/samplePlays.js';
import { getPlay, encodePlayForUrl } from '../data/storage.js';

export default function PlayViewer() {
  const { playId } = useParams();
  const play = useMemo(() => {
    return getSamplePlayById(playId) ?? getPlay(playId) ?? getSamplePlays()[0];
  }, [playId]);

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!play) return;
    const encoded = encodePlayForUrl(play);
    const url = `${window.location.origin}/share/${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for environments without clipboard access
      prompt('Copy this link:', url);
    }
  };

  const header = (
    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
      <div>
        <p className="text-xs text-slate-400">{play?.meta.type}</p>
        <h1 className="text-lg font-semibold text-slate-100">{play?.meta.name}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleShare} className="btn-ghost text-sm" title="Copy share link">
          {copied ? <><Check size={14} /> Copied</> : <><Share2 size={14} /> Share</>}
        </button>
        {play && !getSamplePlayById(play.meta.id) && (
          <Link to={`/edit/${play.meta.id}`} className="btn-ghost text-sm" title="Edit this play">
            <Edit3 size={14} /> Edit
          </Link>
        )}
        <Link to="/" className="btn-secondary text-sm">
          <Library size={14} /> Library
        </Link>
      </div>
    </div>
  );

  return <PlayStage play={play} header={header} />;
}
