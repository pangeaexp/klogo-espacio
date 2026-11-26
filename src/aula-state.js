// The Aula room's state, as pure functions: who is in the class, what each
// student shows the teacher, and what the host may clean up. The page reads
// and writes the room in AulaPanel.jsx.
//
// Keys (rules in aula.mdx): `clase` is the host's; `alumno.<id>`,
// `mano.<id>` and `entrega.<id>` are each participant's own.
import { lessons } from "./lessons.js";
import { defaultFileName } from "./draft.js";

export const roomName = "aula";
export const maxName = 40;
const ownPrefixes = ["alumno.", "mano.", "entrega."];

export const cleanName = name => name.replace(/\s+/g, " ").trim().slice(0, maxName);

export function newClass(hostId, now = Date.now()) {
  return { id: now.toString(36) + Math.random().toString(36).slice(2, 6), anfitrion: hostId, t: now };
}

// What the host sends to the whole class rides in `clase.envio`, so that it
// stays one key under the host rule. A room operation holds 8 KB at most.
export const maxProgramBytes = 6000;
const byteLength = text => new TextEncoder().encode(text).length;

export function sendLesson(clase, lessonKey, now = Date.now()) {
  if (!lessons[lessonKey]) return { error: "Abre una lección para enviarla." };
  return { clase: { ...clase, envio: { id: now.toString(36), tipo: "leccion", leccion: lessonKey, t: now } } };
}

function programError(source) {
  if (!source.trim()) return "El editor está vacío.";
  if (byteLength(source) > maxProgramBytes) return `El programa es demasiado largo para el aula (máximo ${maxProgramBytes / 1000} KB).`;
  return null;
}

// `origin` is the key of the lesson, project or example the program came
// from (as KLogo keeps it), and `originLabel` its name: a program still
// called programa.logo goes out with that name, and students who open it
// keep the origin when they save it.
export function sendProgram(clase, source, name, now = Date.now(), { lesson = "", origin = "", originLabel = "" } = {}) {
  const error = programError(source);
  if (error) return { error };
  const key = lesson || origin || "";
  return { clase: { ...clase, envio: { id: now.toString(36), tipo: "programa", programa: source,
    nombre: deliveryName(name, lesson, originLabel), ...(key && { origen: key }), t: now } } };
}

// A student's delivery: the program in their editor, for the teacher. A
// program still called programa.logo takes the name of its lesson, or of
// where it came from, so that the teacher can tell deliveries apart.
export function deliveryEntry({ classId, source, name, lesson, origin = "", now = Date.now() }) {
  const error = programError(source);
  if (error) return { error };
  return { entrega: { clase: classId, programa: source, nombre: deliveryName(name, lesson, origin), leccion: lesson || "", t: now } };
}

export function deliveryName(name, lesson, origin = "") {
  if (name && name !== defaultFileName) return cleanName(name);
  const label = lessons[lesson]?.name || cleanName(origin || "");
  return label ? `${label.slice(0, maxName - ".logo".length).trim()}.logo` : defaultFileName;
}

// The teacher passes a student's delivery on to the whole class.
export function forwardDelivery(clase, delivery, studentName, now = Date.now()) {
  return sendProgram(clase, delivery.programa, `${cleanName(studentName)} · ${delivery.nombre}`, now, { origin: delivery.leccion || "" });
}

// How a student sees what was sent, or null when there is nothing to open.
export function describeSend(envio) {
  if (envio?.tipo === "leccion" && lessons[envio.leccion]) return { kind: "lesson", title: lessons[envio.leccion].name };
  if (envio?.tipo === "programa" && typeof envio.programa === "string") return { kind: "program", title: envio.nombre || "programa.logo" };
  return null;
}

// Who may write: participants who are not spectators.
export function presentIds(participants) {
  return new Set((participants ?? []).filter(p => p.role !== "reader").map(p => p.id));
}

// What a student shows the teacher. Progress only lasts the visit, so the
// lessons already shown in this class are kept after a reload. Outside a
// lesson, `programa` (the file name) and `origen` (the name of the lesson,
// project or example it came from) say what the student is working on.
export const maxOriginName = 80;

export function studentEntry({ classId, name, lesson, done, previous, program = "", origin = "" }) {
  const shown = previous?.clase === classId ? previous.hechas ?? [] : [];
  const hechas = Object.keys(lessons).filter(key => done.includes(key) || shown.includes(key));
  return { clase: classId, nombre: cleanName(name), leccion: lesson || "", hechas,
    programa: cleanName(program || ""), origen: cleanName(origin || "").slice(0, maxOriginName) };
}

export function sameEntry(a, b) {
  return Boolean(a && b) && a.clase === b.clase && a.nombre === b.nombre && a.leccion === b.leccion
    && (a.programa ?? "") === (b.programa ?? "") && (a.origen ?? "") === (b.origen ?? "")
    && a.hechas.length === b.hechas.length && a.hechas.every((key, index) => b.hechas[index] === key);
}

// What the teacher reads in the list: the lesson, or else the program and
// where it came from («Mi casa · de Bucles · Cuadrado»).
export function activityName(entry) {
  const lesson = lessons[entry?.leccion]?.name;
  if (lesson) return lesson;
  const file = entry?.programa && entry.programa !== defaultFileName ? entry.programa.replace(/\.logo$/i, "") : "";
  const origin = entry?.origen ?? "";
  if (file && origin) return `${file} · de ${origin}`;
  return file || origin || "Programa propio";
}

// The students of this class who are in the room now, by name. With
// `includeAbsent`, also those who left (for the class summary).
export function classRoster(state, participants, classId, { includeAbsent = false } = {}) {
  if (!classId) return [];
  const present = presentIds(participants);
  const self = (participants ?? []).find(p => p.self)?.id;
  return Object.entries(state ?? {})
    .filter(([key, entry]) => key.startsWith("alumno.") && entry?.clase === classId)
    .map(([key, entry]) => {
      const id = key.slice("alumno.".length);
      const hand = state[`mano.${id}`];
      const delivery = state[`entrega.${id}`];
      return {
        id,
        name: entry.nombre || "Sin nombre",
        lesson: entry.leccion || "",
        lessonName: activityName(entry),
        done: entry.hechas?.length ?? 0,
        doneKeys: entry.hechas ?? [],
        hand: Boolean(hand && hand.clase === classId),
        handAt: hand?.t ?? 0,
        delivery: delivery?.clase === classId && typeof delivery.programa === "string" ? delivery : null,
        self: id === self,
        present: present.has(id),
      };
    })
    .filter(student => includeAbsent || student.present)
    .sort((a, b) => a.name.localeCompare(b.name, "es") || a.id.localeCompare(b.id));
}

// Raised hands first, oldest first.
export function handsFirst(roster) {
  return [...roster].sort((a, b) => (b.hand - a.hand) || (a.hand && b.hand ? a.handAt - b.handAt : 0));
}

// Entries the host may delete: those of people who left, and of other classes.
export function staleKeys(state, participants, classId) {
  const present = presentIds(participants);
  return Object.entries(state ?? {})
    .filter(([key]) => ownPrefixes.some(prefix => key.startsWith(prefix)))
    .filter(([key, entry]) => {
      const id = key.slice(key.indexOf(".") + 1);
      return !present.has(id) || entry?.clase !== classId;
    })
    .map(([key]) => key);
}

export const roomMessages = {
  opening: "Conectando con el aula…",
  paused: "El aula está en pausa: el ordenador del profesor no responde. Puedes seguir programando.",
  closed: "El aula se ha cerrado. Puedes seguir programando; vuelve a cargar la página para entrar de nuevo.",
  revoked: "El acceso al aula se ha retirado.",
};

export const writeErrors = {
  denied: "Kunobi no permite esta acción en el aula.",
  stale: "El aula cambió. Vuelve a intentarlo.",
  unavailable: "Se perdió la conexión con el aula. Inténtalo de nuevo.",
  over_budget: "El aula está muy ocupada. Espera un momento.",
  revoked: "El acceso al aula se ha retirado.",
  not_joined: "Ya no estás en el aula.",
};

// The teacher pauses the class ("eyes on me"): students see a notice over
// the page until it is lifted.
export function pauseClass(clase, paused, now = Date.now()) {
  return { ...clase, pausa: paused ? { t: now } : null };
}

// Ending the class deletes everything in the room: the class and every
// student's entries. Only the host may delete other people's keys.
export function endClassKeys(state) {
  return Object.keys(state ?? {}).filter(key => key === "clase" || ownPrefixes.some(prefix => key.startsWith(prefix)));
}

// The class as a table for a spreadsheet. As a file: semicolons, as Spanish
// locales expect, and a byte order mark so accents open well. To paste:
// tabs, which spreadsheets split into columns, and no byte order mark.
const timeOfDay = new Intl.DateTimeFormat("es", { timeStyle: "short" });
const cell = separator => value => {
  const text = String(value ?? "");
  return text.includes(separator) || /["\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function summaryRows(roster) {
  const header = ["Nombre", "Presente", "Lección o programa", "Retos superados", "Lecciones superadas", "Pide ayuda", "Hora de entrega", "Archivo entregado", "Programa entregado"];
  const rows = roster.map(student => [
    student.name,
    student.present ? "sí" : "no",
    student.lessonName,
    student.done,
    student.doneKeys.map(key => lessons[key]?.name ?? key).join(" | "),
    student.hand ? "sí" : "no",
    student.delivery ? timeOfDay.format(student.delivery.t) : "",
    student.delivery?.nombre ?? "",
    student.delivery?.programa ?? "",
  ]);
  return [header, ...rows];
}

export function summaryCsv(roster) {
  return "\ufeff" + summaryRows(roster).map(row => row.map(cell(";")).join(";")).join("\r\n") + "\r\n";
}

export function summaryTsv(roster) {
  return summaryRows(roster).map(row => row.map(cell("\t")).join("\t")).join("\n") + "\n";
}

export function summaryFileName(now = new Date()) {
  const pad = n => String(n).padStart(2, "0");
  return `aula-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
}
