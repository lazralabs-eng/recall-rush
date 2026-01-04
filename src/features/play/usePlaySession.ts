import { useEffect, useMemo, useRef, useState } from "react";
import {
  configFor,
  getDemoDeck,
  initialScoreState,
  initialStats,
  isChoiceCorrect,
  scoreCorrect,
  scoreTimeout,
  scoreWrong,
  type Card,
  type Mode,
} from "./engine";

type Status = "ready" | "running" | "finished";

export function usePlaySession(deckId: string, mode: Mode) {
  const cfg = useMemo(() => configFor(mode), [mode]);
  const deck = useMemo(() => shuffle(getDemoDeck(deckId)), [deckId]);

  const [status, setStatus] = useState<Status>("ready");

  // total timer
  const [remainingMs, setRemainingMs] = useState(cfg.totalMs);

  // per-card timer
  const [cardRemainingMs, setCardRemainingMs] = useState(cfg.perCardMs);

  const [index, setIndex] = useState(0);
  const current: Card | null = deck[index] ?? null;

  const [scoreState, setScoreState] = useState(initialScoreState());
  const [stats, setStats] = useState(initialStats());

  const startedAtRef = useRef<number>(0);
  const cardStartedAtRef = useRef<number>(0);
  const tickTimerRef = useRef<number | null>(null);

  function stopLoop() {
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }

  function finish(reason: string) {
    setStatus("finished");
    stopLoop();
    console.log("[RecallRush] finished:", reason);
  }

  function start() {
    setStatus("running");
    setIndex(0);
    setScoreState(initialScoreState());
    setStats(initialStats());

    const now = Date.now();
    startedAtRef.current = now;
    cardStartedAtRef.current = now;

    setRemainingMs(cfg.totalMs);
    setCardRemainingMs(cfg.perCardMs);
  }

  function nextCard(resetTimer = true) {
    setIndex((i) => i + 1);
    if (resetTimer) {
      cardStartedAtRef.current = Date.now();
      setCardRemainingMs(cfg.perCardMs);
    }
  }

  function handleTimeout() {
    setScoreState((s) => scoreTimeout(s));
    setStats((st) => ({
      ...st,
      timeout: st.timeout + 1,
      answered: st.answered + 1,
    }));

    if (mode === "sudden") {
      finish("timeout (sudden death)");
      return;
    }

    if (index + 1 >= deck.length) {
      finish("deck complete");
      return;
    }
    nextCard(true);
  }

  function choose(selectedIndex: number) {
    if (status !== "running" || !current) return;

    const responseMs = Date.now() - cardStartedAtRef.current;
    const correct = isChoiceCorrect(selectedIndex, current.correctIndex);

    if (correct) {
      setScoreState((s) => scoreCorrect(s, responseMs, cfg.perCardMs));
      setStats((st) => ({
        ...st,
        correct: st.correct + 1,
        answered: st.answered + 1,
        avgResponseMs:
          st.answered === 0
            ? responseMs
            : Math.round(
                (st.avgResponseMs * st.answered + responseMs) /
                  (st.answered + 1)
              ),
      }));
    } else {
      setScoreState((s) => scoreWrong(s));
      setStats((st) => ({
        ...st,
        wrong: st.wrong + 1,
        answered: st.answered + 1,
      }));

      if (mode === "sudden") {
        finish("wrong (sudden death)");
        return;
      }
    }

    if (index + 1 >= deck.length) {
      finish("deck complete");
      return;
    }

    nextCard(true);
  }

  // timer loop: total + per-card
  useEffect(() => {
    if (status !== "running") return;

    stopLoop();
    tickTimerRef.current = window.setInterval(() => {
      const now = Date.now();

      const elapsed = now - startedAtRef.current;
      const rem = Math.max(0, cfg.totalMs - elapsed);
      setRemainingMs(rem);

      if (rem === 0) {
        finish("time up");
        return;
      }

      const cardElapsed = now - cardStartedAtRef.current;
      const cardRem = Math.max(0, cfg.perCardMs - cardElapsed);
      setCardRemainingMs(cardRem);

      if (cardRem === 0) {
        handleTimeout();
      }
    }, 50);

    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, cfg.totalMs, cfg.perCardMs, index, mode]);

  return {
    cfg,
    deck,
    current,
    index,
    remainingMs,
    cardRemainingMs,
    status,
    scoreState,
    stats,
    start,
    choose, // NEW: button-driven answer
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
