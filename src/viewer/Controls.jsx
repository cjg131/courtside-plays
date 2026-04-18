// Playback controls: restart, step back, play/pause, step forward, scrub, speed.
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward } from 'lucide-react';

const SPEEDS = [0.5, 1, 1.5, 2];

export default function Controls({ pb }) {
  const { playing, togglePlay, step, restart, frameIdx, resolved, seekTo, speed, setSpeed, pendingBranch } = pb;

  return (
    <div className="panel mt-3 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn-secondary" onClick={restart} title="Restart">
          <RotateCcw size={16} />
        </button>
        <button className="btn-secondary" onClick={() => step(-1)} title="Previous frame" disabled={frameIdx === 0}>
          <SkipBack size={16} />
        </button>
        <button
          className={pendingBranch ? 'btn-secondary opacity-60' : 'btn-primary'}
          onClick={togglePlay}
          disabled={!!pendingBranch}
          title={pendingBranch ? 'Pick a read first' : (playing ? 'Pause' : 'Play')}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="btn-secondary" onClick={() => step(1)} title="Next frame" disabled={frameIdx >= resolved.length - 1}>
          <SkipForward size={16} />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <FastForward size={14} className="text-slate-400" />
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`px-2 py-1 text-xs rounded ${speed === s ? 'bg-court-accent text-slate-900' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={Math.max(0, resolved.length - 1)}
          value={frameIdx}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="w-full accent-orange-500"
          disabled={resolved.length <= 1}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Frame {frameIdx + 1}</span>
          <span>of {resolved.length}</span>
        </div>
      </div>
    </div>
  );
}
