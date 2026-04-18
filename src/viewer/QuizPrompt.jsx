// QuizPrompt : quiz-mode variant of BranchPrompt.
//
// Shows "you are player X — [description]" at the top, the question, then the
// option buttons. The kid picks one. We don't reveal whether they were right
// or wrong until after the chosen option's teaching/reward clip plays out.
// That's handled by the parent PlayStage (which uses pb.wrongAttempt to pop
// the WrongAnswerOverlay after the animation).

import { Brain } from 'lucide-react';
import Actor from '../court/Actor.jsx';

export default function QuizPrompt({ branch, role, roleActor, onChoose }) {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-4 px-4 pointer-events-none">
      <div className="panel bg-court-panel/95 backdrop-blur p-4 w-full max-w-md pointer-events-auto shadow-xl ring-1 ring-court-accent/40">
        <div className="flex items-start gap-2">
          <Brain className="text-court-accent mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-court-accent font-semibold">
              Quiz
            </p>
            {role && (
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                You are{' '}
                <span className="text-court-accent">
                  {roleActor ? `#${roleActor.label || '?'}` : 'this player'}
                </span>
                {role.description ? ` : ${role.description}` : ''}
              </p>
            )}
            <p className="text-sm text-slate-200 mt-1">{branch.prompt}</p>
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
        <p className="text-[11px] text-slate-500 mt-2">
          Pick your read. You'll see what happens.
        </p>
      </div>
    </div>
  );
}
