import { Routes, Route, Navigate, Link } from "react-router-dom";
import Play from "./pages/Play";
import Results from "./pages/Results";

function Home() {
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
