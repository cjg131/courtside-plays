// PlayStage : pure "render and play a Play" component used by both
// PlayViewer (localStorage / sample plays) and SharedViewer (base64 URL).
//
// Two modes:
//   - Teach (default): full animated playthrough of every frame, including
//     the ball moves and the defensive rotations. Watch and learn.
//   - Quiz: playback pauses at every `quizStop: true` frame. The kid drags
//     all 5 defenders into the correct rotation, then hits Submit. Correct
//     advances the ball to the next position. Wrong shows ghost markers of
//     the correct spots + the coachNote, then lets them try again.

import { useRef, useState } from 'react';
import { BookOpen, Brain } from 'lucide-react';
import Court from '../court/Court.jsx';
import Actor from '../court/Actor.jsx';
import Ball from '../court/Ball.jsx';
import Arrow from '../court/Arrow.jsx';
import { ACTOR_TYPES } from '../court/constants.js';
import { usePlayback } from './usePlayback.js';
import { useQuizDragger } from './useQuizDragger.js';
import Controls from './Controls.jsx';
import BranchPrompt from './BranchPrompt.jsx';
import QuizPrompt from './QuizPrompt.jsx';
import WrongAnswerOverlay from './WrongAnswerOverlay.jsx';
import QuizDefenderLayer from './QuizDefenderLayer.jsx';
import QuizSubmitBar from './QuizSubmitBar.jsx';
import Annotations, { getFloatingAnnotations } from './Annotations.jsx';

const MODES = { TEACH: 'teach', QUIZ: 'quiz' };

// Does this play have any quiz stops? If not, we hide the mode toggle.
function playHasQuizStops(play) {
  return !!(play?.frames || []).some(f => f?.quizStop);
}

export default function PlayStage({ play, header = null }) {
  const hasQuiz = playHasQuizStops(play);
  const [mode, setMode] = useState(hasQuiz ? MODES.TEACH : MODES.TEACH);

  const pb = usePlayback(play, {
    autoplay: false,
    speed: 1,
    pauseOnQuizStops: mode === MODES.QUIZ,
  });

  const svgRef = useRef(null);

  const inQuizStop = mode === MODES.QUIZ && pb.pendingQuizStop;

  // Quiz drag state (only matters when inQuizStop).
  const quiz = useQuizDragger({
    play,
    currentFrame: inQuizStop ? pb.currentFrame : null,
    seedPositionsByActor: pb.prevPositionsByActor,
    svgRef,
  });

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

  // Highlight target (legacy branch quiz support).
  const pendingQuizRoleActorId =
    pb.pendingBranch?.branch?.isQuiz ? pb.pendingBranch.branch.role?.actorId : null;
  const wrongQuizRoleActorId =
    pb.wrongAttempt?.branch?.isQuiz ? pb.wrongAttempt.branch.role?.actorId : null;
  const highlightActorId = pendingQuizRoleActorId || wrongQuizRoleActorId || null;
  const pendingRoleActor =
    (pendingQuizRoleActorId && play.actors.find(a => a.id === pendingQuizRoleActorId)) || null;

  // Handle correct quiz submission : advance the playback past the quiz stop.
  const onQuizSubmit = () => {
    const { ok } = quiz.handleSubmit();
    if (ok) {
      // Small delay so the green ring shows before we advance.
      setTimeout(() => pb.clearQuizStopAndAdvance(), 600);
    }
  };

  // Reset everything when the user toggles modes.
  // Quiz mode autoplays so the ball swings on its own until it hits a
  // quizStop frame, at which point the drag UI appears. Without this, the
  // kid would flip to Quiz mode and see nothing happen (the playback
  // is paused at the shell, which isn't a quiz stop).
  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    pb.restart();
    if (next === MODES.QUIZ) {
      setTimeout(() => pb.play(), 0);
    }
  };

  // Which actors do we render via the normal playback layer?
  // - Always render offense + the ball.
  // - In quiz-stop mode, SKIP defenders here : the QuizDefenderLayer owns them.
  // - In teach mode (or not at a quiz stop), render defenders normally.
  const playbackActors = play.actors.filter(a => {
    if (a.kind === ACTOR_TYPES.DEFENSE && inQuizStop) return false;
    return true;
  });

  // Teach/Quiz toggle. Rendered as its own row so it shows even when a caller
  // (PlayViewer, SharedViewer, etc.) supplies a custom `header` prop. This used
  // to live inside the default-header fallback, which meant it was silently
  // discarded whenever a custom header was passed : the exact bug CJ hit where
  // the toggle never appeared on the live site.
  const modeToggle = hasQuiz ? (
    <div className="mb-3 flex justify-end">
      <div className="inline-flex rounded-md overflow-hidden ring-1 ring-slate-700">
        <button
          onClick={() => switchMode(MODES.TEACH)}
          className={
            mode === MODES.TEACH
              ? 'px-3 py-1.5 text-xs font-semibold bg-court-accent text-slate-900 flex items-center gap-1.5'
              : 'px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5'
          }
          title="Watch the full animated playthrough"
        >
          <BookOpen size={13} /> Teach
        </button>
        <button
          onClick={() => switchMode(MODES.QUIZ)}
          className={
            mode === MODES.QUIZ
              ? 'px-3 py-1.5 text-xs font-semibold bg-court-accent text-slate-900 flex items-center gap-1.5'
              : 'px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5'
          }
          title="Drag the defenders into position at each read"
        >
          <Brain size={13} /> Quiz
        </button>
      </div>
    </div>
  ) : null;

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
      {modeToggle}

      <div className="panel p-3 relative">
        <div className="w-full max-h-[72vh] aspect-[50/47] flex items-center justify-center">
          <Court
            view={play.court?.view ?? 'half'}
            orientation={play.court?.orientation ?? 'vertical'}
            className="w-full h-full rounded-md"
            svgRef={svgRef}
          >
            {/* Offense + defenders-while-not-in-quiz-stop + any non-defense actors. */}
            {playbackActors.map(actor => {
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
                  highlighted={actor.id === highlightActorId}
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

            {/* Arrows render in teach mode only : they're the "watch and learn"
                layer. In quiz mode, the kid should be solving for positions
                without being spoon-fed the arrows. */}
            {mode === MODES.TEACH && (pb.currentFrame?.arrows ?? []).map(arrow => (
              <Arrow key={arrow.id} arrow={arrow} />
            ))}

            <Annotations frame={pb.currentFrame} positionsByActor={pb.positionsByActor} />

            {/* Quiz-mode defender drag layer. Overrides defender rendering. */}
            {inQuizStop && (
              <QuizDefenderLayer
                play={play}
                dragPositions={quiz.dragPositions}
                targets={quiz.targets}
                result={quiz.result}
                startDrag={quiz.startDrag}
              />
            )}
          </Court>
        </div>

        {/* Legacy branch UI (kept for any existing branch-based plays). */}
        {pb.pendingBranch && !pb.wrongAttempt && (
          pb.pendingBranch.branch.isQuiz ? (
            <QuizPrompt
              branch={pb.pendingBranch.branch}
              role={pb.pendingBranch.branch.role}
              roleActor={pendingRoleActor}
              onChoose={(optId) => pb.chooseBranchOption(pb.pendingBranch.branch.id, optId)}
            />
          ) : (
            <BranchPrompt
              branch={pb.pendingBranch.branch}
              onChoose={(optId) => pb.chooseBranchOption(pb.pendingBranch.branch.id, optId)}
            />
          )
        )}

        {pb.wrongAttempt && (
          <WrongAnswerOverlay
            branch={pb.wrongAttempt.branch}
            option={pb.wrongAttempt.option}
            onRetry={pb.retryBranch}
          />
        )}

        {/* Quiz-stop submit bar. */}
        {inQuizStop && (
          <QuizSubmitBar
            coachNote={pb.currentFrame?.coachNote}
            result={quiz.result}
            onSubmit={onQuizSubmit}
            onReset={quiz.handleReset}
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

      {/* Coach's note floats below in teach mode (the kid isn't being tested). */}
      {mode === MODES.TEACH && getFloatingAnnotations(pb.currentFrame).length > 0 && (
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

      {/* In teach mode, also surface the coachNote (the quiz-target explanation)
          on frames that have one : helpful preview before switching to quiz. */}
      {mode === MODES.TEACH && pb.currentFrame?.coachNote && (
        <div className="panel p-3 mt-3 ring-1 ring-slate-700/60">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Rotation rule
          </p>
          <p className="text-sm text-slate-200 leading-snug">
            {pb.currentFrame.coachNote}
          </p>
        </div>
      )}
    </div>
  );
}
