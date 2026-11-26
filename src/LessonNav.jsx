import { useId, useLayoutEffect, useRef, useState } from "react";
import { lessons } from "./lessons.js";
import { challenges } from "./challenges.js";
import { lessonSolutions } from "./lesson-solutions.js";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { galleryProgramName } from "./program-origins.js";
import { groupByUnit } from "./lesson-units.js";
import { trackOptionPrefix, tracks } from "./tracks.js";
import { treasureProject, treasureTitle } from "./treasure-project.js";

export const challengeSuccessMessage = "✓ ¡Reto superado!";

export function ChallengeStatus({ message, celebrate, action }) {
  return (
    <div className="kl-challenge-result" data-celebrate={celebrate} hidden={!message}>
      <p className="kl-challenge-status" role="status">{message}</p>
      {celebrate && action && (
        <button type="button" className="kl-secondary kl-challenge-next" aria-label={action.accessibleLabel} onClick={action.onClick}>
          {action.label} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

function SolutionHint({ solution }) {
  const [state, setState] = useState("closed");
  const focusTarget = useRef(null);
  const interacted = useRef(false);
  useLayoutEffect(() => {
    if (interacted.current) focusTarget.current?.focus({ preventScroll: true });
  }, [state]);
  function changeState(next) {
    interacted.current = true;
    setState(next);
  }
  return (
    <div className="kl-solution-hint">
      {state === "closed" && <button type="button" className="kl-secondary" ref={focusTarget}
        onClick={() => changeState("confirm")}>Ver tercera pista</button>}
      {state === "confirm" && (
        <div className="kl-solution-actions" role="group" aria-label="Confirmar la tercera pista">
          <p>¿Seguro? La tercera pista muestra una solución completa.</p>
          <button type="button" className="kl-secondary" onClick={() => changeState("shown")}>Sí, ver solución</button>
          <button type="button" className="kl-secondary" ref={focusTarget} onClick={() => changeState("closed")}>Seguir intentando</button>
        </div>
      )}
      {state === "shown" && (
        <>
          <strong>Pista 3 · Solución comentada</strong>
          <pre tabIndex={0} aria-label="Solución comentada" ref={focusTarget}><code>{solution}</code></pre>
          <button type="button" className="kl-secondary" onClick={() => changeState("closed")}>Ocultar solución</button>
        </>
      )}
    </div>
  );
}

// Short hands-on practices above some Primeros pasos challenges (see
// `practices` in use-logo-lessons.js). They never touch the program or the
// progress: they only show the idea the challenge needs.
const turnPractices = {
  bucles: {
    title: "Práctica · Reparte una vuelta",
    intro: "Una vuelta completa son 360°. En el cuadrado y el triángulo equilátero, la tortuga gira lo mismo en cada esquina para mirar hacia el lado siguiente.",
    shapes: [[4, "Cuadrado"], [3, "Triángulo equilátero"]],
  },
  poligonos: {
    title: "Práctica · Más lados, giros más pequeños",
    intro: "En una figura de lados iguales, la tortuga da una vuelta completa, 360°, repartida en tantos giros como lados. Con más lados, cada giro es más pequeño.",
    shapes: [[5, "Pentágono"], [6, "Hexágono"], [8, "Octágono"]],
  },
};

function TurnPractice({ title, intro, shapes }) {
  const [turnsInCircle, setTurnsInCircle] = useState(shapes[0][0]);
  const [turns, setTurns] = useState(0);
  const angle = 360 / turnsInCircle;
  const total = turns * angle;
  const complete = turns === turnsInCircle;

  return (
    <details className="kl-turn-practice">
      <summary>{title}</summary>
      <p>{intro}</p>
      <div className="kl-turn-practice-body">
        <div className="kl-turn-dial" aria-hidden="true" style={{ "--sector": `${angle}deg`, "--turned": `${total}deg` }}>
          <span className="kl-turn-needle" />
        </div>
        <div className="kl-turn-controls">
          <label>Figura
            <select value={turnsInCircle} onChange={event => {
              setTurnsInCircle(Number(event.target.value));
              setTurns(0);
            }}>
              {shapes.map(([sides, name]) => <option key={sides} value={sides}>{name}</option>)}
            </select>
          </label>
          <p><strong>360° ÷ {turnsInCircle} = {angle}°</strong> en cada esquina.</p>
          <button type="button" className="kl-secondary" onClick={() => setTurns(complete ? 0 : turns + 1)}>
            {complete ? "Reiniciar giros" : `Girar ${angle}°`}
          </button>
          <p role="status">{turns} de {turnsInCircle} giros · {total}° en total.
            {complete && " La tortuga vuelve a mirar en la dirección inicial."}</p>
        </div>
      </div>
    </details>
  );
}

// The inks of «Colores · Roseta de tres tintas», in the lesson's order, and a
// fourth one to try what the challenge asks.
const inks = [["#ffb454", "naranja"], ["#76f2bf", "turquesa"], ["#c5a6ff", "lila"], ["#ff8a65", "coral"]];
const inkRounds = 12;

function InkPractice() {
  const [count, setCount] = useState(3);
  const [round, setRound] = useState(0);
  const used = inks.slice(0, count);
  const rest = round ? (round - 1) % count : null;
  const [color, colorName] = round ? used[rest] : [null, null];
  const done = round === inkRounds;
  return (
    <details className="kl-turn-practice kl-ink-practice">
      <summary>Práctica · Tintas que se repiten</summary>
      <p>CUENTAREP dice en qué vuelta va el bucle: 1, 2, 3… RESTO da lo que sobra al repartir entre las tintas, así que vuelve a 0 y las tintas se repiten en orden.</p>
      <div className="kl-turn-practice-body">
        <ol className="kl-ink-rounds" aria-label={`Vueltas pintadas: ${round} de ${inkRounds}`}>
          {Array.from({ length: inkRounds }, (_, index) => (
            <li key={index} style={index < round ? { background: used[index % count][0] } : undefined}
              title={index < round ? `Vuelta ${index + 1}: ${used[index % count][1]}` : `Vuelta ${index + 1}`} />
          ))}
        </ol>
        <div className="kl-turn-controls">
          <label>Tintas
            <select value={count} onChange={event => { setCount(Number(event.target.value)); setRound(0); }}>
              {[2, 3, 4].map(n => <option key={n} value={n}>{n}: {inks.slice(0, n).map(([, name]) => name).join(", ")}</option>)}
            </select>
          </label>
          <button type="button" className="kl-secondary" onClick={() => setRound(done ? 0 : round + 1)}>
            {done ? "Empezar de nuevo" : "Siguiente vuelta"}
          </button>
          <p role="status">{round === 0 ? "Pulsa «Siguiente vuelta» para empezar."
            : <>Vuelta {round}: <strong>RESTO ({round} − 1) {count} = {rest}</strong>, tinta {rest + 1} ·{" "}
              <span className="kl-ink-chip" style={{ background: color }} aria-hidden="true" /> {colorName}.</>}</p>
        </div>
      </div>
    </details>
  );
}

function LessonPractice({ practice }) {
  if (practice === "tintas") return <InkPractice />;
  const turns = turnPractices[practice];
  return turns ? <TurnPractice key={practice} {...turns} /> : null;
}

// The lesson's challenge in one line, under the editor title: the goal, the hint
// button, what the lesson teaches (ⓘ) and the progress chip. Moving between
// lessons and reloading the example live in the toolbar.
export function LessonNav({ lesson, trackLessons, doneLessons, progressSaved, challengeResult, hasError,
  onResetProgress, hints, hintLevel, onHint, celebrationAction, showChallengeStatus, practice = null }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const hintsId = useId();
  const summaryId = useId();
  const progressId = useId();
  if (!lessons[lesson]) return null;
  const challenge = challenges[lesson];
  const lessonDone = doneLessons.includes(lesson);
  const done = challengeResult === true || (challengeResult === null && lessonDone);
  // The invitation to try is left out: the goal already says what to do.
  const challengeMessage = !challenge ? ""
    : hasError ? "Corrige el error y vuelve a ejecutar."
    : challengeResult === true ? challengeSuccessMessage
    : typeof challengeResult === "string" ? `Todavía no: ${challengeResult}`
    : lessonDone ? "✓ Ya lo superaste. Puedes repetirlo."
    : "";
  const hintLabel = hintLevel === 0 ? "Dame una pista" : hintLevel < hints.length ? "Dame otra pista" : "Ocultar pistas";
  // Progress counts the lessons of the chosen path; resetting clears them all.
  const doneInTrack = doneLessons.filter(key => trackLessons.includes(key));
  const total = trackLessons.length;
  const progressText = `Retos superados: ${doneInTrack.length} de ${total}`;
  const units = groupByUnit(trackLessons);

  return (
    <div className="kl-lesson-nav" aria-label="Lección de Logo" role="group">
      <div className="kl-lesson-line">
        {practice && <LessonPractice practice={practice} />}
        {challenge ? (
          <section className="kl-challenge" aria-label="Reto" data-done={done}
            title={challenge.play ? "Pulsa Ejecutar y juega." : "Cambia el programa y pulsa Ejecutar."}>
            <div className="kl-challenge-main">
              <ToolbarIcon name="flag" />
              <p className="kl-challenge-goal"><span className="kl-sr-only">Reto: </span>{challenge.goal}</p>
              {hints.length > 0 && challengeResult !== true && (
                <button type="button" className="kl-secondary kl-tool kl-hint-button" onClick={onHint}
                  aria-label={hintLabel} title={hintLabel} aria-controls={hintsId} aria-expanded={hintLevel > 0}>
                  <ToolbarIcon name="hint" />
                </button>
              )}
            </div>
            {showChallengeStatus && <ChallengeStatus message={challengeMessage}
              celebrate={challengeResult === true} action={celebrationAction} />}
            <div aria-live="polite">
              <ol className="kl-challenge-hints" id={hintsId} hidden={hintLevel === 0}>
                {hints.slice(0, hintLevel).map(({ text, line }, index) => (
                  <li key={text}>
                    <strong>Pista {index + 1}</strong>
                    {line !== null && <span className="kl-hint-location"> · Línea {line}</span>}
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
              {hints.length === 2 && hintLevel === 2 && challengeResult !== true && lessonSolutions[lesson] && (
                <SolutionHint key={lesson} solution={lessonSolutions[lesson]} />
              )}
            </div>
          </section>
        ) : <span className="kl-challenge-spacer" />}
        <button type="button" className="kl-secondary kl-tool" aria-label="Qué enseña la lección"
          title="Qué enseña la lección" aria-expanded={showSummary} aria-controls={summaryId}
          onClick={() => setShowSummary(open => !open)}><ToolbarIcon name="info" /></button>
        <button type="button" className="kl-secondary kl-progress" aria-expanded={showProgress} aria-controls={progressId}
          title={progressSaved ? progressText : `${progressText} (solo en esta visita)`}
          onClick={() => { setShowProgress(open => !open); setConfirmReset(false); }}>
          <ToolbarIcon name="trophy" />
          <span aria-hidden="true">{doneInTrack.length}/{total}</span>
          <span className="kl-sr-only">{progressText}</span>
        </button>
      </div>
      <p className="kl-lesson-summary kl-muted" id={summaryId} hidden={!showSummary}>{lessons[lesson].outcome}</p>
      <div className="kl-progress-panel" id={progressId} hidden={!showProgress}>
        <span className="kl-progress-bar" aria-hidden="true">
          <span style={{ width: `${100 * doneInTrack.length / total}%` }} />
        </span>
        <span>{progressText}</span>
        {!progressSaved && <span className="kl-muted" title="Esta vista no puede guardarlo: se pierde al recargar.">(solo en esta visita)</span>}
        <ul className="kl-unit-progress" aria-label="Progreso por unidad">
          {units.map(unit => {
            const unitDone = unit.lessons.filter(key => doneLessons.includes(key)).length;
            const current = unit.lessons.includes(lesson);
            const complete = unitDone === unit.lessons.length;
            return (
              <li key={unit.id} data-current={current} data-complete={complete} aria-current={current ? "step" : undefined}>
                <span className="kl-unit-name">{complete ? "✓ " : ""}{unit.name}</span>
                <span className="kl-progress-bar" aria-hidden="true">
                  <span style={{ width: `${100 * unitDone / unit.lessons.length}%` }} />
                </span>
                <span className="kl-unit-count" aria-hidden="true">{unitDone}/{unit.lessons.length}</span>
                <span className="kl-sr-only">: {unitDone} de {unit.lessons.length}{current ? ", unidad de la lección abierta" : ""}</span>
              </li>
            );
          })}
        </ul>
        {doneLessons.length > 0 && (confirmReset ? (
          <span className="kl-progress-reset">
            <span>¿Borrar los {doneLessons.length} retos superados?</span>
            <button type="button" className="kl-secondary"
              onClick={() => { onResetProgress(); setConfirmReset(false); }}>Sí, borrar</button>
            <button type="button" className="kl-secondary" onClick={() => setConfirmReset(false)}>Cancelar</button>
          </span>
        ) : (
          <button type="button" className="kl-secondary kl-link-button" onClick={() => setConfirmReset(true)}>
            Reiniciar progreso</button>
        ))}
      </div>
    </div>
  );
}

// Select value that opens the gallery instead of loading a program.
const galleryOption = "galeria:";

export function LessonPicker({ example, track, lessonIndex, lessonOptions, previousLesson, nextLesson,
  loadExample, otherExamples, treasureMap, doneLessons, onOpenGallery, editorLocked }) {
  const trackKeys = track.lessons;
  const openFromGallery = galleryProgramName(example, otherExamples);
  return (
    <div className="kl-lesson-picker" role="group" aria-label="Navegación de lecciones">
      <button type="button" className="kl-secondary kl-tool" aria-label="Anterior" title="Lección anterior"
        disabled={editorLocked || !previousLesson} onClick={() => loadExample(previousLesson)}><ToolbarIcon name="prev" /></button>
      {lessonIndex >= 0 && (
        <span className="kl-lesson-position" title={`Lección ${lessonIndex + 1} de ${trackKeys.length} · ${track.name}`}>
          <span aria-hidden="true">{lessonIndex + 1}/{trackKeys.length}</span>
          <span className="kl-sr-only">Lección {lessonIndex + 1} de {trackKeys.length}, recorrido {track.name}</span>
        </span>
      )}
      <select aria-label="Ejemplo" value={example} disabled={editorLocked} onChange={event => {
        if (event.target.value === galleryOption) onOpenGallery(event.target);
        else loadExample(event.target.value);
      }}>
        <optgroup label="Recorrido">
          {tracks.map(option => (
            <option key={option.id} value={trackOptionPrefix + option.id}>
              {option.id === track.id ? "● " : ""}{option.name} · {option.ages}
            </option>
          ))}
        </optgroup>
        {groupByUnit(lessonOptions).map(unit => (
          <optgroup key={unit.id} label={unit.name}>
            {unit.lessons.map(key => (
              <option key={key} value={key}>{doneLessons.includes(key) ? "✓ " : ""}{lessons[key].name}</option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Más">
          {treasureMap && <option value={treasureProject}>Proyecto libre · {treasureTitle}</option>}
          {openFromGallery && <option value={example}>{openFromGallery}</option>}
          <option value={galleryOption}>Más programas…</option>
          <option value="">Programa propio</option>
        </optgroup>
      </select>
      <button type="button" className="kl-secondary kl-tool" aria-label={nextLesson.label} title={nextLesson.title}
        disabled={editorLocked || !nextLesson.key} onClick={() => loadExample(nextLesson.key)}><ToolbarIcon name="next" /></button>
    </div>
  );
}
