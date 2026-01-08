import { Routes, Route, Navigate, Link } from "react-router-dom";
import Play from "./pages/Play";
import Results from "./pages/Results";
import { VERSION } from "./version";

function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* HERO SECTION */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-3">Daily Recall</h1>
        <h2 className="text-xl opacity-80 mb-4">One deck. One run. Every day.</h2>
        <p className="text-base opacity-70 mb-6 max-w-md mx-auto">
          Test your memory under pressure.<br />
          No signups. No retries. Just recall.
        </p>

        <Link
          className="inline-block px-8 py-4 rounded bg-black text-white text-center font-semibold hover:bg-gray-800 transition text-lg"
          to="/play/nfl-playoffs"
        >
          Play Today's Recall
        </Link>

        <p className="mt-3 text-sm opacity-50">
          New deck unlocks at midnight.
        </p>
      </div>

      {/* HOW IT WORKS SECTION */}
      <div className="mt-12 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">⏱</div>
            <h3 className="font-semibold mb-1">60 seconds</h3>
            <p className="text-sm opacity-70">
              Answer as many as you can before time runs out.
            </p>
          </div>

          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">One attempt</h3>
            <p className="text-sm opacity-70">
              Missed it? Come back tomorrow.
            </p>
          </div>

          <div className="text-center p-4">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">Share your run</h3>
            <p className="text-sm opacity-70">
              Post your result. Compare with friends.
            </p>
          </div>
        </div>
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
