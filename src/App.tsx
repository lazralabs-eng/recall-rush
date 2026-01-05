import { Routes, Route, Navigate, Link } from "react-router-dom";
import Play from "./pages/Play";
import Results from "./pages/Results";
import { VERSION } from "./version";

function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Recall Rush</h1>
      <p className="mt-2 opacity-80">Timed recall. Scoreboards. Share links.</p>

      <div className="mt-6 flex gap-3">
        <Link
          className="px-4 py-2 rounded bg-black text-white"
          to="/play/nfl-playoffs?mode=sprint"
        >
          NFL Playoffs Sprint
        </Link>
        <Link className="px-4 py-2 rounded border" to="/play/nfl-playoffs?mode=sudden">
          NFL Sudden Death
        </Link>
      </div>

      <div className="mt-4 text-sm opacity-60">
        <Link to="/play/demo?mode=sprint" className="underline">
          Try demo deck
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t text-xs text-center opacity-50">
        <div>© {currentYear} Lazra Labs LLC. All rights reserved.</div>
        <div className="mt-1">v{VERSION}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:deckId" element={<Play />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
