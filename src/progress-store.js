// The challenge progress kept in the `progreso` LiveStore: the teacher's, on
// aula.mdx (through useAulaProgress in library-stores.js). The store's rules (`read` without
// `others`) keep its rows from the Aula's web-link visitors. The front page
// never imports it. One row per lesson met, keyed by its id, so
// two devices adding lessons at once do not overwrite each other.
import { edit, useStore, useStoreStatus } from "kunobi";

const store = "progreso";

async function change(mutate) {
  try {
    return (await edit(store, mutate))?.status === "applied";
  } catch {
    return false;
  }
}

export function useProgressStore() {
  const data = useStore(store);
  const { status, canEdit } = useStoreStatus(store);
  const ready = status === "open" && data !== undefined;
  return {
    ready,
    canEdit: Boolean(canEdit),
    done: ready ? Object.keys(data?.lessons ?? {}) : null,
    // Plain assignment, as ProgramLibrary does: with `??=` the page's draft
    // may report a row that is not there yet, and nothing gets written.
    add: keys => (canEdit && keys.length ? change(draft => {
      const doneAt = Date.now();
      for (const key of keys) draft.lessons[key] = { doneAt };
    }) : Promise.resolve(false)),
    clear: () => (canEdit ? change(draft => {
      for (const key of Object.keys(draft.lessons ?? {})) delete draft.lessons[key];
    }) : Promise.resolve(false)),
  };
}
