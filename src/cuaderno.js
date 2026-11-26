// A student's notebook in the `cuadernos` LiveStore: one row per visitor of
// the Aula's web link (the row's id is the visitor's), with six program slots
// and the lessons met. A store `text` holds at most 4096 bytes, so each slot
// keeps one program in its own fields: n<i> name, p<i> source, o<i> origin,
// s<i> savedAt. Nothing here talks to Kunobi; cuaderno-store.js does.
export const SLOTS = 6;
export const MAX_TEXT_BYTES = 4096;

const encoder = new TextEncoder();
export const textBytes = text => encoder.encode(text ?? "").length;

const slotIds = Array.from({ length: SLOTS }, (_, index) => `h${index + 1}`);
const slotNumber = id => {
  const n = Number(/^h(\d+)$/.exec(id)?.[1]);
  return n >= 1 && n <= SLOTS ? n : null;
};

export function emptyRow() {
  const row = { nombre: "", progreso: "[]", t: 0 };
  for (let i = 1; i <= SLOTS; i++) Object.assign(row, { [`n${i}`]: "", [`p${i}`]: "", [`o${i}`]: "", [`s${i}`]: 0 });
  return row;
}

// The saved programs as ProgramLibrary lists them: [[slotId, program]].
export function rowPrograms(row) {
  if (!row) return [];
  return slotIds.flatMap((id, index) => {
    const i = index + 1;
    const name = row[`n${i}`];
    if (!name) return [];
    return [[id, { name, source: row[`p${i}`] ?? "", savedAt: row[`s${i}`] ?? 0, ...(row[`o${i}`] && { origin: row[`o${i}`] }) }]];
  });
}

export const freeSlot = row => slotIds.find((id, index) => !row?.[`n${index + 1}`]) ?? null;

// Why a program cannot go in a slot, or null when it can.
export function programProblem(program) {
  if (textBytes(program.source) > MAX_TEXT_BYTES) return "too-big";
  if (textBytes(program.name) > MAX_TEXT_BYTES || textBytes(program.origin) > MAX_TEXT_BYTES) return "too-big";
  return null;
}

// The fields to write in the row for each change; slot ids come from rowPrograms.
export function slotFields(id, program) {
  const i = slotNumber(id);
  if (!i) throw new Error(`Hueco desconocido: ${id}`);
  return program
    ? { [`n${i}`]: program.name, [`p${i}`]: program.source, [`o${i}`]: program.origin ?? "", [`s${i}`]: program.savedAt }
    : { [`n${i}`]: "", [`p${i}`]: "", [`o${i}`]: "", [`s${i}`]: 0 };
}

export function renameFields(id, name) {
  const i = slotNumber(id);
  if (!i) throw new Error(`Hueco desconocido: ${id}`);
  return { [`n${i}`]: name };
}

// The lessons met, kept as a JSON list in `progreso`.
export function rowProgress(row) {
  try {
    const list = JSON.parse(row?.progreso ?? "[]");
    return Array.isArray(list) ? list.filter(key => typeof key === "string") : [];
  } catch {
    return [];
  }
}

export const progressField = keys => ({ progreso: JSON.stringify([...new Set(keys)]) });

// The notebooks the person sees in the Aula: one entry per row, by name
// (rows without a name, «Sin nombre», last), then by last activity.
export function notebookSummaries(alumnos) {
  return Object.entries(alumnos ?? {})
    .map(([id, row]) => ({
      id,
      name: (row?.nombre ?? "").trim(),
      programs: rowPrograms(row).map(([slot, program]) => ({ slot, ...program })),
      done: rowProgress(row).length,
      t: row?.t ?? 0,
    }))
    .sort((a, b) => (!a.name - !b.name) || a.name.localeCompare(b.name, "es", { sensitivity: "base" }) || b.t - a.t);
}

// All the programs of a notebook as one text to copy and keep: a header,
// then each program under a comment line with its name (Logo comments, so
// a piece pasted in the editor still runs).
export function notebookText(entries, date = new Date()) {
  const day = new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
  const parts = entries.map(([, program], index) =>
    `; ===== ${index + 1}. ${program.name} =====\n${(program.source ?? "").replace(/\s+$/, "")}\n`);
  return [`; Mi cuaderno de KLogo, copiado el ${day}`,
    "; Para recuperar un programa, pégalo en el editor y guárdalo.", "", ...parts].join("\n");
}

// Every notebook of the class as one text, for the teacher to keep a copy:
// each notebook under a line with its student, then its programs as
// notebookText writes them (Logo comments, so a piece pasted still runs).
// Notebooks with the same name (the same student in another browser, or two
// students): each one's name, once, in the list's order.
export function repeatedNames(notebooks) {
  const counts = new Map();
  for (const { name } of notebooks) if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].filter(([, n]) => n > 1).map(([name, n]) => ({ name, count: n }));
}

const lastTimeFormat = new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" });

export function classNotebooksText(notebooks, date = new Date()) {
  const day = new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const parts = notebooks.map(notebook => {
    // The last time tells apart two notebooks with the same name.
    const last = notebook.t ? ` · última vez ${lastTimeFormat.format(notebook.t)}` : "";
    const header = `; ##### ${notebook.name || "Sin nombre"} · ${count(notebook.programs.length, "programa", "programas")}`
      + ` · ${count(notebook.done, "reto", "retos")}${last} #####`;
    const programs = notebook.programs.map((program, index) =>
      `; ===== ${index + 1}. ${program.name} =====\n${(program.source ?? "").replace(/\s+$/, "")}\n`);
    return [header, ...programs].join("\n");
  });
  return [`; Cuadernos de la clase en KLogo, copiados el ${day}`,
    `; ${count(notebooks.length, "cuaderno", "cuadernos")}. Para recuperar un programa, pégalo en el editor y guárdalo.`, "",
    ...parts.map(part => part + "\n")].join("\n");
}
