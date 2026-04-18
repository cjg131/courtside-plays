// BranchPrompt : the "read the game" overlay. When playback hits a branch,
// the viewer sees a prompt asking what the defense is doing. Picking an option
// continues the animation down that branch.

import { HelpCircle } from 'lucide-react';

export default function BranchPrompt({ branch, onChoose }) {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-4 px-4 pointer-events-none">
      <div className="panel bg-court-panel/95 backdrop-blur p-4 w-full max-w-md pointer-events-auto shadow-xl">
        <div className="flex items-start gap-2">
          <HelpCircle className="text-court-accent mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-100">{branch.prompt}</p>
            <p className="text-xs text-slate-400 mt-0.5">Read the play : what's the defense doing?</p>
          </div>
        </div>
        <div className="grid gap-2 mt-3">
          {branch.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onChoose(opt.id)}
              className="text-left btn-secondary hover:bg-slate-700 w-full"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
