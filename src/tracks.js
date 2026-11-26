// Learning paths by age. Programador follows the catalogue order. The chosen
// path is remembered where local storage exists (not in the web viewer).
import { lessons } from "./lessons.js";

const allLessons = Object.keys(lessons);

const turtleBasics = ["tortuga", "bucles", "poligonos"];
const colorAndTrace = ["grosores", "rotulos", "relleno", "arcos", "rosetaColores"];
const numeration = ["cuentaLasHuellas", "saltaEnLaRecta", "paquetesDeDiez", "mismasCifras"];

const firstSteps = [...turtleBasics, ...colorAndTrace, ...numeration, "baliza", "melodia", "piano"];
const explorer = [
  ...turtleBasics, "variables", "aleatorio", "argumentos", "desde",
  ...colorAndTrace, "art",
  ...numeration,
  "recursion", "devuelve", "circulo", "rosa",
  "baliza", "clics", "melodia", "piano",
  "cubo3d", "fractales",
];

export const tracks = [
  { id: "primeros", name: "Primeros pasos", ages: "6–9 años", lessons: firstSteps, textSize: 1.15 },
  { id: "explorador", name: "Explorador", ages: "10–14 años", lessons: explorer },
  { id: "programador", name: "Programador", ages: "15 años o más", lessons: allLessons },
];

export const defaultTrack = "programador";
export const trackById = id => tracks.find(track => track.id === id) ?? tracks.find(track => track.id === defaultTrack);

// Drawing lessons of Primeros pasos that show the turtle pad. The first
// lesson shows it in every path.
const padLessons = ["tortuga", "bucles", "poligonos", "rosetaColores", "grosores", "rotulos", "arcos", "relleno"];
export const showsTurtlePad = (trackId, lesson) =>
  lesson === "tortuga" || (trackId === "primeros" && padLessons.includes(lesson));

// Select values for the paths, next to the lesson ids in the Ejemplo menu.
export const trackOptionPrefix = "recorrido:";

const trackStorageKey = "klogo.track.v1";

export function restoreTrack() {
  try {
    const saved = window.localStorage.getItem(trackStorageKey);
    if (tracks.some(track => track.id === saved)) return saved;
  } catch {
    // The web viewer blocks local storage: start with the default path.
  }
  return defaultTrack;
}

export function saveTrack(id) {
  try {
    window.localStorage.setItem(trackStorageKey, id);
  } catch {
    // Not kept between visits when storage is unavailable.
  }
}
