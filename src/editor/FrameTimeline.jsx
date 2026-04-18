// FrameTimeline: horizontal strip of frame chips.
//   - click a chip to select it
//   - drag a chip left/right to reorder
//   - +Frame appends after the current
//   - dup/delete on each chip hover

import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function FrameTimeline({ editor }) {
  const { play, frameIdx, setFrameIdx, addFrame, duplicateFrame, deleteFrame, moveFrame } = editor;
  const [dragFrom, setDragFrom] = useState(null);

  return (
    <div className="panel p-3 flex items-center gap-2 overflow-x-auto">
      <button
        type="button"
        className="btn-ghost shrink-0"
        onClick={() => setFrameIdx(i => Math.max(0, i - 1))}
        disabled={frameIdx === 0}
        title="Previous frame"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2">
        {play.frames.map((frame, i) => {
          const active = i === frameIdx;
          return (
            <div
              key={frame.id}
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom != null && dragFrom !== i) moveFrame(dragFrom, i);
                setDragFrom(null);
              }}
              onClick={() => setFrameIdx(i)}
              className={`shrink-0 group relative px-3 py-2 rounded-md border cursor-pointer min-w-[8rem] ${
                active
                  ? 'border-court-accent bg-court-accent/10 text-slate-100'
                  : 'border-slate-700 bg-court-panel text-slate-300 hover:border-slate-500'
              }`}
              title={`Frame ${i + 1}${frame.label ? `: ${frame.label}` : ''}`}
            >
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Frame {i + 1}</div>
              <div className="text-xs truncate max-w-[8rem]">{frame.label || 'Untitled'}</div>
              <div className="text-[10px] text-slate-500">{frame.durationMs} ms</div>

              <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                <IconBtn title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateFrame(i); }}>
                  <Copy size={11} />
                </IconBtn>
                <IconBtn
                  title="Delete"
                  danger
                  disabled={play.frames.length === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (play.frames.length > 1 && confirm(`Delete frame ${i + 1}?`)) deleteFrame(i);
                  }}
                >
                  <Trash2 size={11} />
                </IconBtn>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => addFrame({ copyFromCurrent: true })}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md border border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400"
          title="Add frame after current"
        >
          <Plus size={14} /> Frame
        </button>
      </div>

      <button
        type="button"
        className="btn-ghost shrink-0 ml-auto"
        onClick={() => setFrameIdx(i => Math.min(play.frames.length - 1, i + 1))}
        disabled={frameIdx >= play.frames.length - 1}
        title="Next frame"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function IconBtn({ children, title, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-5 h-5 inline-flex items-center justify-center rounded border text-[10px] bg-court-bg ${
        disabled
          ? 'border-slate-800 text-slate-600 cursor-not-allowed'
          : danger
            ? 'border-red-700 text-red-300 hover:bg-red-900/30'
            : 'border-slate-700 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
