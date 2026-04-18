// FrameInspector: right-side panel with controls for the selected frame.
//   - frame label and duration
//   - annotations list (add, edit, delete, emphasis toggle, pin-to-actor dropdown)
//   - arrows list (shows type + delete)
//   - branches attached to this frame (summary with open button that navigates to BranchEditor)
//   - play-level settings (name, type, court view, orientation)

import { useState } from 'react';
import { Trash2, Plus, MapPin, User, Sparkles, X } from 'lucide-react';
import { PLAY_TYPES, COURT_VIEWS, COURT_ORIENTATIONS } from '../data/schema.js';
import { ARROW_TYPES } from '../court/constants.js';
import BranchEditor from './BranchEditor.jsx';

export default function FrameInspector({ editor }) {
  const { play, setMeta, setCourtConfig, currentFrame, frameIdx, updateFrame,
    addAnnotation, updateAnnotation, deleteAnnotation, deleteArrow,
    addBranch, updateBranch, deleteBranch } = editor;

  const [openBranchId, setOpenBranchId] = useState(null);
  const branchesHere = play.branches.filter(b => b.atFrameIdx === frameIdx);

  return (
    <div className="space-y-4 text-sm">
      <Section title="Play">
        <LabeledInput label="Name" value={play.meta.name} onChange={(v) => setMeta({ name: v })} />
        <LabeledSelect
          label="Type"
          value={play.meta.type}
          onChange={(v) => setMeta({ type: v })}
          options={Object.entries(TYPE_LABELS)}
        />
        <div className="grid grid-cols-2 gap-2">
          <LabeledSelect
            label="View"
            value={play.court?.view ?? 'half'}
            onChange={(v) => setCourtConfig({ view: v })}
            options={[[COURT_VIEWS.HALF, 'Half'], [COURT_VIEWS.FULL, 'Full']]}
          />
          <LabeledSelect
            label="Orientation"
            value={play.court?.orientation ?? 'vertical'}
            onChange={(v) => setCourtConfig({ orientation: v })}
            options={[[COURT_ORIENTATIONS.VERTICAL, 'Vertical'], [COURT_ORIENTATIONS.HORIZONTAL, 'Horizontal']]}
          />
        </div>
      </Section>

      <Section title={`Frame ${frameIdx + 1}`}>
        <LabeledInput
          label="Label"
          value={currentFrame?.label ?? ''}
          onChange={(v) => updateFrame(frameIdx, { label: v })}
          placeholder="e.g. 1 drives middle"
        />
        <LabeledNumber
          label="Duration (ms)"
          value={currentFrame?.durationMs ?? 1200}
          min={100}
          max={8000}
          step={100}
          onChange={(v) => updateFrame(frameIdx, { durationMs: v })}
        />
      </Section>

      <Section title={`Coach notes (${currentFrame?.annotations?.length ?? 0})`}>
        <div className="space-y-2">
          {(currentFrame?.annotations ?? []).map(an => (
            <AnnotationRow
              key={an.id}
              annotation={an}
              actors={play.actors}
              onChange={(patch) => updateAnnotation(an.id, patch)}
              onDelete={() => deleteAnnotation(an.id)}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost text-xs mt-2"
          onClick={() => {
            const text = prompt('Coach note text:');
            if (text?.trim()) addAnnotation({ text: text.trim() });
          }}
        >
          <Plus size={12} /> Add note
        </button>
      </Section>

      <Section title={`Arrows (${currentFrame?.arrows?.length ?? 0})`}>
        <div className="space-y-1">
          {(currentFrame?.arrows ?? []).map(ar => (
            <div key={ar.id} className="flex items-center justify-between gap-2 text-xs bg-court-panel border border-slate-800 rounded px-2 py-1">
              <span className="truncate">
                <span className="pill mr-1">{arrowLabel(ar.type)}</span>
                {ar.label ? ar.label : ''}
                {ar.actorId ? ` from ${actorLabel(play, ar.actorId)}` : ''}
                {ar.toActorId ? ` → ${actorLabel(play, ar.toActorId)}` : ''}
              </span>
              <button
                type="button"
                className="text-red-400 hover:text-red-200"
                onClick={() => deleteArrow(ar.id)}
                aria-label="Delete arrow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {(!currentFrame?.arrows || currentFrame.arrows.length === 0) && (
            <p className="text-xs text-slate-500">No arrows yet. Pick an arrow tool and draw on the court.</p>
          )}
        </div>
      </Section>

      <Section title={`Branches on this frame (${branchesHere.length})`}>
        <div className="space-y-2">
          {branchesHere.map(b => (
            <div key={b.id} className="border border-slate-800 rounded p-2 bg-court-panel">
              <div className="flex items-center justify-between gap-2">
                <input
                  value={b.prompt}
                  onChange={(e) => updateBranch(b.id, { prompt: e.target.value })}
                  className="flex-1 bg-transparent text-slate-100 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  className="text-red-400 hover:text-red-200"
                  onClick={() => { if (confirm('Delete this branch?')) deleteBranch(b.id); }}
                  aria-label="Delete branch"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {b.options.length} options · {b.options.reduce((n, o) => n + o.nextFrames.length, 0)} branch frames
              </p>
              <button
                type="button"
                className="btn-secondary text-xs mt-2"
                onClick={() => setOpenBranchId(b.id)}
              >
                Open editor
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => {
              const id = addBranch({ prompt: 'What is the defense doing?' });
              setOpenBranchId(id);
            }}
          >
            <Plus size={12} /> Add branch here
          </button>
        </div>
      </Section>

      {openBranchId && (
        <BranchEditor
          editor={editor}
          branchId={openBranchId}
          onClose={() => setOpenBranchId(null)}
        />
      )}
    </div>
  );
}

function arrowLabel(type) {
  switch (type) {
    case ARROW_TYPES.PASS: return 'Pass';
    case ARROW_TYPES.CUT: return 'Cut';
    case ARROW_TYPES.DRIBBLE: return 'Dribble';
    case ARROW_TYPES.SCREEN: return 'Screen';
    default: return type;
  }
}

function actorLabel(play, actorId) {
  const a = play.actors.find(x => x.id === actorId);
  return a?.label ?? '?';
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

function Section({ title, children }) {
  return (
    <div className="panel p-3">
      <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
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

function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-400">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-court-bg border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-court-accent"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

const TYPE_LABELS = {
  [PLAY_TYPES.PRESS_BREAK]: 'Press Break',
  [PLAY_TYPES.PRESS]: 'Press',
  [PLAY_TYPES.DEFENSE]: 'Defense',
  [PLAY_TYPES.OFFENSE]: 'Offense',
  [PLAY_TYPES.SOB]: 'SOB',
  [PLAY_TYPES.BLOB]: 'BLOB',
  [PLAY_TYPES.DRILL]: 'Drill',
  [PLAY_TYPES.OTHER]: 'Other',
};
