// PlayEditor: the coach-facing screen for authoring a play.
// Layout:
//   [ Header: name, back, preview, export, save, status ]
//   [ Toolbar ]
//   [ Canvas (center)    |  FrameInspector (right, ~320px) ]
//   [ FrameTimeline ]
//
// Wire-up owns:
//   - loading a play from storage (or creating a new one)
//   - providing the editor state hook to every child component
//   - save / export / preview affordances
//   - a gentle "unsaved changes" warning on navigate-away

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Download, Play as PlayIcon, ArrowLeft, CheckCircle2, AlertTriangle, Share2, Check } from 'lucide-react';

import { useEditor } from './useEditor.js';
import EditorToolbar from './EditorToolbar.jsx';
import EditorCanvas from './EditorCanvas.jsx';
import FrameTimeline from './FrameTimeline.jsx';
import FrameInspector from './FrameInspector.jsx';

import { createPlay, validatePlay, PLAY_TYPES } from '../data/schema.js';
import { getPlay, savePlay, exportPlayJson, encodePlayForUrl } from '../data/storage.js';

export default function PlayEditor() {
  const { playId } = useParams();
  const navigate = useNavigate();

  // Resolve the initial play exactly once per playId. This is intentional:
  // if we re-resolved on every render the editor state would reset mid-edit.
  const initialPlay = useMemo(() => {
    if (!playId || playId === 'new') {
      return createPlay({ name: 'New play', type: PLAY_TYPES.OFFENSE });
    }
    const existing = getPlay(playId);
    if (existing) return existing;
    // Unknown id : treat as a blank new play rather than crashing.
    return createPlay({ name: 'New play', type: PLAY_TYPES.OFFENSE });
  }, [playId]);

  const editor = useEditor(initialPlay);
  const { play, dirty, markClean } = editor;

  const [toast, setToast] = useState(null); // { kind: 'ok'|'err', text: string }
  const [savingError, setSavingError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Ctrl/Cmd+S to save.
  useEffect(() => {
    const handler = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, dirty]);

  // Browser-level unsaved warning.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Auto-dismiss toast after 2.5s.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleSave() {
    try {
      const { ok, errors } = validatePlay(play);
      if (!ok) {
        setSavingError(errors.join('; '));
        setToast({ kind: 'err', text: 'Cannot save: ' + errors.join('; ') });
        return;
      }
      savePlay(play);
      markClean();
      setSavingError(null);
      setToast({ kind: 'ok', text: 'Saved' });
      // If this was /edit/new, push to the persisted id so re-opens work.
      if (!playId || playId === 'new') {
        navigate(`/edit/${play.meta.id}`, { replace: true });
      }
    } catch (e) {
      setSavingError(e?.message ?? 'Save failed');
      setToast({ kind: 'err', text: e?.message ?? 'Save failed' });
    }
  }

  function handleExport() {
    const json = exportPlayJson(play);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(play.meta.name || 'play')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    try {
      const encoded = encodePlayForUrl(play);
      const url = `${window.location.origin}/share/${encoded}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setToast({ kind: 'ok', text: 'Share link copied' });
    } catch (e) {
      const encoded = encodePlayForUrl(play);
      const url = `${window.location.origin}/share/${encoded}`;
      prompt('Copy this link:', url);
    }
  }

  function handlePreview() {
    if (dirty) {
      if (!confirm('You have unsaved changes. Save and preview?')) return;
      handleSave();
    }
    navigate(`/play/${play.meta.id}`);
  }

  function handleBack() {
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-court-bg text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-court-bg/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-3 py-2 flex items-center gap-3">
          <button type="button" onClick={handleBack} className="btn-ghost text-sm" title="Back to library">
            <ArrowLeft size={14} /> Library
          </button>

          <div className="flex-1 min-w-0">
            <input
              value={play.meta.name}
              onChange={(e) => editor.setMeta({ name: e.target.value })}
              placeholder="Untitled play"
              className="w-full bg-transparent text-lg font-semibold text-slate-100 focus:outline-none focus:border-b focus:border-court-accent"
            />
            <p className="text-[11px] text-slate-500">
              {play.frames.length} frame{play.frames.length === 1 ? '' : 's'}
              {play.branches.length > 0 ? ` · ${play.branches.length} branch${play.branches.length === 1 ? '' : 'es'}` : ''}
              {dirty ? ' · unsaved' : ' · saved'}
            </p>
          </div>

          <button type="button" onClick={handleExport} className="btn-ghost text-sm" title="Download as JSON">
            <Download size={14} /> Export
          </button>
          <button type="button" onClick={handleShare} className="btn-ghost text-sm" title="Copy a read-only share link">
            {copied ? <><Check size={14} /> Copied</> : <><Share2 size={14} /> Share</>}
          </button>
          <button type="button" onClick={handlePreview} className="btn-ghost text-sm" title="Open the viewer">
            <PlayIcon size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${
              dirty ? 'bg-court-accent text-slate-900 hover:brightness-110' : 'bg-slate-700 text-slate-300'
            }`}
            title="Save to this browser"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-[1600px] mx-auto px-3 py-3 space-y-3">
        <EditorToolbar editor={editor} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3">
          <div className="panel p-2">
            <EditorCanvas editor={editor} />
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
            <FrameInspector editor={editor} />
          </div>
        </div>

        <FrameTimeline editor={editor} />

        {savingError && (
          <div className="panel p-2 border-red-900/60 text-xs text-red-300">
            <AlertTriangle size={12} className="inline mr-1" />
            Save error: {savingError}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-40 px-3 py-2 rounded-md shadow-lg text-sm ${
            toast.kind === 'ok' ? 'bg-emerald-900/90 text-emerald-100 border border-emerald-700'
                                : 'bg-red-900/90 text-red-100 border border-red-700'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={14} className="inline mr-1" /> : <AlertTriangle size={14} className="inline mr-1" />}
          {toast.text}
        </div>
      )}

      {/* Fallback link for non-JS contexts / debugging */}
      <noscript><Link to="/">Library</Link></noscript>
    </div>
  );
}

function slugify(s) {
  return (s || 'play')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'play';
}
