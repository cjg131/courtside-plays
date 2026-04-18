import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Home, PlayCircle, Edit3, Library } from 'lucide-react';

// Page placeholders : real implementations land in Tasks #8, #11, #12, #17.
// Keeping the shell usable so we can wire routes incrementally.
import PlayLibrary from './play-library/PlayLibrary.jsx';
import PlayViewer from './viewer/PlayViewer.jsx';
import PlayEditor from './editor/PlayEditor.jsx';
import SharedViewer from './viewer/SharedViewer.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PlayLibrary />} />
          <Route path="/play/:playId" element={<PlayViewer />} />
          <Route path="/edit/:playId" element={<PlayEditor />} />
          <Route path="/share/:encoded" element={<SharedViewer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-500 py-3 border-t border-court-line">
        Courtside Plays · v0.1 · built for coaches who teach reading the game
      </footer>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 bg-court-bg/90 backdrop-blur border-b border-court-line">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-100">
          <span className="w-7 h-7 rounded-full bg-court-accent text-slate-900 grid place-items-center">
            <PlayCircle size={16} />
          </span>
          <span>Courtside Plays</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link to="/" className="btn-ghost">
            <Library size={16} /> Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
