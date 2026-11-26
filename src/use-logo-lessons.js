import { useEffect, useMemo, useRef, useState } from "react";
import { challenges, checkChallenge } from "./challenges.js";
import { locateChallengeHints } from "./challenge-hints.js";
import { challengeTargets } from "./challenge-targets.js";
import { defaultFileName } from "./draft.js";
import { lessons } from "./lessons.js";
import { loadProgress, mergeStoredProgress, saveProgress } from "./progress.js";
import { getProjectChallenge, projectChallengePrefix, projects } from "./projects.js";
import { restoreTrack, saveTrack, showsTurtlePad, trackById, trackOptionPrefix } from "./tracks.js";
import { treasureProject } from "./treasure-project.js";

const lessonKeys = Object.keys(lessons);

// The hands-on practice shown above a Primeros pasos challenge (LessonNav.jsx).
const firstStepsPractices = { bucles: "bucles", poligonos: "poligonos", rosetaColores: "tintas" };

export function useLogoLessons({
  draft, source, sourceLines, otherExamples, treasureMap, phase, drawing, raster, diagnostic,
  onSelect, onTrackTextSize, onHintLine, onContinue, onOpenGallery, progressStore = null,
}) {
  const [example, setExample] = useState(draft?.example ?? "roseta");
  const [lesson, setLesson] = useState(draft?.lesson ?? "");
  const [trackId, setTrackId] = useState(restoreTrack);
  const [projectRunSource, setProjectRunSource] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  // Seeing the drawing is a hint too: Objetivo appears with the first hint of
  // the open lesson (or once its challenge is met) and stays until it changes.
  const [targetUnlocked, setTargetUnlocked] = useState(false);
  const [{ storage: progressStorage, done: initialDone }] = useState(() => loadProgress(lessonKeys));
  const [doneLessons, setDoneLessons] = useState(initialDone);
  // What the program in the editor was last loaded from, kept while it is
  // edited, so that Mis programas can say where a saved program comes from.
  const [origin, setOrigin] = useState(() => (draft ? draft.lesson || draft.example || "" : "roseta"));

  const track = trackById(trackId);
  const trackKeys = track.lessons;
  const projectChallenge = getProjectChallenge(example);
  const isTreasure = example === treasureProject && Boolean(treasureMap);
  const draftExample = example === "eliza" || isTreasure || projectChallenge ? example : undefined;

  // The menu lists the lessons of the path, and the open one if it is not in it.
  let lessonOptions = trackKeys;
  const openCatalogueIndex = lessonKeys.indexOf(lesson);
  if (openCatalogueIndex >= 0 && !trackKeys.includes(lesson)) {
    // Include a lesson opened from the library or the Aula without sorting the path again.
    const next = trackKeys.findIndex(key => lessonKeys.indexOf(key) > openCatalogueIndex);
    lessonOptions = [...trackKeys];
    lessonOptions.splice(next === -1 ? trackKeys.length : next, 0, lesson);
  }
  const lessonIndex = isTreasure ? -1 : trackKeys.indexOf(lesson);
  const previousLesson = isTreasure ? trackKeys.at(-1) : lessonIndex > 0 ? trackKeys[lessonIndex - 1] : null;
  const nextLesson = isTreasure ? { key: null, label: "Siguiente", title: "No hay más lecciones" }
    : lessonIndex < 0 ? { key: trackKeys[0], label: "Empezar lecciones", title: "Empezar lecciones" }
    : lessonIndex < trackKeys.length - 1 ? { key: trackKeys[lessonIndex + 1], label: "Siguiente", title: "Lección siguiente" }
    : treasureMap ? { key: treasureProject, label: "Proyecto libre", title: "Proyecto libre" }
    : { key: null, label: "Siguiente", title: "No hay más lecciones" };

  function chooseTrack(id) {
    const chosen = trackById(id);
    setTrackId(chosen.id);
    saveTrack(chosen.id);
    if (chosen.textSize) onTrackTextSize(chosen.textSize);
    if (!chosen.lessons.includes(lesson)) loadExample(chosen.lessons[0]);
  }

  function loadExample(chosen) {
    if (chosen.startsWith(trackOptionPrefix)) {
      chooseTrack(chosen.slice(trackOptionPrefix.length));
      return;
    }
    setHintLevel(0);
    setTargetUnlocked(false);
    setExample(chosen);
    setOrigin(chosen);
    setLesson(lessons[chosen] ? chosen : "");
    const openChallenge = getProjectChallenge(chosen);
    const program = chosen === treasureProject ? { source: treasureMap }
      : lessons[chosen] ?? otherExamples[chosen] ?? projects[chosen] ?? openChallenge;
    const name = openChallenge ? `${chosen.slice(projectChallengePrefix.length)}-reto.logo`
      : chosen === treasureProject || projects[chosen] ? `${chosen}.logo` : defaultFileName;
    if (program) setProjectRunSource(null);
    onSelect(chosen, program, name);
  }

  function selectOwnProgram(project) {
    setHintLevel(0);
    setTargetUnlocked(false);
    setExample(project);
    setOrigin(project);
    setLesson("");
  }

  function noteProgramEdit() {
    if (example !== "orbital" && !draftExample) setExample("");
  }

  function noteProgramRun(program) {
    if (projectChallenge) setProjectRunSource(program);
  }

  // Lesson challenges can finish while the program waits for input. An open
  // challenge is decided after running the current draft to completion.
  const challenge = challenges[lesson] ?? projectChallenge;
  const challengeKey = projectChallenge ? example : lesson;
  const idle = projectChallenge ? phase === "ready" && projectRunSource === source
    : ["ready", "key", "input", "click"].includes(phase);
  const challengeResult = useMemo(
    () => (challenge && idle && drawing && !diagnostic
      ? checkChallenge(challengeKey, {
        drawing,
        raster,
        prints: drawing.events.filter(event => event.type === "print").map(event => event.text),
      })
      : null),
    [challenge, idle, drawing, raster, diagnostic, challengeKey],
  );

  const celebrationAction = projectChallenge
    ? { label: "Galería", accessibleLabel: "Volver a la galería", onClick: () => onOpenGallery() }
    : nextLesson.key ? { label: nextLesson.label, accessibleLabel: nextLesson.title, onClick: () => onContinue(nextLesson.key) } : null;

  const hints = useMemo(() => locateChallengeHints(lesson, sourceLines), [lesson, sourceLines]);
  const hintLines = challengeResult === true ? [] : [...new Set(
    hints.slice(0, hintLevel).map(hint => hint.line).filter(line => line !== null),
  )];

  function advanceHint() {
    const next = hintLevel === hints.length ? 0 : hintLevel + 1;
    setHintLevel(next);
    if (next > 0) setTargetUnlocked(true);
    const line = hints[next - 1]?.line;
    if (line) onHintLine(line);
  }

  useEffect(() => {
    if (!lesson || challengeResult !== true) return;
    setHintLevel(0);
    if (doneLessons.includes(lesson)) return;
    const done = lessonKeys.filter(key => key === lesson || doneLessons.includes(key));
    setDoneLessons(done);
    saveProgress(progressStorage, done);
    progressStore?.add([lesson]);
  }, [challengeResult, lesson, doneLessons, progressStorage]);

  // On Mis programas the progress also lives in the `progreso` LiveStore:
  // joined with this visit's when it opens, then kept in step both ways.
  const storeReady = Boolean(progressStore?.ready);
  const storedKey = storeReady ? progressStore.done.join(",") : null;
  const seenStored = useRef(null);
  useEffect(() => {
    if (!storeReady || seenStored.current?.join(",") === storedKey) return;
    const { next, add } = mergeStoredProgress({
      local: doneLessons, stored: progressStore.done, previous: seenStored.current, lessonKeys,
    });
    seenStored.current = progressStore.done;
    if (add.length) progressStore.add(add);
    if (next.join(",") !== doneLessons.join(",")) {
      setDoneLessons(next);
      saveProgress(progressStorage, next);
    }
  }, [storeReady, storedKey, doneLessons, progressStorage]);

  function resetProgress() {
    setDoneLessons([]);
    saveProgress(progressStorage, []);
    progressStore?.clear();
  }

  return {
    example, lesson, origin, setOrigin, isTreasure, projectChallenge, challengeResult, celebrationAction, hintLines,
    reloadTarget: lesson || example || null,
    drawingTarget: lesson && (targetUnlocked || doneLessons.includes(lesson)) ? challengeTargets[lesson] : undefined,
    showTurtlePad: showsTurtlePad(track.id, lesson),
    draftExample, loadExample, selectOwnProgram, noteProgramEdit, noteProgramRun,
    clearProjectRun: () => setProjectRunSource(null),
    picker: {
      example, track, lessonIndex, lessonOptions, previousLesson, nextLesson, loadExample, otherExamples, treasureMap,
      doneLessons, onOpenGallery,
    },
    lessonPanel: {
      lesson, trackLessons: trackKeys, doneLessons,
      practice: track.id === "primeros" ? firstStepsPractices[lesson] ?? null : null,
      progressSaved: Boolean(progressStorage) || Boolean(storeReady && progressStore.canEdit),
      challengeResult, hasError: Boolean(diagnostic), onResetProgress: resetProgress,
      hints, hintLevel, onHint: advanceHint, celebrationAction,
    },
  };
}
