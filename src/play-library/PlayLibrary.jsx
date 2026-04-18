// PlayLibrary: home page. Lists sample + saved plays, groups them by type,
// supports search, filter, duplicate-to-library, import/export, delete.

import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Play, MoreVertical, Copy, Download, Upload, Trash2, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { getSamplePlays } from '../data/samplePlays.js';
import { listPlays, savePlay, deletePlay, exportPlayJson, importPlayJson } from '../data/storage.js';
import { PLAY_TYPES } from '../data/schema.js';

// Human-readable type labels + filter order.
const TYPE_LABELS = {
  [PLAY_TYPES.PRESS_BREAK]: 'Press Break',
  [PLAY_TYPES.DEFENSE]: 'Defense',
  [PLAY_TYPES.PRESS]: 'Press',
  [PLAY_TYPES.OFFENSE]: 'Offense',
  [PLAY_TYPES.SOB]: 'SOB',
  [PLAY_TYPES.BLOB]: 'BLOB',
  [PLAY_TYPES.DRILL]: 'Drill',
  [PLAY_TYPES.OTHER]: 'Other',
};
const TYPE_ORDER = [
  PLAY_TYPES.PRESS_BREAK,
  PLAY_TYPES.PRESS,
  PLAY_TYPES.DEFENSE,
  PLAY_TYPES.OFFENSE,
  PLAY_TYPES.SOB,
  PLAY_TYPES.BLOB,
  PLAY_TYPES.DRILL,
  PLAY_TYPES.OTHER,
];

export default function PlayLibrary() {
  const samples = useMemo(() => getSamplePlays(), []);
  // `version` forces re-reads of localStorage after any mutation.
  const [version, setVersion] = useState(0);
  const saved = useMemo(() => {
    try { return listPlays(); } catch { return []; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = (list) => list.filter(p => {
    const matchesType = typeFilter === 'all' || p.meta.type === typeFilter;
    if (!matchesType) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      (p.meta.name ?? '').toLowerCase().includes(q) ||
      (p.meta.tags ?? []).some(t => (t ?? '').toLowerCase().includes(q)) ||
      (TYPE_LABELS[p.meta.type] ?? '').toLowerCase().includes(q)
    );
  });

  const filteredSamples = filtered(samples);
  const filteredSaved = filtered(saved);
  const savedByType = groupByType(filteredSaved);
  const bump = () => setVersion(v => v + 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Header onChange={bump} />

      <div className="flex flex-col md:flex-row gap-2 md:items-center mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search plays"
            className="w-full bg-court-panel border border-slate-700 rounded-md pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-court-accent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TypeChip label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          {TYPE_ORDER.map(t => (
            <TypeChip
              key={t}
              label={TYPE_LABELS[t]}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            />
          ))}
        </div>
      </div>

      {filteredSamples.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Demo</h2>
          <div className="grid gap-2">
            {filteredSamples.map(p => (
              <PlayRow key={p.meta.id} play={p} isSample onChange={bump} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Your plays</h2>

        {filteredSaved.length === 0 ? (
          <EmptyState hasQuery={!!query || typeFilter !== 'all'} />
        ) : (
          TYPE_ORDER.filter(t => savedByType[t]?.length).map(t => (
            <div key={t} className="mb-5">
              <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">{TYPE_LABELS[t]}</h3>
              <div className="grid gap-2">
                {savedByType[t].map(p => (
                  <PlayRow key={p.meta.id} play={p} onChange={bump} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Header({ onChange }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importPlayJson(text, { newId: true });
      imported.meta.name = imported.meta.name ? imported.meta.name + ' (imported)' : 'Imported play';
      savePlay(imported);
      setMsg({ kind: 'ok', text: `Imported "${imported.meta.name}"` });
      onChange();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Import failed' });
    }
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Courtside Plays</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pick a play to watch, or start a new one.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary"
            title="Import a play from JSON"
          >
            <Upload size={14} /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImport}
          />
          <Link to="/edit/new" className="btn-primary">
            <PlusCircle size={16} /> New play
          </Link>
        </div>
      </div>
      {msg && (
        <div
          className={`mb-3 text-xs px-3 py-2 rounded-md border ${
            msg.kind === 'ok'
              ? 'bg-emerald-900/40 border-emerald-700 text-emerald-200'
              : 'bg-red-900/40 border-red-700 text-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}
    </>
  );
}

function TypeChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-court-accent/20 border-court-accent text-court-accent'
          : 'bg-court-panel border-slate-700 text-slate-300 hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ hasQuery }) {
  if (hasQuery) {
    return (
      <div className="panel p-6 text-center text-slate-400 text-sm">
        No matches. Try a different search or filter.
      </div>
    );
  }
  return (
    <div className="panel p-6 text-center">
      <p className="text-slate-300 font-medium">No saved plays yet.</p>
      <p className="text-xs text-slate-500 mt-1">
        Start fresh with <span className="text-court-accent">New play</span>, or duplicate a demo play to tweak.
      </p>
    </div>
  );
}

function PlayRow({ play, isSample, onChange }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const typeLabel = TYPE_LABELS[play.meta.type] ?? play.meta.type;

  const onDuplicate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    const copy = JSON.parse(JSON.stringify(play));
    copy.meta.id = crypto.randomUUID();
    copy.meta.name = `${play.meta.name} (copy)`;
    copy.meta.createdAt = Date.now();
    copy.meta.updatedAt = Date.now();
    try {
      savePlay(copy);
      onChange?.();
      navigate(`/edit/${copy.meta.id}`);
    } catch (err) {
      alert(err.message || 'Could not duplicate');
    }
  };

  const onExport = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    try {
      const json = exportPlayJson(play);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(play.meta.name)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Export failed');
    }
  };

  const onDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (!confirm(`Delete "${play.meta.name}"? This can't be undone.`)) return;
    try {
      deletePlay(play.meta.id);
      onChange?.();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="relative">
      <Link
        to={`/play/${play.meta.id}`}
        className="panel p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium text-slate-100 truncate">{play.meta.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="pill mr-2">{typeLabel}</span>
            {play.frames.length} {play.frames.length === 1 ? 'frame' : 'frames'}
            {' · '}
            {play.branches.length} {play.branches.length === 1 ? 'read' : 'reads'}
            {play.meta.tags?.length ? ` · ${play.meta.tags.join(', ')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <Play size={18} className="text-court-accent" />
          <button
            type="button"
            aria-label="More actions"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(o => !o);
            }}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </Link>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <div className="absolute right-2 top-14 z-20 bg-court-panel border border-slate-700 rounded-md shadow-lg py-1 w-44 text-sm">
            <MenuItem icon={Copy} label={isSample ? 'Duplicate to library' : 'Duplicate'} onClick={onDuplicate} />
            <MenuItem icon={Download} label="Export JSON" onClick={onExport} />
            {!isSample && (
              <MenuItem icon={Trash2} label="Delete" onClick={onDelete} danger />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-700 ${
        danger ? 'text-red-300 hover:text-red-200' : 'text-slate-200'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function groupByType(list) {
  const out = {};
  for (const p of list) {
    const t = p.meta.type ?? PLAY_TYPES.OTHER;
    if (!out[t]) out[t] = [];
    out[t].push(p);
  }
  return out;
}

function slugify(str) {
  return (str || 'play')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'play';
}
