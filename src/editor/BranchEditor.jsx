// BranchEditor: full-screen modal for authoring a single branch.
//   - edit prompt
//   - manage options (label, delete, add)
//   - for each option, manage a list of "next frames" (add, duplicate, delete, select)
//   - selected branch-frame: drag actors, toggle ball holder, edit label/duration, coach notes
//
// Arrows on branch frames are intentionally out of scope for v1. The playback
// engine still animates actor movement between branch frames, which is what
// matters most for "read the defense" reps.

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Trash2, Copy, Circle, Sparkles, Brain, Check, AlertTriangle } from 'lucide-react';
import Court from '../court/Court.jsx';
import Actor from '../court/Actor.jsx';
import Ball from '../court/Ball.jsx';
import Annotations from '../viewer/Annotations.jsx';
import { COLORS, ACTOR_TYPES } from '../court/constants.js';

export default function BranchEditor({ editor, branchId, onClose }) {
  const {
    play,
    updateBranch, deleteBranch,
    addBranchOption, updateBranchOption, deleteBranchOption,
    addBranchOptionFrame, updateBranchOptionFrame, deleteBranchOptionFrame, duplicateBranchOptionFrame,
    moveActorInBranchFrame, setBranchFrameBallHolder,
    addAnnotationToBranchFrame, updateBranchFrameAnnotation, deleteBranchFrameAnnotation,
  } = editor;

  const branch = play.branches.find(b => b.id === branchId);
  const baseFrame = branch ? play.frames[branch.atFrameIdx] : null;

  const [selectedOptionId, setSelectedOptionId] = useState(() => branch?.options[0]?.id ?? null);
  const [selectedFrameId, setSelectedFrameId] = useState(() => branch?.options[0]?.nextFrames[0]?.id ?? null);

  // Keep selected option/frame valid as the branch shape changes.
  useEffect(() => {
    if (!branch) return;
    const opt = branch.options.find(o => o.id === selectedOptionId) ?? branch.options[0];
    if (opt?.id !== selectedOptionId) setSelectedOptionId(opt?.id ?? null);
    const frm = opt?.nextFrames.find(f => f.id === selectedFrameId) ?? opt?.nextFrames[0];
    if (frm?.id !== selectedFrameId) setSelectedFrameId(frm?.id ?? null);
  }, [branch, selectedOptionId, selectedFrameId]);

  if (!branch) {
    // Branch got deleted out from under us : bail cleanly.
    return null;
  }

  const selectedOption = branch.options.find(o => o.id === selectedOptionId) ?? null;
  const selectedFrame = selectedOption?.nextFrames.find(f => f.id === selectedFrameId) ?? null;
  const editingFrame = selectedFrame ?? baseFrame;
  const isEditingBase = !selectedFrame;

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-stretch justify-stretch">
      <div className="m-4 md:m-8 flex-1 panel p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 p-3">
          <span className="pill">Branch @ Frame {branch.atFrameIdx + 1}</span>
          <input
            value={branch.prompt}
            onChange={(e) => updateBranch(branch.id, { prompt: e.target.value })}
            placeholder="Prompt for the kids"
            className="flex-1 bg-transparent border-b border-slate-700 focus:border-court-accent focus:outline-none text-slate-100 text-base py-1"
          />
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this entire branch?')) {
                deleteBranch(branch.id);
                onClose();
              }
            }}
            className="btn-ghost text-red-300 hover:text-red-200 text-xs"
            title="Delete branch"
          >
            <Trash2 size={14} /> Delete branch
          </button>
          <button type="button" onClick={onClose} className="btn-ghost" title="Close">
            <X size={16} />
          </button>
        </div>

        <QuizSettings
          branch={branch}
          actors={play.actors}
          onPatch={(patch) => updateBranch(branch.id, patch)}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] overflow-hidden">
          {/* Options sidebar */}
          <aside className="border-r border-slate-800 overflow-y-auto p-3 space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500">Options</h3>
            {branch.options.map(opt => {
              const active = opt.id === selectedOptionId;
              return (
                <div
                  key={opt.id}
                  className={`rounded border p-2 cursor-pointer ${active ? 'border-court-accent bg-court-accent/10' : 'border-slate-800 bg-court-panel hover:border-slate-600'}`}
                  onClick={() => setSelectedOptionId(opt.id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={opt.label}
                      onChange={(e) => updateBranchOption(branch.id, opt.id, { label: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Option label"
                      className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (branch.options.length <= 1) {
                          alert('A branch needs at least one option.');
                          return;
                        }
                        if (confirm('Delete this option?')) deleteBranchOption(branch.id, opt.id);
                      }}
                      aria-label="Delete option"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{opt.nextFrames.length} frame{opt.nextFrames.length === 1 ? '' : 's'}</p>
                  {branch.isQuiz && active && (
                    <OptionQuizFields
                      option={opt}
                      onPatch={(patch) => updateBranchOption(branch.id, opt.id, patch)}
                    />
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="btn-ghost text-xs w-full justify-center"
              onClick={() => {
                const id = addBranchOption(branch.id);
                setSelectedOptionId(id);
                setSelectedFrameId(null);
              }}
            >
              <Plus size={12} /> Add option
            </button>
          </aside>

          {/* Center: frames strip + court */}
          <main className="flex flex-col overflow-hidden">
            <FramesStrip
              baseFrame={baseFrame}
              option={selectedOption}
              selectedFrameId={selectedFrameId}
              setSelectedFrameId={setSelectedFrameId}
              onAddFrame={() => {
                if (!selectedOption) return;
                const id = addBranchOptionFrame(branch.id, selectedOption.id, { label: `Beat ${selectedOption.nextFrames.length + 1}` });
                if (id) setSelectedFrameId(id);
              }}
              onDuplicate={(fid) => {
                if (!selectedOption) return;
                duplicateBranchOptionFrame(branch.id, selectedOption.id, fid);
              }}
              onDelete={(fid) => {
                if (!selectedOption) return;
                if (confirm('Delete this frame from the option?')) deleteBranchOptionFrame(branch.id, selectedOption.id, fid);
              }}
            />

            <div className="flex-1 p-3 overflow-auto">
              {selectedOption && selectedFrame && (
                <BranchFrameCanvas
                  play={play}
                  frame={selectedFrame}
                  onDragActor={(actorId, x, y) => moveActorInBranchFrame(branch.id, selectedOption.id, selectedFrame.id, actorId, x, y)}
                  onSetBallHolder={(actorId) => setBranchFrameBallHolder(branch.id, selectedOption.id, selectedFrame.id, actorId)}
                />
              )}
              {isEditingBase && (
                <div className="text-sm text-slate-400 panel p-4">
                  <p className="mb-2">
                    This option has no frames yet. Click <span className="pill">+ Frame</span> above to add the first beat.
                  </p>
                  <p className="text-xs text-slate-500">
                    Actors will be seeded from Frame {branch.atFrameIdx + 1}. Drag them to show where they should move.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Right: frame inspector */}
          <aside className="border-l border-slate-800 overflow-y-auto p-3 space-y-4">
            {selectedOption && selectedFrame && (
              <FrameInspectorPanel
                key={selectedFrame.id}
                play={play}
                frame={selectedFrame}
                onPatch={(patch) => updateBranchOptionFrame(branch.id, selectedOption.id, selectedFrame.id, patch)}
                onAddNote={(note) => addAnnotationToBranchFrame(branch.id, selectedOption.id, selectedFrame.id, note)}
                onUpdateNote={(anId, patch) => updateBranchFrameAnnotation(branch.id, selectedOption.id, selectedFrame.id, anId, patch)}
                onDeleteNote={(anId) => deleteBranchFrameAnnotation(branch.id, selectedOption.id, selectedFrame.id, anId)}
              />
            )}
            {(!selectedOption || !selectedFrame) && (
              <div className="text-xs text-slate-500 panel p-3">
                Select or add a frame to edit its details.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FramesStrip({ baseFrame, option, selectedFrameId, setSelectedFrameId, onAddFrame, onDuplicate, onDelete }) {
  return (
    <div className="border-b border-slate-800 p-3 flex items-center gap-2 overflow-x-auto">
      {/* Base frame chip : read-only, shows the starting state */}
      {baseFrame && (
        <div
          className="shrink-0 rounded border border-slate-700 bg-court-bg/60 text-slate-400 px-3 py-2 min-w-[8rem]"
          title="Base frame (read-only here)"
        >
          <div className="text-[10px] uppercase tracking-wide">Base</div>
          <div className="text-xs truncate max-w-[8rem]">{baseFrame.label || 'Starting position'}</div>
        </div>
      )}

      {(option?.nextFrames ?? []).map((f, i) => {
        const active = f.id === selectedFrameId;
        return (
          <div
            key={f.id}
            onClick={() => setSelectedFrameId(f.id)}
            className={`shrink-0 group relative px-3 py-2 rounded-md border cursor-pointer min-w-[8rem] ${
              active
                ? 'border-court-accent bg-court-accent/10 text-slate-100'
                : 'border-slate-700 bg-court-panel text-slate-300 hover:border-slate-500'
            }`}
            title={`Frame ${i + 1}${f.label ? `: ${f.label}` : ''}`}
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Beat {i + 1}</div>
            <div className="text-xs truncate max-w-[8rem]">{f.label || 'Untitled'}</div>
            <div className="text-[10px] text-slate-500">{f.durationMs} ms</div>

            <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
              <IconBtn title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(f.id); }}>
                <Copy size={11} />
              </IconBtn>
              <IconBtn danger title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(f.id); }}>
                <Trash2 size={11} />
              </IconBtn>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAddFrame}
        disabled={!option}
        className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md border border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add frame to this option"
      >
        <Plus size={14} /> Frame
      </button>
    </div>
  );
}

function IconBtn({ children, title, onClick, danger }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-5 h-5 inline-flex items-center justify-center rounded border text-[10px] bg-court-bg ${
        danger ? 'border-red-700 text-red-300 hover:bg-red-900/30' : 'border-slate-700 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// BranchFrameCanvas : simplified drag-only mini editor for a branch frame.
// Arrows on branch frames are out of scope in v1, so this just renders actors
// with drag-to-move behavior and shows the ball.

function BranchFrameCanvas({ play, frame, onDragActor, onSetBallHolder }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const positionsById = useMemo(
    () => new Map((frame?.positions ?? []).map(p => [p.actorId, p])),
    [frame],
  );

  const toCourt = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const { x, y } = toCourt(e.clientX, e.clientY);
    onDragActor(dragging.actorId, clamp(x, 0.5, 49.5), clamp(y, 0.5, 46.5));
  };

  const onPointerUp = () => setDragging(null);

  return (
    <div
      className="relative w-full"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Court
        svgRef={svgRef}
        view={play.court?.view ?? 'half'}
        orientation={play.court?.orientation ?? 'vertical'}
        className="w-full h-full rounded-md select-none touch-none"
      >
        {play.actors.map(actor => {
          const pos = positionsById.get(actor.id);
          if (!pos) return null;
          const canHoldBall = actor.kind !== ACTOR_TYPES.DEFENSE;
          return (
            <g
              key={actor.id}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture?.(e.pointerId);
                setDragging({ actorId: actor.id });
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (canHoldBall) onSetBallHolder(frame.ballHolder === actor.id ? null : actor.id);
              }}
            >
              <Actor
                actor={actor}
                x={pos.x}
                y={pos.y}
                hasBall={frame.ballHolder === actor.id}
                transition={{ type: 'tween', duration: 0.1 }}
              />
            </g>
          );
        })}

        {!frame.ballHolder && frame.ballPosition && (
          <Ball x={frame.ballPosition.x} y={frame.ballPosition.y} dribble={false} />
        )}
        {frame.ballHolder && (() => {
          const pos = positionsById.get(frame.ballHolder);
          return pos ? <Ball x={pos.x + 1.6} y={pos.y - 0.2} dribble /> : null;
        })()}

        <Annotations frame={frame} positionsByActor={positionsById} />
      </Court>
      <p className="text-[11px] text-slate-500 mt-2">
        Drag a player to set their position on this beat. Double-click an offensive player to toggle the ball.
      </p>
    </div>
  );
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------------------------------------------------------------------------

function FrameInspectorPanel({ play, frame, onPatch, onAddNote, onUpdateNote, onDeleteNote }) {
  return (
    <>
      <div className="panel p-3 space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-500">Beat</h3>
        <LabeledInput
          label="Label"
          value={frame.label ?? ''}
          onChange={(v) => onPatch({ label: v })}
          placeholder="e.g. 1 drives middle"
        />
        <LabeledNumber
          label="Duration (ms)"
          value={frame.durationMs ?? 1200}
          min={100}
          max={8000}
          step={100}
          onChange={(v) => onPatch({ durationMs: v })}
        />
      </div>

      <div className="panel p-3 space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-500">
          Coach notes ({frame.annotations?.length ?? 0})
        </h3>
        <div className="space-y-2">
          {(frame.annotations ?? []).map(an => (
            <AnnotationRow
              key={an.id}
              annotation={an}
              actors={play.actors}
              onChange={(patch) => onUpdateNote(an.id, patch)}
              onDelete={() => onDeleteNote(an.id)}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={() => {
            const text = prompt('Coach note text:');
            if (text?.trim()) onAddNote({ text: text.trim() });
          }}
        >
          <Plus size={12} /> Add note
        </button>
      </div>

      <div className="panel p-3 space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-500">Ball</h3>
        <div className="space-y-1 text-xs">
          <button
            type="button"
            className={`w-full text-left px-2 py-1 rounded border ${frame.ballHolder == null ? 'border-court-accent bg-court-accent/10 text-court-accent' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
            onClick={() => onPatch({ ballHolder: null })}
          >
            <Circle size={11} className="inline mr-1" /> No holder
          </button>
          {play.actors.filter(a => a.kind !== ACTOR_TYPES.DEFENSE).map(a => {
            const on = frame.ballHolder === a.id;
            return (
              <button
                key={a.id}
                type="button"
                className={`w-full text-left px-2 py-1 rounded border ${on ? 'border-court-accent bg-court-accent/10 text-court-accent' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
                onClick={() => onPatch({ ballHolder: a.id, ballPosition: null })}
              >
                <Circle size={11} className="inline mr-1" /> {a.label || a.kind}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AnnotationRow({ annotation, actors, onChange, onDelete }) {
  return (
    <div className="border border-slate-800 rounded p-2 bg-court-panel">
      <div className="flex items-start gap-2">
        <input
          value={annotation.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="flex-1 bg-transparent border-b border-slate-700 text-slate-100 focus:outline-none focus:border-court-accent text-sm py-1"
        />
        <button
          type="button"
          onClick={onDelete}
          className="text-red-400 hover:text-red-200 mt-1"
          aria-label="Delete note"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs">
        <label className="flex items-center gap-1 text-slate-400">
          <input
            type="checkbox"
            checked={!!annotation.emphasis}
            onChange={(e) => onChange({ emphasis: e.target.checked })}
          />
          <Sparkles size={12} /> Emphasize
        </label>
        <select
          value={annotation.pinTo?.actorId ?? (annotation.pinTo?.x != null ? '__xy' : '__none')}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__none') onChange({ pinTo: null });
            else if (v === '__xy') onChange({ pinTo: { x: 25, y: 25 } });
            else onChange({ pinTo: { actorId: v } });
          }}
          className="bg-court-bg border border-slate-700 rounded px-1 py-0.5 text-slate-200 text-xs"
        >
          <option value="__none">No pin</option>
          <option value="__xy">Pin to position</option>
          {actors.map(a => (
            <option key={a.id} value={a.id}>Pin to {a.label || a.kind}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-400">{label}</span>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-court-bg border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-court-accent"
      />
    </label>
  );
}

function LabeledNumber({ label, value, onChange, min, max, step }) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-400">{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min} max={max} step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="w-full bg-court-bg border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-court-accent"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// QuizSettings : branch-level quiz toggle, role actor, role description.
// Renders inline under the header so authors can flip a branch into a quiz
// without digging into a submenu.

function QuizSettings({ branch, actors, onPatch }) {
  const isQuiz = !!branch.isQuiz;
  const role = branch.role ?? null;

  const toggleQuiz = (on) => {
    if (on) {
      onPatch({
        isQuiz: true,
        role: role ?? { actorId: null, description: '' },
      });
    } else {
      onPatch({ isQuiz: false, role: null });
    }
  };

  const setRole = (patch) => {
    onPatch({ role: { actorId: role?.actorId ?? null, description: role?.description ?? '', ...patch } });
  };

  const selectableActors = actors.filter(a => a.kind === 'offense' || a.kind === 'defense' || a.kind === 'coach');

  return (
    <div className="border-b border-slate-800 px-3 py-2 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isQuiz}
          onChange={(e) => toggleQuiz(e.target.checked)}
        />
        <Brain size={13} className={isQuiz ? 'text-court-accent' : 'text-slate-500'} />
        Quiz mode
      </label>
      {isQuiz && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-slate-500">You are:</span>
            <select
              value={role?.actorId ?? ''}
              onChange={(e) => setRole({ actorId: e.target.value || null })}
              className="bg-court-bg border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-court-accent"
            >
              <option value="">(no highlight)</option>
              {selectableActors.map(a => (
                <option key={a.id} value={a.id}>{a.label || a.kind}</option>
              ))}
            </select>
          </label>
          <input
            type="text"
            placeholder="Describe the role (e.g. top defender ball side)"
            value={role?.description ?? ''}
            onChange={(e) => setRole({ description: e.target.value })}
            className="flex-1 min-w-[14rem] bg-court-bg border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-court-accent"
          />
        </>
      )}
      {isQuiz && (
        <span className="text-[10px] text-slate-500">
          Mark one option correct. Wrong options should include a "why" message.
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OptionQuizFields : shown on the ACTIVE option card when the branch is a
// quiz. Lets the author flag this option as the correct answer and write
// the teaching message shown if a kid picks it wrong.

function OptionQuizFields({ option, onPatch }) {
  const correct = !!option.isCorrect;
  return (
    <div
      className="mt-2 space-y-1.5 border-t border-slate-800 pt-2"
      onClick={(e) => e.stopPropagation()}
    >
      <label className={`flex items-center gap-1.5 text-[11px] cursor-pointer ${correct ? 'text-emerald-300' : 'text-slate-300'}`}>
        <input
          type="checkbox"
          checked={correct}
          onChange={(e) => onPatch({ isCorrect: e.target.checked })}
        />
        {correct ? <Check size={12} /> : <AlertTriangle size={12} />}
        {correct ? 'Correct answer' : 'Wrong answer'}
      </label>
      {!correct && (
        <textarea
          value={option.wrongReason ?? ''}
          onChange={(e) => onPatch({ wrongReason: e.target.value })}
          placeholder="Why this is wrong (the kid sees this after the clip plays)"
          rows={2}
          className="w-full bg-court-bg border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-court-accent resize-none"
        />
      )}
    </div>
  );
}

// COLORS import is kept for parity with EditorCanvas even though BranchEditor
// currently doesn't draw a selection ring. Leaving it in place keeps future
// additions (selected-actor highlight) one-line cheap.
void COLORS;
