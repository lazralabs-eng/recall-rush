import { Routes, Route, Navigate } from "react-router-dom";

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Recall Rush</h1>
      <p className="mt-2 opacity-80">Timed recall. Scoreboards. Share links.</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
