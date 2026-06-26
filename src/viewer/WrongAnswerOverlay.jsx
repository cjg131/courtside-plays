// WrongAnswerOverlay : shown after a wrong-answer teaching clip finishes.
// Surfaces WHY that choice was wrong and gives the kid a "Try again" button
// that rewinds to the branch point.

import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function WrongAnswerOverlay({ option, branch, onRetry }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
      <div className="panel bg-court-panel/95 backdrop-blur p-4 w-full max-w-md pointer-events-auto shadow-xl ring-1 ring-amber-400/60">
        <div className="flex items-start gap-2">
          <AlertTriangle className="text-amber-400 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
              Not quite
            </p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">
              You picked: {option.label}
            </p>
            {option.wrongReason ? (
              <p className="text-sm text-slate-300 mt-2 leading-snug">
                {option.wrongReason}
              </p>
            ) : (
              <p className="text-sm text-slate-400 mt-2 italic">
                Watch what happened, then try another read.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onRetry(branch.id)}
          className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
