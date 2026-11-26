import { useCallback, useEffect, useRef, useState } from "react";
import { createEngine } from "./engine.js";
import { createLogoAudio } from "./logo-audio.js";
import { mergeRaster } from "./RasterPlot.jsx";

const editorStepLimit = 8_000_000;
// Long runs return to the page in slices so the user can pause them.
const sliceSteps = 50_000;
// A zoomed region can require all 36 iterations for every pixel.
const mandelbrotStepLimit = 24_000_000;

const namedKeys = new Map([
  ["ArrowLeft", "IZQUIERDA"],
  ["ArrowRight", "DERECHA"],
  ["ArrowUp", "ARRIBA"],
  ["ArrowDown", "ABAJO"],
  ["Enter", "INTRO"],
  [" ", "ESPACIO"],
  ["Escape", "ESCAPE"],
]);

export function useLogoExecution({ workerSource, wasmUrl, setActiveTab, setDiagnostic, setNote }) {
  const engineRef = useRef(null);
  const [phase, setPhase] = useState("loading");
  const [answer, setAnswer] = useState("");
  const waitingForKey = useRef(false);
  const waitingForClick = useRef(false);
  // Keep the keyboard prompt mounted while the worker processes a move.
  const [keyRun, setKeyRun] = useState(false);
  const [pause, setPause] = useState(null);
  const [stepAt, setStepAt] = useState(null);
  // A run can be held after a slice or inside ESPERA/NOTA.
  const [held, setHeld] = useState(null);
  const pauseRequested = useRef(false);
  const pauseTiming = useRef(null);
  const revealSpatial = useRef(false);
  const [drawing, setDrawing] = useState(null);
  const [raster, setRaster] = useState(null);
  const [runId, setRunId] = useState(0);
  const [audio] = useState(createLogoAudio);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  const start = useCallback(() => {
    audio.stop();
    waitingForKey.current = false;
    waitingForClick.current = false;
    setKeyRun(false);
    engineRef.current?.dispose();
    const engine = createEngine(workerSource, wasmUrl);
    engineRef.current = engine;
    setPhase("loading");
    setPause(null);
    setStepAt(null);
    setHeld(null);
    pauseRequested.current = false;
    setDiagnostic(null);
    engine.start().then(() => {
      if (engineRef.current === engine) setPhase("ready");
    }).catch((error) => {
      if (engineRef.current !== engine) return;
      setDiagnostic({ message: error.message });
      setActiveTab("output");
      setPhase("unavailable");
    });
  }, [audio, workerSource, wasmUrl, setDiagnostic, setActiveTab]);

  useEffect(() => {
    start();
    return () => {
      const engine = engineRef.current;
      engineRef.current = null;
      engine?.dispose();
      audio.dispose();
    };
  }, [audio, start]);

  const execute = useCallback(async request => {
    const engine = engineRef.current;
    setPhase("running");
    setPause(null);
    setNote("");
    setDiagnostic(null);
    setAnswer("");
    setHeld(null);
    const show = reply => {
      setDrawing(reply.result);
      if (reply.result.spatial?.active && revealSpatial.current) {
        revealSpatial.current = false;
        setActiveTab("canvas");
      }
      const update = reply.result.raster;
      if (update) setRaster(current => mergeRaster(current, update));
    };
    try {
      let reply = await request(engine);
      // Long runs come back in slices; keep going unless Pausar was pressed.
      while (reply.ok && reply.slice && !pauseRequested.current && engineRef.current === engine) {
        show(reply);
        reply = await engine.continueAfterPause();
      }
      if (engineRef.current !== engine) return;
      const holding = pauseRequested.current;
      pauseRequested.current = false;
      if (reply.ok) {
        waitingForKey.current = reply.input?.kind === "key";
        waitingForClick.current = reply.input?.kind === "click";
        if (waitingForKey.current) setKeyRun(true);
        else if (!reply.input && reply.delay_ms === undefined && !reply.step && !reply.slice) setKeyRun(false);
        show(reply);
        setStepAt(reply.step ? { ...reply.step, inspection: reply.inspection }
          : reply.slice ?? (waitingForClick.current ? reply.input : null));
        if (reply.slice) {
          setHeld({ kind: "slice" });
          setPhase("paused");
        } else if (reply.delay_ms !== undefined && holding) {
          setHeld({ kind: "delay", milliseconds: reply.delay_ms, noteMidi: reply.note_midi });
          setPhase("paused");
        } else if (reply.delay_ms !== undefined) {
          setPause({ milliseconds: reply.delay_ms, noteMidi: reply.note_midi });
          setPhase("pausing");
        } else if (reply.step) {
          setPhase("step");
        } else {
          setPhase(waitingForKey.current ? "key" : waitingForClick.current ? "click" : reply.input ? "input" : "ready");
        }
      } else {
        setStepAt(null);
        setDiagnostic(reply.error);
        setActiveTab("output");
        waitingForKey.current = reply.error?.code === "invalid_key";
        if (!waitingForKey.current) setKeyRun(false);
        setPhase(waitingForKey.current ? "key" : "ready");
      }
    } catch (error) {
      if (engineRef.current !== engine) return;
      setStepAt(null);
      setDiagnostic({ message: error.message });
      setActiveTab("output");
      setPhase("unavailable");
    }
  }, [setActiveTab, setDiagnostic, setNote]);

  const advancePatrol = useCallback(command => execute(engine => engine.resume(command)), [execute]);

  useEffect(() => {
    if (!pause) return;
    const engine = engineRef.current;
    const playsNote = pause.noteMidi !== undefined;
    let cancelled = false;
    let timer;
    function beginPause() {
      if (cancelled || engineRef.current !== engine) return;
      if (playsNote) setAudioUnavailable(!audio.play(pause.noteMidi, pause.milliseconds));
      pauseTiming.current = { started: performance.now(), milliseconds: pause.milliseconds };
      timer = setTimeout(() => {
        if (engineRef.current === engine) execute(current => current.continueAfterPause(pause.run === true));
      }, pause.milliseconds);
    }
    if (playsNote) void audio.whenReady().then(beginPause);
    else beginPause();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      pauseTiming.current = null;
      if (playsNote) audio.stop();
    };
  }, [audio, pause, execute]);

  // Pausar: inside ESPERA or NOTA keep the time left; while computing, stop after the current slice.
  function pauseRun() {
    if (phase === "pausing") {
      const timing = pauseTiming.current;
      const left = timing ? Math.max(0, Math.round(timing.milliseconds - (performance.now() - timing.started)))
        : pause.milliseconds;
      setPause(null);
      setHeld({ kind: "delay", milliseconds: left });
      setPhase("paused");
    } else if (phase === "running") {
      pauseRequested.current = true;
    }
  }

  function resumeRun() {
    if (phase === "step") {
      setStepAt(null);
      execute(engine => engine.continueAfterPause());
    } else if (phase === "paused" && held?.kind === "delay") {
      setHeld(null);
      setStepAt(null);
      setPause({ milliseconds: held.milliseconds, run: true });
      setPhase("pausing");
    } else if (phase === "paused") {
      execute(engine => engine.continueAfterPause());
    }
  }

  function run(program, { stepMode, isMandelbrot, revealSpatialOnRun, clearPreviousDrawing }) {
    revealSpatial.current = revealSpatialOnRun;
    setRunId(id => id + 1);
    audio.unlock();
    setAudioUnavailable(false);
    setRaster(null);
    if (clearPreviousDrawing) setDrawing(null);
    const stepLimit = isMandelbrot ? mandelbrotStepLimit : editorStepLimit;
    execute(engine => engine.run(program, stepLimit, stepMode, sliceSteps));
  }

  function clearDrawing() {
    setDrawing(null);
    setRaster(null);
  }

  function step() {
    execute(engine => engine.step());
  }

  const submitAnswer = word => {
    if (phase === "input") execute(engine => engine.resume(word));
  };

  function resumeClick(x, y) {
    if (!waitingForClick.current) return;
    waitingForClick.current = false;
    execute(engine => engine.resumeClick(x, y));
  }

  const resumeKey = useCallback(key => {
    if (!waitingForKey.current) return;
    waitingForKey.current = false;
    execute(engine => engine.resumeKey(key));
  }, [execute]);

  useEffect(() => {
    if (phase !== "key") return;

    // Keep reading after a click moves focus away from the prompt. Let editors,
    // dialogs and controls keep the keys they use for their own interactions.
    function submitKey(event) {
      if (!waitingForKey.current || event.defaultPrevented || event.ctrlKey || event.metaKey
          || event.altKey || event.isComposing) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      if (target?.closest("dialog, input, select, textarea:not([readonly])")) return;
      if ((event.key === "Enter" || event.key === " ") && target?.closest("button, summary, a[href]")) return;

      const key = namedKeys.get(event.key)
        ?? (Array.from(event.key).length === 1 && !/\p{Cc}/u.test(event.key) ? event.key : null);
      if (!key) return;
      event.preventDefault();
      if (!event.repeat) resumeKey(key);
    }

    window.addEventListener("keydown", submitKey);
    return () => window.removeEventListener("keydown", submitKey);
  }, [phase, resumeKey]);

  const inProgress = ["running", "input", "key", "click", "pausing", "step", "paused"].includes(phase);
  const canPause = phase === "running" || phase === "pausing";
  const showKeyInput = phase === "key" || (keyRun && inProgress && phase !== "input" && phase !== "click");
  const isHeld = phase === "step" || phase === "paused";

  return {
    phase, drawing, raster, setRaster, runId, stepAt, answer, setAnswer, audioUnavailable,
    delayMs: pause?.milliseconds, isPlayingNote: pause?.noteMidi !== undefined,
    inProgress, canPause, showKeyInput, isHeld,
    start, run, step, pauseRun, resumeRun, submitAnswer, resumeKey, resumeClick, advancePatrol, clearDrawing,
  };
}
