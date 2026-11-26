import { useMemo, useRef, useState } from "react";
import { Plot, visibleTraces } from "./Plot.jsx";
import { SpatialPlot } from "./SpatialPlot.jsx";
import { RasterPlot } from "./RasterPlot.jsx";
import { PianoKeys } from "./PianoKeys.jsx";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { restoreSpeed, saveSpeed, turtleSpeeds, useTurtleAnimation } from "./turtle-animation.js";
import { initialMandelbrotView, withMandelbrotView } from "./examples.js";

const pianoRecordingPattern = /^PIANOESTADO (LISTO|GRABANDO|REPRODUCIENDO) (\d+)$/;

// Buttons of the first lesson: each one writes the command it shows.
const turtlePad = [
  { icon: "forward", command: "AVANZA 100", label: "Avanza 100" },
  { icon: "turnLeft", command: "GIRAIZQUIERDA 90", label: "Gira a la izquierda 90" },
  { icon: "turnRight", command: "GIRADERECHA 90", label: "Gira a la derecha 90" },
  { icon: "back", command: "RETROCEDE 100", label: "Retrocede 100" },
  { icon: "undo", command: null, label: "Quita la última orden" },
];

export function useLogoCanvas({ drawing, raster, runId, phase, fixedSpeed }) {
  const plotBoxRef = useRef(null);
  const [speed, setSpeed] = useState(restoreSpeed);
  const [showTarget, setShowTarget] = useState(false);
  // Step mode and input always show the whole drawing. Games draw at once.
  const animate = !raster && !["step", "key", "input", "click", "loading", "unavailable"].includes(phase);
  const { drawing: shownDrawing, animating, finish: finishAnimation } =
    useTurtleAnimation(drawing, runId, fixedSpeed ? "instant" : speed, animate);

  function changeSpeed(value) {
    setSpeed(value);
    saveSpeed(value);
  }

  return {
    plotBoxRef, shownDrawing, hasDrawing: Boolean(drawing), animating, finishAnimation,
    fixedSpeed, speed, changeSpeed, showTarget, toggleTarget: () => setShowTarget(shown => !shown),
  };
}

export function useMandelbrotZoom(source, onRun) {
  const [views, setViews] = useState([initialMandelbrotView]);
  const view = views.at(-1);

  function draw(nextViews) {
    const next = nextViews.at(-1);
    const program = next === initialMandelbrotView ? source : withMandelbrotView(source, next);
    setViews(nextViews);
    onRun(program);
  }

  function select({ x, y, size }) {
    const { izquierda, arriba, anchoplano, altoplano } = view;
    draw([...views, {
      izquierda: izquierda + x * anchoplano,
      arriba: arriba - y * altoplano,
      anchoplano: size * anchoplano,
      altoplano: size * altoplano,
    }]);
  }

  return {
    select, canSelect: view.anchoplano >= 1e-10, hasPreviousView: views.length > 1,
    previous: () => draw(views.slice(0, -1)), reset: () => draw([initialMandelbrotView]),
    resetHistory: () => setViews([initialMandelbrotView]),
  };
}

export function readPianoCanvas(printLines, inProgress) {
  const pianoLayout = printLines?.find(line => line.startsWith("PIANO "));
  const pianoKeys = pianoLayout ? pianoLayout.slice("PIANO ".length).split(" ") : [];
  const pianoBlackKeys = pianoLayout ? printLines.flatMap(line => {
    const match = /^PIANONEGRA (\S+) (\d+) (\d+) (\d+) (\d+)$/.exec(line);
    if (!match) return [];
    const [, key, x, y, width, height] = match;
    return [{ line, key, x: Number(x), y: Number(y), width: Number(width), height: Number(height) }];
  }) : [];
  const pianoRecording = pianoLayout
    && printLines.findLast(line => pianoRecordingPattern.test(line))?.match(pianoRecordingPattern);
  const recording = inProgress && pianoRecording?.[1] === "GRABANDO";
  const replaying = inProgress && pianoRecording?.[1] === "REPRODUCIENDO";
  const recordedNotes = inProgress && pianoRecording ? Number(pianoRecording[2]) : 0;
  const printed = pianoLayout
    ? printLines.filter(line => line !== pianoLayout && !pianoRecordingPattern.test(line)
      && !pianoBlackKeys.some(key => key.line === line))
    : printLines;
  return { layout: pianoLayout, keys: pianoKeys, blackKeys: pianoBlackKeys, recordingState: pianoRecording,
    recording, replaying, recordedNotes, printed };
}

export function LogoCanvas({ canvas, raster, phase, editorLocked, zoom, piano, target, treasure, treasureOutputRef,
  resumeClick, resumeKey, onTurtleCommand }) {
  const { plotBoxRef, shownDrawing, hasDrawing, animating, fixedSpeed, speed, changeSpeed, showTarget, toggleTarget } = canvas;
  const canChangeZoom = phase === "ready" && !editorLocked;
  const canZoom = zoom?.canSelect && canChangeZoom;
  const count = visibleTraces(shownDrawing?.events ?? []);
  const spatial = shownDrawing?.spatial?.active ? shownDrawing.spatial : null;
  const { segments: spatialSegments, faces: spatialFaces } = useMemo(() => {
    const segments = [];
    const faces = [];
    if (shownDrawing?.spatial?.active) {
      for (const event of shownDrawing.events) {
        if (event.type === "clear3") {
          segments.length = 0;
          faces.length = 0;
        }
        if (event.type === "move3" && event.pen_down) segments.push(event);
        if (event.type === "face3") faces.push(event);
      }
    }
    return { segments, faces };
  }, [shownDrawing]);
  const spatialTraceCount = spatialSegments.length;
  const spatialFaceCount = spatialFaces.length;
  const spatialTraceLabel = `${spatialTraceCount} ${spatialTraceCount === 1 ? "trazo" : "trazos"}`;
  const spatialFaceLabel = `${spatialFaceCount} ${spatialFaceCount === 1 ? "cara" : "caras"}`;
  const spatialStatus = spatialFaceCount
    ? `${spatialFaceLabel} 3D${spatialTraceCount ? ` · ${spatialTraceLabel} 3D` : ""}`
    : `${spatialTraceLabel} 3D`;
  const spatialDescription = spatialFaceCount
    ? `${spatialFaceLabel}${spatialTraceCount ? ` y ${spatialTraceLabel}` : ""}`
    : `${spatialTraceLabel} ${spatialTraceCount === 1 ? "visible" : "visibles"}`;
  return (
    <section className="kl-pane kl-plot-pane" aria-labelledby="klogo-plot">
      <div className="kl-pane-head">
        <h2 id="klogo-plot" className="kl-pane-title">{spatial ? "Lienzo 3D" : "Lienzo"}</h2>
        {treasure && <span className="kl-muted" role="status">{treasure.attempts} {treasure.attempts === 1 ? "intento" : "intentos"}</span>}
        {!fixedSpeed && !raster && (
          <label className="kl-speed">
            <span>Velocidad</span>
            <select className="kl-speed-select" value={speed}
              onChange={event => changeSpeed(event.target.value)}>
              {turtleSpeeds.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        )}
        {!spatial && zoom && (
          <div className="kl-zoom-actions">
            <button type="button" className="kl-run" disabled={!zoom.hasPreviousView || !canChangeZoom}
              onClick={zoom.previous}>Zoom anterior</button>
            {zoom.hasPreviousView && (
              <button type="button" className="kl-run" disabled={!canChangeZoom}
                onClick={zoom.reset}>Restablecer vista</button>
            )}
          </div>
        )}
      </div>
      <div className="kl-plot-box" ref={plotBoxRef}>
        {spatial ? (
          <SpatialPlot segments={spatialSegments} faces={spatialFaces} description={spatialDescription}
            turtle={spatial} penDown={shownDrawing.turtle.pen_down}
            showTurtle={shownDrawing.turtle.visible !== false} />
        ) : raster ? (
          <RasterPlot raster={raster} onSelectRegion={canZoom ? zoom.select : undefined}
            onPixelClick={phase === "click" ? resumeClick : undefined}>
            {piano?.keys.length > 0 && (
              <PianoKeys keys={piano.keys} blackKeys={piano.blackKeys} raster={raster}
                enabled={phase === "key"} onKey={resumeKey} />
            )}
          </RasterPlot>
        ) : piano && !hasDrawing ? (
          <p className="kl-piano-intro kl-muted">Pulsa Ejecutar para mostrar el piano.</p>
        ) : <Plot drawing={shownDrawing} count={count} onPick={phase === "click" ? resumeClick : undefined}
          target={showTarget && !treasure ? target ?? null : null}
          pickLabels={Boolean(treasure)} />}
      </div>
      {treasure ? (
        <div className="kl-treasure-feedback">
          {treasure.places.length > 0 && !raster && !spatial && (
            <div className="kl-lesson-actions" role="group" aria-label="Lugares del mapa">
              {treasure.places.map(({ at, text }, index) => (
                <button type="button" className="kl-secondary" key={index} aria-disabled={phase !== "click"}
                  onClick={() => { if (phase === "click") resumeClick(at.x, at.y); }}>{text}</button>
              ))}
            </div>
          )}
          <h3 className="kl-pane-title">Salida</h3>
          <pre className="kl-treasure-message" ref={treasureOutputRef} role="log" aria-label="Pistas y resultado">
            {treasure.messages.join("\n") || "Pulsa Ejecutar para dibujar el mapa."}
          </pre>
        </div>
      ) : <div className="kl-pane-foot">
        {onTurtleCommand && !spatial && !raster && (
          <div className="kl-turtle-pad" role="group" aria-label="Botones de la tortuga">
            {turtlePad.map(({ icon, command, label }) => (
              <button type="button" className="kl-secondary kl-tool" key={icon} aria-label={label}
                title={command ? `Añade ${command}` : label} disabled={editorLocked || phase !== "ready"}
                onClick={() => onTurtleCommand(command)}><ToolbarIcon name={icon} /></button>
            ))}
          </div>
        )}
        {target && !spatial && !raster && (
          <button type="button" className="kl-secondary kl-target-toggle" aria-pressed={showTarget}
            title={showTarget ? "Ocultar el dibujo objetivo" : "Ver en el lienzo el dibujo que pide el reto"}
            onClick={toggleTarget}><ToolbarIcon name="target" />Objetivo</button>
        )}
        {!spatial && raster && piano?.recordingState && (
          <div className="kl-lesson-actions" role="group" aria-label="Grabación del piano">
            <button type="button" className="kl-secondary" disabled={phase !== "key"}
              onClick={() => resumeKey("R")}>{piano.recording ? "Terminar grabación" : "Grabar"}</button>
            <button type="button" className="kl-secondary" disabled={phase !== "key" || piano.recording || piano.recordedNotes === 0}
              onClick={() => resumeKey("P")}>Reproducir</button>
          </div>
        )}
        <span className="kl-muted" role="status">
          {spatial
            ? spatialStatus
            : raster && piano?.recordingState
            ? `${piano.recording ? "Grabando · " : piano.replaying ? "Reproduciendo · " : ""}${piano.recordedNotes} ${piano.recordedNotes === 1 ? "nota grabada" : "notas grabadas"}`
            : raster && piano?.keys.length > 0 ? "Toca una tecla del lienzo o usa el teclado."
            : raster
            ? `${raster.rows.filter(Boolean).length} de ${raster.height} filas dibujadas`
            : hasDrawing ? `${animating ? "Dibujando · " : ""}${count} ${count === 1 ? "trazo" : "trazos"}` : "Sin trazos"}
        </span>
        {!spatial && raster && canZoom && (
          <span id="klogo-zoom-instructions" className="kl-muted">Arrastra para ampliar una región.</span>
        )}
      </div>}
    </section>
  );
}
