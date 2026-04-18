// PlayStage: the pure "render and play a Play" component used by both
// PlayViewer (localStorage / sample plays) and SharedViewer (base64 URL).
//
// Takes a play object directly : no routing, no fetching. Keeps the viewer
// layer single-sourced so any improvements to playback UI land everywhere.

import Court from '../court/Court.jsx';
import Actor from '../court/Actor.jsx';
import Ball from '../court/Ball.jsx';
import Arrow from '../court/Arrow.jsx';
import { usePlayback } from './usePlayback.js';
import Controls from './Controls.jsx';
import BranchPrompt from './BranchPrompt.jsx';
import Annotations, { getFloatingAnnotations } from './Annotations.jsx';

export default function PlayStage({ play, header = null }) {
  const pb = usePlayback(play, { autoplay: false, speed: 1 });

  if (!play) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="panel p-6">Play not found.</div>
      </div>
    );
  }

  const transition = {
    type: 'tween',
    duration: Math.max(0.2, (pb.currentFrame?.durationMs ?? 1000) / 1000 / pb.speed),
    ease: 'easeInOut',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {header ?? (
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <p className="text-xs text-slate-400">{play.meta.type}</p>
            <h1 className="text-lg font-semibold text-slate-100">{play.meta.name}</h1>
          </div>
        </div>
      )}

      <div className="panel p-3 relative">
        <div className="w-full max-h-[72vh] aspect-[50/47] flex items-center justify-center">
          <Court
            view={play.court?.view ?? 'half'}
            orientation={play.court?.orientation ?? 'vertical'}
            className="w-full h-full rounded-md"
          >
            {play.actors.map(actor => {
              const pos = pb.positionsByActor.get(actor.id);
              if (!pos) return null;
              return (
                <Actor
                  key={actor.id}
                  actor={actor}
                  x={pos.x}
                  y={pos.y}
                  layoutId={`actor-${actor.id}`}
                  hasBall={pb.currentFrame?.ballHolder === actor.id}
                  transition={transition}
                />
              );
            })}
            {pb.ballPosition && (
              <Ball
                x={pb.ballPosition.x}
                y={pb.ballPosition.y}
                dribble={!!pb.currentFrame?.ballHolder}
                transition={transition}
              />
            )}
            {(pb.currentFrame?.arrows ?? []).map(arrow => (
              <Arrow key={arrow.id} arrow={arrow} />
            ))}
            <Annotations frame={pb.currentFrame} positionsByActor={pb.positionsByActor} />
          </Court>
        </div>

        {pb.pendingBranch && (
          <BranchPrompt
            branch={pb.pendingBranch.branch}
            onChoose={(optId) => pb.chooseBranchOption(pb.pendingBranch.branch.id, optId)}
          />
        )}
      </div>

      <Controls pb={pb} />

      {pb.currentFrame?.label && (
        <p className="mt-3 text-sm text-slate-300">
          <span className="pill mr-2">Frame {pb.frameIdx + 1}/{pb.resolved.length}</span>
          {pb.currentFrame.label}
        </p>
      )}

      {getFloatingAnnotations(pb.currentFrame).length > 0 && (
        <div className="panel p-3 mt-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Coach's note</p>
          <ul className="space-y-1">
            {getFloatingAnnotations(pb.currentFrame).map(a => (
              <li key={a.id} className={a.emphasis ? 'text-court-accent' : 'text-slate-200'}>
                {a.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
