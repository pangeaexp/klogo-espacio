// Where ProgramLibrary keeps programs. Both hooks give the same shape:
//   { status, ready, canEdit, entries: [[id, program]], capacity,
//     save(id | null, program) → "applied" | "full" | "too-big" | "error",
//     rename(id, name) → boolean, remove(id) → boolean }
// - useProgramsLibrary: the `programas` LiveStore (the person's, in Kunobi).
// - useCuadernoLibrary: a student's own row of `cuadernos` (aula.mdx), with
//   SLOTS program slots: web-link visitors and Kunobi accounts other than
//   the teacher's (aula-role.js).
// Edits assign rows directly: with `??=` a page's draft may report a row
// that is not there yet, and nothing gets written (see progress-store.js).
import { edit, useStore, useStoreStatus } from "kunobi";
import { useProgressStore } from "./progress-store.js";
import { useAulaRole } from "./aula-role.js";
import {
  SLOTS, emptyRow, freeSlot, notebookSummaries, programProblem, progressField, renameFields, rowPrograms, rowProgress, slotFields,
} from "./cuaderno.js";

export const NOTEBOOKS = "cuadernos";

async function applied(store, mutate) {
  try {
    return (await edit(store, mutate))?.status === "applied";
  } catch {
    return false;
  }
}

function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte =>
    byte.toString(16).padStart(2, "0")).join("");
}

export function useProgramsLibrary() {
  const data = useStore("programas");
  const { status, canEdit } = useStoreStatus("programas");
  return {
    status,
    ready: status === "open" && data !== undefined,
    canEdit: Boolean(canEdit),
    entries: Object.entries(data?.programs ?? {}),
    capacity: null,
    save: async (id, program) =>
      (await applied("programas", draft => { draft.programs[id ?? newId()] = program; })) ? "applied" : "error",
    rename: (id, name) => applied("programas", draft => { draft.programs[id] = { ...draft.programs[id], name }; }),
    remove: id => applied("programas", draft => { delete draft.programs[id]; }),
  };
}

// The student's own notebook row, or undefined while it does not exist. A
// visitor's row is its LiveStore actor id (the store's `own` rule checks it);
// another Kunobi account's is its room actor id (rules do not bind people).
function useNotebookRow() {
  const data = useStore(NOTEBOOKS);
  const { status, canEdit, actor } = useStoreStatus(NOTEBOOKS);
  const { role, id: roomId } = useAulaRole();
  // A visitor is a student even while the room is closed (the teacher's
  // page is not open): its notebook needs only the store.
  const me = actor?.kind === "visitor" ? actor.id : role === "student" ? roomId : null;
  const ready = status === "open" && data !== undefined && Boolean(me);
  const row = ready ? data?.alumnos?.[me] : undefined;
  const write = fields => applied(NOTEBOOKS, draft => {
    draft.alumnos[me] = { ...(draft.alumnos[me] ?? emptyRow()), ...fields, t: Date.now() };
  });
  return { status, ready, canEdit: Boolean(canEdit) && Boolean(me), row, write };
}

export function useCuadernoLibrary() {
  const { status, ready, canEdit, row, write } = useNotebookRow();
  return {
    status,
    ready,
    canEdit,
    entries: rowPrograms(row),
    capacity: SLOTS,
    save: async (id, program) => {
      if (programProblem(program)) return "too-big";
      const slot = id ?? freeSlot(row);
      if (!slot) return "full";
      return (await write(slotFields(slot, program))) ? "applied" : "error";
    },
    rename: (id, name) => write(renameFields(id, name)),
    remove: id => write(slotFields(id, null)),
  };
}

export function useCuadernoProgress() {
  const { ready, canEdit, row, write } = useNotebookRow();
  const done = ready ? rowProgress(row) : null;
  return {
    ready,
    canEdit,
    done,
    add: keys => (canEdit && keys.length ? write(progressField([...(done ?? []), ...keys])) : Promise.resolve(false)),
    clear: () => (canEdit ? write(progressField([])) : Promise.resolve(false)),
  };
}

// The name the student gave in the Aula, kept in its notebook so the person
// knows whose it is and the Aula can suggest it next time.
export function useNotebookName() {
  const { ready, canEdit, row, write } = useNotebookRow();
  const name = ready ? (row?.nombre ?? "") : "";
  return {
    ready,
    name,
    save: chosen => (canEdit && chosen && chosen !== name ? write({ nombre: chosen }) : Promise.resolve(false)),
  };
}

// Every notebook, for the person in Kunobi (the store's rules do not bind
// them): summaries, and deleting a whole notebook.
export function useNotebooks() {
  const data = useStore(NOTEBOOKS);
  const { status, canEdit } = useStoreStatus(NOTEBOOKS);
  const ready = status === "open" && data !== undefined;
  return {
    ready,
    canEdit: Boolean(canEdit),
    notebooks: ready ? notebookSummaries(data?.alumnos) : [],
    remove: id => applied(NOTEBOOKS, draft => { delete draft.alumnos[id]; }),
  };
}

// Who this page is on aula.mdx: "student" (a web-link visitor or another
// Kunobi account), "person" (the teacher, whose Kunobi hosts the Aula's
// room) or null while that is not known. See aula-role.js.
export function useViewerKind() {
  const { status, actor } = useStoreStatus(NOTEBOOKS);
  const { role } = useAulaRole();
  if (status !== "open") return null;
  if (actor?.kind === "visitor") return "student";
  if (!role) return null;
  return role === "teacher" ? "person" : "student";
}

// The progress hook aula.mdx passes to KLogo: the teacher's `progreso`,
// a student's notebook. Both hooks always run, so
// the hook order never changes.
const notReady = { ready: false, canEdit: false, done: null, add: () => Promise.resolve(false), clear: () => Promise.resolve(false) };
export function useAulaProgress() {
  const person = useProgressStore();
  const visitor = useCuadernoProgress();
  const kind = useViewerKind();
  return kind === "student" ? visitor : kind === "person" ? person : notReady;
}
