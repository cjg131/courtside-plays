// EditorToolbar: tool selector + quick actions on the current frame/actor.

import {
  MousePointer2, UserPlus, ShieldPlus, Megaphone,
  Waypoints, Route, MoveRight, Anchor as ScreenIcon,
  StickyNote, Circle, Trash2,
} from 'lucide-react';
import { TOOLS } from './useEditor.js';
import { ACTOR_TYPES } from '../court/constants.js';

export default function EditorToolbar({ editor }) {
  const { tool, setTool, selectedActorId, play, currentFrame, setBallHolder, clearBall, removeActor } = editor;

  const selectedActor = play.actors.find(a => a.id === selectedActorId) ?? null;
  const selectedHasBall = selectedActor && currentFrame?.ballHolder === selectedActor.id;

  return (
    <div className="panel p-2 flex flex-wrap items-center gap-1">
      <Group label="Select">
        <ToolBtn icon={MousePointer2} label="Select / move" active={tool === TOOLS.SELECT} onClick={() => setTool(TOOLS.SELECT)} />
      </Group>

      <Divider />

      <Group label="Add player">
        <ToolBtn icon={UserPlus} label="Add offense" active={tool === TOOLS.ADD_OFFENSE} onClick={() => setTool(TOOLS.ADD_OFFENSE)} color="offense" />
        <ToolBtn icon={ShieldPlus} label="Add defense" active={tool === TOOLS.ADD_DEFENSE} onClick={() => setTool(TOOLS.ADD_DEFENSE)} color="defense" />
        <ToolBtn icon={Megaphone} label="Add coach marker" active={tool === TOOLS.ADD_COACH} onClick={() => setTool(TOOLS.ADD_COACH)} />
      </Group>

      <Divider />

      <Group label="Draw arrow">
        <ToolBtn icon={MoveRight} label="Pass (dashed)" active={tool === TOOLS.ARROW_PASS} onClick={() => setTool(TOOLS.ARROW_PASS)} />
        <ToolBtn icon={Route} label="Cut (solid)" active={tool === TOOLS.ARROW_CUT} onClick={() => setTool(TOOLS.ARROW_CUT)} />
        <ToolBtn icon={Waypoints} label="Dribble (wavy)" active={tool === TOOLS.ARROW_DRIBBLE} onClick={() => setTool(TOOLS.ARROW_DRIBBLE)} />
        <ToolBtn icon={ScreenIcon} label="Screen (T-cap)" active={tool === TOOLS.ARROW_SCREEN} onClick={() => setTool(TOOLS.ARROW_SCREEN)} />
      </Group>

      <Divider />

      <Group label="Notes">
        <ToolBtn icon={StickyNote} label="Add coach note" active={tool === TOOLS.ANNOTATE} onClick={() => setTool(TOOLS.ANNOTATE)} />
      </Group>

      <Divider />

      <Group label="Selected">
        <ToolBtn
          icon={Circle}
          label={selectedHasBall ? 'Take ball away' : 'Give ball'}
          disabled={!selectedActor || selectedActor.kind === ACTOR_TYPES.DEFENSE}
          onClick={() => selectedHasBall ? clearBall() : setBallHolder(selectedActor.id)}
          color={selectedHasBall ? 'accent' : undefined}
        />
        <ToolBtn
          icon={Trash2}
          label="Delete selected"
          disabled={!selectedActor}
          danger
          onClick={() => selectedActor && removeActor(selectedActor.id)}
        />
      </Group>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div className="flex items-center gap-0.5" title={label} aria-label={label}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch bg-slate-700 mx-1" />;
}

function ToolBtn({ icon: Icon, label, active, onClick, disabled, color, danger }) {
  const base = 'inline-flex items-center justify-center w-8 h-8 rounded-md border text-sm transition-colors';
  const state = disabled
    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
    : active
      ? 'border-court-accent bg-court-accent/15 text-court-accent'
      : 'border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-700';
  const tint = danger ? 'hover:text-red-300 hover:border-red-700' :
    color === 'offense' ? 'hover:text-blue-300 hover:border-blue-600' :
    color === 'defense' ? 'hover:text-red-300 hover:border-red-600' :
    color === 'accent' ? 'text-court-accent border-court-accent' :
    '';
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${state} ${tint}`}
    >
      <Icon size={16} />
    </button>
  );
}
