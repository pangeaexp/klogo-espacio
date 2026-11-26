import { useEffect, useRef } from "react";
import { RasterPlot } from "./RasterPlot.jsx";

const tickMilliseconds = 140;
const keyActions = new Map([
  ["ArrowLeft", "IZQUIERDA"],
  ["ArrowRight", "DERECHA"],
  [" ", "TIRO"],
]);
const reportPattern = /^PATRULLA (\d+) (\d+) (\d+) (ACTIVA|VICTORIA|DERROTA)$/;

export function PatrolBoard({ active, waiting, raster, lines, note, onTick }) {
  const controls = useRef(null);
  const held = useRef(new Set());
  const queued = useRef({ direction: "", fire: false });
  const report = lines.findLast(line => reportPattern.test(line))?.match(reportPattern);

  useEffect(() => {
    if (active) {
      controls.current?.focus({ preventScroll: true });
    } else {
      held.current.clear();
      queued.current = { direction: "", fire: false };
    }
  }, [active]);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => {
      const keys = Array.from(held.current);
      const direction = queued.current.direction
        || keys.findLast(action => action !== "TIRO") || "";
      const fire = queued.current.fire || held.current.has("TIRO");
      queued.current = { direction: "", fire: false };
      onTick((direction + (fire ? "TIRO" : "")) || "ESPERA");
    }, tickMilliseconds);
    return () => window.clearTimeout(timer);
  }, [waiting, onTick]);

  function queue(action) {
    if (action === "TIRO") {
      queued.current.fire = true;
    } else {
      queued.current.direction = action;
    }
  }

  function keyDown(event) {
    const action = keyActions.get(event.key);
    if (!active || !action || (action === "TIRO" && event.target.closest("button"))) return;
    event.preventDefault();
    if (event.repeat) return;
    held.current.add(action);
    queue(action);
  }

  function keyUp(event) {
    held.current.delete(keyActions.get(event.key));
  }

  const result = note || {
    VICTORIA: "¡Estación a salvo!",
    DERROTA: "La estación se quedó sin energía.",
  }[report?.[4]];

  return (
    <section className="kl-pane" aria-labelledby="klogo-patrol">
      <div className="kl-pane-head">
        <h2 id="klogo-patrol" className="kl-pane-title">Patrulla orbital</h2>
        {report && (
          <div className="kl-patrol-score kl-muted" role="status">
            <span>Oleada {report[1]}</span>
            <span>Interceptados: {report[2]}</span>
            <span>Energía: {report[3]}</span>
          </div>
        )}
      </div>
      <div className="kl-plot-box kl-patrol-field">
        {raster ? <RasterPlot raster={raster} /> : <p>Pulsa Ejecutar para iniciar la patrulla.</p>}
        {result && <p className="kl-patrol-result" role="status">{result}</p>}
      </div>
      <div
        className="kl-pane-foot kl-patrol-controls"
        ref={controls}
        role="group"
        aria-label="Controles de vuelo"
        aria-describedby="klogo-patrol-help"
        tabIndex={active ? 0 : -1}
        onKeyDown={keyDown}
        onKeyUp={keyUp}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) held.current.clear();
        }}
      >
        <span id="klogo-patrol-help" className="kl-muted">Defiende la estación. Usa ← → y Espacio.</span>
        <div className="kl-patrol-buttons">
          <button type="button" className="kl-run" disabled={!active} aria-label="Mover a la izquierda"
            onClick={() => queue("IZQUIERDA")}>←</button>
          <button type="button" className="kl-run" disabled={!active} aria-label="Mover a la derecha"
            onClick={() => queue("DERECHA")}>→</button>
          <button type="button" className="kl-run" disabled={!active}
            onClick={() => queue("TIRO")}>Disparar</button>
        </div>
      </div>
    </section>
  );
}
