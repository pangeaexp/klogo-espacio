import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LogoCanvas, readPianoCanvas, useLogoCanvas, useMandelbrotZoom } from "./LogoCanvas.jsx";
import { GamePanel } from "./GamePanel.jsx";
import { PatrolBoard } from "./PatrolBoard.jsx";
import { LogoReference } from "./LogoReference.jsx";
import { useLogoExecution } from "./use-logo-execution.js";
import { useLogoEditor } from "./use-logo-editor.js";
import { ChallengeStatus, LessonNav, challengeSuccessMessage } from "./LessonNav.jsx";
import { LogoToolbar } from "./LogoToolbar.jsx";
import { MobileTabs } from "./MobileTabs.jsx";
import { CodeEditor, StepInspector } from "./CodeEditor.jsx";
import { ElizaConversation, OutputPanel, WordInput } from "./ProgramOutput.jsx";
import { useLogoLessons } from "./use-logo-lessons.js";
import { usePresentation } from "./use-presentation.js";
import { diagnosticHelp } from "./diagnostic-help.js";
import { plotImage } from "./ImageExport.jsx";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { defaultFileName } from "./draft.js";
import { useLogoFiles } from "./use-logo-files.js";
import { examples } from "./examples.js";
import { originName } from "./program-origins.js";
import { klogoStyles } from "./klogo-styles.js";
import { isTreasureSource, readTreasureMap, treasureProject, treasureTitle } from "./treasure-project.js";
import { desktopViewport, mobileViewport, panelProps, subscribeToViewport } from "./viewport.js";

const mobileTabs = [
  { id: "code", label: "Código" },
  { id: "canvas", label: "Lienzo" },
  { id: "output", label: "Salida" },
];
const conversationTabs = mobileTabs.filter(tab => tab.id !== "canvas");

// Pages without a progress LiveStore: the front page and the Aula.
function useNoProgressStore() {
  return null;
}

export function KLogo({ workerSource, wasmUrl, miniWordle, torresDeHanoi, mandelbrot, patrullaOrbital, eliza, treasureMap, ProgramLibrary, libraryHref, Classroom, useProgressStore = useNoProgressStore }) {
  // A hook from the page (aula.mdx passes useAulaProgress, library-stores.js);
  // it never changes during a visit, so the hook order stays the same.
  const progressStore = useProgressStore();
  const isMobile = useSyncExternalStore(subscribeToViewport, mobileViewport, desktopViewport);
  const [activeTab, setActiveTab] = useState("code");
  const referenceRef = useRef(null);
  const [editorReference, setEditorReference] = useState(null);
  const referencePosition = useRef(null);
  const pendingDiagnostic = useRef(null);
  const editorRef = useRef(null);
  const files = useLogoFiles({
    initialSource: examples.roseta.source, editorRef, activeTab, isMobile,
    showEditor: () => setActiveTab("code"),
    identifyExample: program => treasureMap && isTreasureSource(program) ? treasureProject : "",
    onProgramOpened,
    onError: showFileError,
  });
  const { draft, source, setSource, fileName, setFileStatus, openingFile,
    loadExampleProgram, keepCurrentDraft, editProgram, openEditorProgram, renameFile } = files;
  const sourceLines = useMemo(() => source.split("\n"), [source]);
  const lineNumbers = useMemo(() => sourceLines.map((_, index) => index + 1).join("\n"), [sourceLines]);
  const otherExamples = {
    ...examples,
    wordle: { name: "Mini-Wordle · 4 letras", source: miniWordle },
    hanoi: { name: "Torres de Hanói", source: torresDeHanoi },
    orbital: { name: "Patrulla orbital · Marcianitos", source: patrullaOrbital },
    mandelbrot: { name: "Mandelbrot", source: mandelbrot },
    ...(eliza && { eliza: { name: "ELIZA", source: eliza } }),
  };
  const inputRef = useRef(null);
  const keyInputRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const hintLinesRef = useRef(null);
  const outputRef = useRef(null);
  const wordleOutputRef = useRef(null);
  const treasureOutputRef = useRef(null);
  const stepLineRef = useRef(null);
  const [imageExport, setImageExport] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const presentation = usePresentation();
  const idlePianoRaster = useRef(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [note, setNote] = useState(draft ? "Borrador recuperado" : "");
  const {
    phase, drawing, raster, setRaster, runId, stepAt, answer, setAnswer, audioUnavailable, delayMs, isPlayingNote,
    inProgress, canPause, showKeyInput, isHeld, start, run: executeProgram, step, pauseRun,
    resumeRun, submitAnswer, resumeKey, resumeClick, advancePatrol, clearDrawing,
  } = useLogoExecution({ workerSource, wasmUrl, setActiveTab, setDiagnostic, setNote });
  const {
    example, lesson, origin, setOrigin, isTreasure, projectChallenge, challengeResult, celebrationAction, hintLines,
    reloadTarget, drawingTarget, showTurtlePad, draftExample, loadExample, selectOwnProgram,
    noteProgramEdit, noteProgramRun, clearProjectRun, picker, lessonPanel,
  } = useLogoLessons({
    draft, source, sourceLines, otherExamples, treasureMap, phase, drawing, raster, diagnostic,
    onSelect: loadSelectedProgram,
    progressStore,
    onTrackTextSize: presentation.raiseTextSize,
    onHintLine: scrollToHintLine,
    onContinue: advanceAfterChallenge,
    // The picker passes itself, to get the focus back when the gallery closes.
    onOpenGallery: from => setGalleryOpen(from ?? true),
  });
  const isPatrol = example === "orbital";
  const isEliza = example === "eliza";
  const tabs = isEliza ? conversationTabs : mobileTabs;
  const isPiano = lesson === "piano";
  const stepInspection = stepAt?.inspection;
  const canFocusInput = phase === "input" && (!isEliza || !isMobile || activeTab === "output");
  useEffect(() => {
    if (canFocusInput) inputRef.current?.focus();
    if (phase === "key") keyInputRef.current?.focus({ preventScroll: true });
  }, [canFocusInput, phase, isMobile]);

  // LEECLIC needs the canvas on screen: on mobile, open Lienzo while it waits.
  useEffect(() => {
    if (phase === "click" && isMobile) setActiveTab("canvas");
  }, [phase, isMobile]);

  useLayoutEffect(() => {
    if (isPiano && phase === "key") idlePianoRaster.current = raster;
  }, [isPiano, phase, raster]);

  useEffect(() => {
    for (const output of [outputRef.current, wordleOutputRef.current, treasureOutputRef.current]) {
      if (output) output.scrollTop = output.scrollHeight;
    }
  }, [drawing, activeTab, isMobile]);

  const syncLineNumbers = useCallback(() => {
    const scroll = editorRef.current.scrollTop;
    lineNumbersRef.current.style.transform = `translateY(${-scroll}px)`;
    hintLinesRef.current.style.setProperty("--kl-hint-scroll", `${-scroll}px`);
    if (stepLineRef.current) stepLineRef.current.style.transform = `translateY(${-scroll}px)`;
  }, []);

  useLayoutEffect(() => {
    syncLineNumbers();
  }, [source, syncLineNumbers]);

  // Position the band; Paso also brings its next command into view.
  useLayoutEffect(() => {
    const band = stepLineRef.current;
    const editor = editorRef.current;
    if (!stepAt || !band || !editor) return;
    const style = getComputedStyle(editor);
    const lineHeight = parseFloat(style.lineHeight);
    const top = parseFloat(style.paddingTop) + (stepAt.line - 1) * lineHeight;
    band.style.top = `${top}px`;
    band.style.height = `${lineHeight}px`;
    if (stepAt.kind !== "click" && editor.clientHeight > 0
        && (top < editor.scrollTop || top + lineHeight > editor.scrollTop + editor.clientHeight)) {
      editor.scrollTop = top - (editor.clientHeight - lineHeight) / 2;
    }
    syncLineNumbers();
  }, [stepAt, activeTab, syncLineNumbers]);

  function run(program = source, stepMode = false) {
    if (phase !== "ready" || openingFile) return;
    noteProgramRun(program);
    idlePianoRaster.current = null;
    if (isMobile && (isPiano || isPatrol || example === "wordle" || example === "hanoi")) setActiveTab("canvas");
    if (isMobile && isEliza) setActiveTab("output");
    executeProgram(program, {
      stepMode, isMandelbrot: example === "mandelbrot", revealSpatialOnRun: !isEliza,
      clearPreviousDrawing: isPatrol || isTreasure,
    });
  }

  // Paso starts a run that stops before its first command, then runs one command per press.
  function stepProgram() {
    if (phase === "ready") run(source, true);
    else if (phase === "step" || phase === "paused") step();
  }

  // The turtle pad of the first lesson writes one command at the end of the
  // program, or takes the last one away, and runs the result.
  function padCommand(command) {
    if (phase !== "ready" || openingFile) return;
    const next = `${source.replace(/\s+$/, "")}\n${command}`;
    editSource(next);
    run(next);
  }

  function padUndo() {
    if (phase !== "ready" || openingFile) return;
    const lines = source.replace(/\s+$/, "").split("\n");
    const last = lines.findLastIndex(line => line.trim() && !line.trim().startsWith(";"));
    if (last < 0) return;
    const next = lines.filter((_, index) => index !== last).join("\n");
    editSource(next);
    run(next);
  }

  const editorLocked = inProgress || openingFile;

  function stopRun() {
    clearProjectRun();
    setNote("Ejecución detenida");
    if (piano?.layout && idlePianoRaster.current) setRaster(idlePianoRaster.current);
    start();
  }

  function advanceAfterChallenge(next) {
    if (inProgress) start();
    loadExample(next);
    window.requestAnimationFrame(() => editorRef.current?.focus({ preventScroll: true }));
  }

  function primaryAction() {
    if (canPause) {
      pauseRun();
    } else if (isHeld) {
      resumeRun();
    } else if (inProgress) {
      // Waiting for a word or a key: the run cannot pause; Detener stops it.
    } else if (phase === "unavailable") {
      setNote("");
      start();
    } else {
      run();
    }
  }

  function loadSelectedProgram(chosen, program, name) {
    setActiveTab("code");
    if (program) {
      loadExampleProgram(program.source, name);
      clearDrawing();
    } else if (chosen === "") {
      keepCurrentDraft();
    }
    if (chosen === "mandelbrot") mandelbrotZoom.resetHistory();
    if (phase === "ready") setDiagnostic(null);
    setNote("");
  }

  function showFileError(message) {
    setDiagnostic({ message });
    setActiveTab("output");
  }

  function onProgramOpened(project, message) {
    selectOwnProgram(project);
    clearDrawing();
    mandelbrotZoom.resetHistory();
    if (phase !== "unavailable") setDiagnostic(null);
    setActiveTab("code");
    setNote(message);
  }

  function openReference() {
    const dialog = referenceRef.current;
    dialog.showModal();
    dialog.querySelector('input[type="search"]').focus();
  }

  function rememberReferencePosition(editor) {
    referencePosition.current = {
      start: editor.selectionStart,
      end: editor.selectionEnd,
      direction: editor.selectionDirection,
      top: editor.scrollTop,
      left: editor.scrollLeft,
      pageX: window.scrollX,
      pageY: window.scrollY,
    };
  }

  function openEditorReference() {
    const editor = editorRef.current;
    rememberReferencePosition(editor);
    const { value, selectionStart, selectionEnd } = editor;
    const selection = value.slice(selectionStart, selectionEnd).trim();
    const left = value.slice(0, selectionStart).match(/[\p{L}\p{M}\p{N}_]+$/u)?.[0] ?? "";
    const right = value.slice(selectionEnd).match(/^[\p{L}\p{M}\p{N}_]+/u)?.[0] ?? "";
    const command = selectionStart === selectionEnd ? left + right : selection;
    setEditorReference(current => ({ command, revision: (current?.revision ?? 0) + 1 }));
  }

  function closeEditorReference() {
    const position = referencePosition.current;
    setEditorReference(null);
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor || !position) return;
      editor.focus({ preventScroll: true });
      editor.setSelectionRange(position.start, position.end, position.direction);
      editor.scrollTop = position.top;
      editor.scrollLeft = position.left;
      syncLineNumbers();
      window.scrollTo(position.pageX, position.pageY);
    });
  }

  // Guardar imagen: finish any animation, make sure the canvas is on screen,
  // then capture it once it has been painted.
  function exportImage() {
    finishAnimation();
    if (isMobile && activeTab !== "canvas") setActiveTab("canvas");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const canvas = plotBoxRef.current?.querySelector("canvas");
      const url = plotImage(canvas);
      if (!url) {
        setFileStatus("No hay ningún dibujo que guardar. Pulsa Ejecutar primero.");
        return;
      }
      // Examples keep the default file name: name the image after the example instead.
      const base = (fileName !== defaultFileName && fileName.replace(/\.logo$/i, "")) || lesson || example || "dibujo";
      setImageExport({ url, name: `${base}.png`, width: canvas.width, height: canvas.height });
    }));
  }

  const focusDiagnostic = useCallback(diagnostic => {
    const editor = editorRef.current;
    const lines = editor.value.split("\n");
    const index = Math.min(diagnostic.line, lines.length) - 1;
    const previous = lines.slice(0, index).reduce((offset, line) => offset + line.length + 1, 0);
    // Logo counts Unicode characters. Textarea selections count UTF-16 code units.
    const column = Array.from(lines[index]).slice(0, diagnostic.column - 1).join("").length;
    const offset = previous + column;
    editor.focus();
    editor.setSelectionRange(offset, offset);
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight);
    editor.scrollTop = index * lineHeight - (editor.clientHeight - lineHeight) / 2;
    syncLineNumbers();
  }, [syncLineNumbers]);

  useLayoutEffect(() => {
    if (!pendingDiagnostic.current || (isMobile && activeTab !== "code")) return;
    focusDiagnostic(pendingDiagnostic.current);
    pendingDiagnostic.current = null;
  }, [activeTab, isMobile, focusDiagnostic]);

  function goToDiagnostic() {
    if (isMobile && activeTab !== "code") {
      pendingDiagnostic.current = diagnostic;
      setActiveTab("code");
    } else {
      focusDiagnostic(diagnostic);
    }
  }

  function editSource(value) {
    editProgram(value, { lesson, patrol: isPatrol, example: draftExample });
    if (note === "Borrador recuperado") setNote("");
    noteProgramEdit();
    if (phase === "ready") setDiagnostic(null);
  }

  const { completion, acceptCompletion, editorKeyDown, changeEditor, dismissCompletion, scrollEditor } =
    useLogoEditor({
      editorRef, editSource, syncLineNumbers, onRun: run, onStep: stepProgram,
      onPauseOrResume: () => {
        if (canPause) pauseRun();
        else resumeRun();
      },
    });

  const fixedSpeed = isTreasure || isPiano || isPatrol || ["wordle", "hanoi", "mandelbrot"].includes(example);
  const canvas = useLogoCanvas({ drawing, raster, runId, phase, fixedSpeed });
  const { animating, finishAnimation, plotBoxRef } = canvas;
  const mandelbrotZoom = useMandelbrotZoom(mandelbrot, program => {
    setSource(program);
    run(program);
  });
  const printLines = drawing?.events.filter(event => event.type === "print").map(event => event.text);
  const showMobileCelebration = isMobile && activeTab !== "code" && challengeResult === true;

  function scrollToHintLine(line) {
    const editor = editorRef.current;
    const style = getComputedStyle(editor);
    const height = parseFloat(style.lineHeight);
    const top = parseFloat(style.paddingTop) + (line - 1) * height;
    if (top < editor.scrollTop || top + height > editor.scrollTop + editor.clientHeight) {
      editor.scrollTop = top - (editor.clientHeight - height) / 2;
      syncLineNumbers();
    }
  }

  const piano = isPiano ? readPianoCanvas(printLines, inProgress) : null;
  const treasure = useMemo(() => isTreasure ? readTreasureMap(drawing) : null, [isTreasure, drawing]);
  const printed = treasure ? treasure.messages : piano?.printed ?? printLines;
  const status = {
    loading: "Cargando motor WASM…",
    ready: "Motor WASM listo",
    running: isPatrol ? "Patrulla en marcha" : "Ejecutando…",
    input: isPatrol ? "Patrulla en marcha" : example === "hanoi" ? "Esperando un movimiento" : isEliza ? "Esperando un mensaje" : example === "frases" ? "Esperando una frase" : "Esperando una palabra",
    key: "Esperando una tecla",
    click: "Esperando un clic en el lienzo",
    step: stepAt ? `Paso a paso · línea ${stepAt.line}, columna ${stepAt.column}` : "Paso a paso",
    paused: stepAt ? `En pausa · línea ${stepAt.line}, columna ${stepAt.column}` : "En pausa",
    pausing: isPlayingNote ? "Tocando una nota…" : example === "hanoi" ? "Resolviendo automáticamente" : raster ? "Dibujando…" : "En pausa…",
    unavailable: "Motor no disponible",
  }[phase];
  const help = useMemo(() => diagnosticHelp(diagnostic, source), [diagnostic, source]);

  // Rewrites the misspelt name the help points at and runs the program again.
  function applyFix({ line, column, length, text }) {
    if (phase !== "ready" || openingFile) return;
    const lines = source.split("\n");
    const chars = Array.from(lines[line - 1] ?? "");
    chars.splice(column - 1, length, ...Array.from(text));
    lines[line - 1] = chars.join("");
    const next = lines.join("\n");
    editSource(next);
    run(next);
  }

  const isWordle = example === "wordle";
  const isHanoi = example === "hanoi";
  const isGame = isWordle || isHanoi;
  const isMandelbrot = example === "mandelbrot";
  const wordInput = phase === "input" && !isHanoi && !isPatrol && (
    <WordInput inputRef={inputRef} answer={answer} onChange={setAnswer} onSubmit={submitAnswer}
      label={isEliza ? "Mensaje" : example === "frases" ? "Frase" : "Palabra"} />
  );
  const conversation = isEliza && <ElizaConversation lines={printed} outputRef={outputRef} input={wordInput} />;
  return (
    <main className="kl-workspace" aria-label="Editor KLogo" ref={presentation.workspaceRef}
      data-presenting={presentation.presenting} style={{ "--kl-text": presentation.textScale }}>
      <style>{klogoStyles}</style>

      <header className="kl-header">
        <h1 className="kl-title">KLogo</h1>
        <span className="kl-status" role="status">
          <span className="kl-dot" data-phase={phase} aria-hidden="true" />
          {status}
        </span>
      </header>

      <div className="kl-command-bar">
        <LogoToolbar
          execution={{
            phase, inProgress, canPause, isHeld, animating, onPrimary: primaryAction, onStep: stepProgram,
            onStop: () => { if (inProgress) stopRun(); else if (animating) finishAnimation(); },
          }}
          files={files} editorLocked={editorLocked} picker={picker} reloadTarget={reloadTarget}
          reference={{
            expanded: Boolean(editorReference), onOpen: openReference,
            onSyntax: () => { setActiveTab("code"); openEditorReference(); },
          }}
          ProgramLibrary={ProgramLibrary} libraryHref={libraryHref}
          library={{
            origin, describeOrigin: key => originName(key, otherExamples),
            onOpen: (program, name, savedOrigin) => { openEditorProgram(program, name); setOrigin(savedOrigin ?? ""); },
            onSaved: renameFile,
          }}
          presentation={presentation}
          gallery={{
            open: galleryOpen, setOpen: setGalleryOpen, otherExamples,
            onSelect: key => { loadExample(key); editorRef.current?.focus(); },
          }}
          image={{ preview: imageExport, canExport: Boolean(drawing || raster),
            onExport: exportImage, onClose: () => setImageExport(null) }}
          feedback={{ note, audioUnavailable, showKeyInput, keyInputRef }} />
        {isMobile && (
          <MobileTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} conversation={isEliza} />
        )}
        {showMobileCelebration && (
          <div className="kl-mobile-celebration">
            <ChallengeStatus message={challengeSuccessMessage} celebrate action={celebrationAction} />
          </div>
        )}
      </div>
      {Classroom && (
        <Classroom lesson={lesson} doneLessons={lessonPanel.doneLessons} source={source} fileName={fileName}
          origin={origin} originLabel={originName(origin, otherExamples) ?? ""}
          locked={editorLocked}
          onOpenLesson={key => { loadExample(key); editorRef.current?.focus(); }}
          onOpenProgram={(program, name, savedOrigin) => { setActiveTab("code"); openEditorProgram(program, name); setOrigin(savedOrigin ?? ""); }} />
      )}
      {isMobile && !isEliza && wordInput}

      <div className="kl-grid" data-reference-open={Boolean(editorReference)}>
        <section className="kl-pane" aria-label={isMobile ? undefined : "Programa de Logo"}
          {...panelProps("code", isMobile, activeTab)}>
          <div className="kl-pane-head">
            <label htmlFor="klogo-source" className="kl-pane-title">Editor Logo</label>
            <span className="kl-file-name kl-muted" title={fileName}>{fileName}</span>
            {isTreasure ? (
              <section className="kl-treasure-project" aria-labelledby="klogo-treasure-title">
                <h2 id="klogo-treasure-title" className="kl-pane-title">Proyecto libre · {treasureTitle}</h2>
                <p>Ejecuta el mapa y busca el tesoro con clics. En Logo puedes dibujar otra isla, escribir tus pistas y elegir el escondite.</p>
              </section>
            ) : projectChallenge ? (
              <section className="kl-challenge kl-open-challenge" aria-label="Reto abierto" data-done={challengeResult === true}>
                <div className="kl-challenge-main">
                  <ToolbarIcon name="flag" />
                  <p className="kl-challenge-goal">{projectChallenge.goal}</p>
                </div>
                {!showMobileCelebration && <ChallengeStatus
                  message={challengeResult === true ? challengeSuccessMessage
                    : challengeResult === null ? "" : `Todavía no: ${challengeResult}`}
                  celebrate={challengeResult === true} action={celebrationAction} />}
              </section>
            ) : (
              <LessonNav {...lessonPanel} showChallengeStatus={!showMobileCelebration} />
            )}
          </div>
          <CodeEditor editorRef={editorRef} lineNumbersRef={lineNumbersRef} hintLinesRef={hintLinesRef}
            stepLineRef={stepLineRef} source={source} lineNumbers={lineNumbers} hintLines={hintLines} stepAt={stepAt}
            showClickStep={isTreasure} readOnly={editorLocked} completion={completion} acceptCompletion={acceptCompletion}
            onChange={changeEditor} onKeyDown={editorKeyDown} onScroll={scrollEditor} onDismissCompletion={dismissCompletion}
            onBlur={editor => { if (editorReference) rememberReferencePosition(editor); }} />
          {stepInspection && <StepInspector inspection={stepInspection} />}
        </section>

        {editorReference && (
          <LogoReference key={editorReference.revision} id="klogo-editor-reference"
            command={editorReference.command} onClose={closeEditorReference} hidden={isMobile && activeTab !== "code"} />
        )}
        {(!isMobile || !isEliza) && <div className="kl-canvas-panel" {...panelProps("canvas", isMobile, activeTab)}
          hidden={isMobile ? activeTab !== "canvas" : Boolean(editorReference)}>
          {isEliza ? conversation : isPatrol ? (
            <PatrolBoard active={inProgress} waiting={phase === "input"} raster={raster}
              lines={printed ?? []} note={note} onTick={advancePatrol} />
          ) : isGame ? (
            <GamePanel isHanoi={isHanoi} lines={printed} phase={phase} delayMs={delayMs} onMove={submitAnswer}
              input={!isMobile && wordInput} outputRef={wordleOutputRef} waitingToStart={!drawing && phase === "ready"} />
          ) : (
            <LogoCanvas canvas={canvas} raster={raster} phase={phase} editorLocked={editorLocked}
              zoom={isMandelbrot ? mandelbrotZoom : null} piano={piano} target={drawingTarget}
              treasure={treasure} treasureOutputRef={treasureOutputRef} resumeClick={resumeClick} resumeKey={resumeKey}
              onTurtleCommand={showTurtlePad
                ? command => command ? padCommand(command) : padUndo() : null} />
          )}
        </div>}
      </div>

      {!isMobile && !isGame && !isPatrol && !isEliza && wordInput}
      <div {...panelProps("output", isMobile, activeTab)}>
        <OutputPanel isMobile={isMobile} printed={printed} outputRef={outputRef}
          showPrinted={!isEliza && (isMobile || (!isGame && !isPatrol && !isTreasure))}
          diagnostic={diagnostic} help={help} canFix={!editorLocked && phase === "ready"}
          onGoTo={goToDiagnostic} onFix={applyFix}>
          {isMobile && isEliza && conversation}
        </OutputPanel>
      </div>
      <LogoReference dialogRef={referenceRef} locked={editorLocked} onLoad={openEditorProgram} />
    </main>
  );
}
