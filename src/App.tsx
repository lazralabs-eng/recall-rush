import { Routes, Route, Navigate, Link } from "react-router-dom";
import Play from "./pages/Play";
import Results from "./pages/Results";
import { VERSION } from "./version";

function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Recall Rush</h1>
      <p className="mt-2 opacity-80">Daily trivia sprint. One play per day.</p>

      <div className="mt-6">
        <Link
          className="block w-full px-6 py-3 rounded bg-black text-white text-center font-semibold hover:bg-gray-800 transition"
          to="/play/nfl-playoffs"
        >
          Play Today's Challenge
        </Link>
        <p className="mt-2 text-sm opacity-60 text-center">
          NFL Playoffs • Sprint Mode • New deck every UTC day
        </p>
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
