import { useId, useLayoutEffect, useRef, useState } from "react";
import { lessons } from "./lessons.js";
import { challenges } from "./challenges.js";
import { lessonSolutions } from "./lesson-solutions.js";
import { LessonPractice } from "./LessonPractice.jsx";
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
