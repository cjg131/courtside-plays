// QuizSubmitBar : the HTML overlay pane at the bottom of the court with
// the Submit/Reset buttons and the coach-note feedback on wrong submits.

import { CheckCircle2, RotateCcw, Send } from 'lucide-react';

export default function QuizSubmitBar({
  coachNote,
  result,
  onSubmit,
  onReset,
}) {
  return (
    <div className="absolute left-3 right-3 bottom-3 pointer-events-none">
      <div className="flex items-end gap-2 justify-between pointer-events-auto">
        <div className="flex-1 min-w-0">
          {result === 'correct' && (
            <div className="panel bg-emerald-900/85 ring-1 ring-emerald-400/60 px-3 py-2 text-sm text-emerald-100 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-300" />
              <span>Nice. Advancing to the next read...</span>
            </div>
          )}
          {result === 'wrong' && (
            <div className="panel bg-amber-900/85 ring-1 ring-amber-400/60 px-3 py-2 text-sm text-amber-50">
              <p className="font-semibold text-amber-200 text-[10px] uppercase tracking-widest mb-1">
                Not quite — here's the rotation
              </p>
              <p className="leading-snug">
                {coachNote || 'The blue dashed X marks show the correct defender spots. Drag yours to match, then submit again.'}
              </p>
            </div>
          )}
          {!result && (
            <p className="text-xs text-slate-300 px-1 pb-1">
              Drag every defender into the right spot for this ball position, then hit Submit.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-secondary" onClick={onReset} title="Reset defenders">
            <RotateCcw size={14} />
          </button>
          <button
            className="btn-primary flex items-center gap-1"
            onClick={onSubmit}
            disabled={result === 'correct'}
          >
            <Send size={14} />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
