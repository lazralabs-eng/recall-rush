import { useEffect, useMemo, useRef, useState } from "react";
import {
  configFor,
  getDeck,
  initialScoreState,
  initialStats,
  isChoiceCorrect,
  scoreCorrect,
  scoreTimeout,
  scoreWrong,
  type Card,
  type Mode,
} from "./engine";

type Phase = "ready" | "playing" | "reveal" | "finished";

export function usePlaySession(deckId: string, mode: Mode) {
  const cfg = useMemo(() => configFor(mode), [mode]);
  const deck = useMemo(() => shuffle(getDeck(deckId)), [deckId]);

  const [phase, setPhase] = useState<Phase>("ready");

  // total timer
  const [remainingMs, setRemainingMs] = useState(cfg.totalMs);

  // per-card timer
  const [cardRemainingMs, setCardRemainingMs] = useState(cfg.perCardMs);

  const [index, setIndex] = useState(0);
  const current: Card | null = deck[index] ?? null;

  const [scoreState, setScoreState] = useState(initialScoreState());
  const [stats, setStats] = useState(initialStats());
  const [feedback, setFeedback] = useState<
    null | "correct" | "wrong" | "timeout"
  >(null);
  const [feedbackTick, setFeedbackTick] = useState(0);
  const [lastChoiceIndex, setLastChoiceIndex] = useState<number | null>(null);
  const [runId, setRunId] = useState<string>("");
  const [finishedAt, setFinishedAt] = useState<number>(0);

  const startedAtRef = useRef<number>(0);
  const cardStartedAtRef = useRef<number>(0);
  const tickTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  function stopLoop() {
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }

  function clearRevealTimer() {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }

  function finish(reason: string) {
    setPhase("finished");
    setFinishedAt(Date.now());
    stopLoop();
    clearRevealTimer();
    console.log("[RecallRush] finished:", reason);
  }

  function start() {
    setPhase("playing");
    setIndex(0);
    setScoreState(initialScoreState());
    setStats(initialStats());
    setFeedback(null);
    setFeedbackTick(0);
    setLastChoiceIndex(null);
    setFinishedAt(0);
    setRunId(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    stopLoop();
    clearRevealTimer();

    const now = Date.now();
    startedAtRef.current = now;
    cardStartedAtRef.current = now;

    setRemainingMs(cfg.totalMs);
    setCardRemainingMs(cfg.perCardMs);
  }

  function nextCard(resetTimer = true) {
    setLastChoiceIndex(null);
    setFeedback(null);
    setPhase("playing");
    setIndex((i) => i + 1);
    if (resetTimer) {
      cardStartedAtRef.current = Date.now();
      setCardRemainingMs(cfg.perCardMs);
    }
  }

  function handleTimeout() {
    setFeedback("timeout");
    setFeedbackTick((t) => t + 1);
    setPhase("reveal");
    setScoreState((s) => scoreTimeout(s));
    setStats((st) => ({
      ...st,
      timeout: st.timeout + 1,
      answered: st.answered + 1,
    }));

    clearRevealTimer();
    revealTimerRef.current = window.setTimeout(() => {
      if (mode === "sudden") {
        finish("timeout (sudden death)");
        return;
      }

      if (index + 1 >= deck.length) {
        finish("deck complete");
        return;
      }
      nextCard(true);
    }, 200);
  }

  function choose(selectedIndex: number) {
    if (phase !== "playing" || !current) return;

    setLastChoiceIndex(selectedIndex);

    const responseMs = Date.now() - cardStartedAtRef.current;
    const correct = isChoiceCorrect(selectedIndex, current.correctIndex);

    if (correct) {
      setFeedback("correct");
      setFeedbackTick((t) => t + 1);
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
      setFeedback("wrong");
      setFeedbackTick((t) => t + 1);
      setScoreState((s) => scoreWrong(s));
      setStats((st) => ({
        ...st,
        wrong: st.wrong + 1,
        answered: st.answered + 1,
      }));
    }

    setPhase("reveal");

    clearRevealTimer();
    revealTimerRef.current = window.setTimeout(() => {
      if (!correct && mode === "sudden") {
        finish("wrong (sudden death)");
        return;
      }

      if (index + 1 >= deck.length) {
        finish("deck complete");
        return;
      }

      nextCard(true);
    }, 200);
  }

  // timer loop: total + per-card
  useEffect(() => {
    if (phase !== "playing") return;

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
  }, [phase, cfg.totalMs, cfg.perCardMs, index, mode]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop();
      clearRevealTimer();
    };
  }, []);

  return {
    cfg,
    deck,
    current,
    index,
    remainingMs,
    cardRemainingMs,
    phase,
    scoreState,
    stats,
    start,
    choose,
    feedback,
    feedbackTick,
    lastChoiceIndex,
    runId,
    finishedAt,
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
