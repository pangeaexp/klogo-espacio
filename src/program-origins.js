// Where a program comes from: the key of a lesson, project, open challenge,
// example or the treasure map, as the Ejemplo menu uses it.
import { lessons } from "./lessons.js";
import { getProjectChallenge, projects } from "./projects.js";
import { treasureProject, treasureTitle } from "./treasure-project.js";

// Name of a program that comes from the gallery.
export function galleryProgramName(key, otherExamples) {
  const challenge = getProjectChallenge(key);
  return projects[key]?.name ?? (challenge && `Reto abierto · ${challenge.name}`) ?? otherExamples[key]?.name;
}

// Name of any origin, or undefined when it is not known.
export function originName(key, otherExamples) {
  if (!key) return undefined;
  if (key === treasureProject) return `Proyecto libre · ${treasureTitle}`;
  return lessons[key]?.name ?? galleryProgramName(key, otherExamples);
}

// Lower case without accents, to search in Spanish names.
export const searchText = text => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");

// Saved programs in the chosen order, keeping those whose name or origin
// contains the search. `named` pairs each one with its origin's name.
export function arrangePrograms(named, query, sort) {
  const words = searchText(query).split(/\s+/).filter(Boolean);
  const byName = (a, b) => a.program.name.localeCompare(b.program.name, "es");
  const byDate = (a, b) => b.program.savedAt - a.program.savedAt;
  const compare = {
    recent: (a, b) => byDate(a, b) || byName(a, b),
    name: (a, b) => byName(a, b) || byDate(a, b),
    // Programs with a known origin first, grouped by it; the newest first inside.
    origin: (a, b) => (!a.origin - !b.origin) || (a.origin ?? "").localeCompare(b.origin ?? "", "es") || byDate(a, b),
  }[sort];
  return named
    .filter(({ program, origin }) => {
      const text = searchText(`${program.name} ${origin ?? ""}`);
      return words.every(word => text.includes(word));
    })
    .sort(compare);
}
