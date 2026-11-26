// Which lesson challenges this viewer has met. Kept in localStorage when the
// page may use it; otherwise (the sandboxed web viewer) only for this visit.
const progressStorageKey = "klogo.progress.v1";

export function loadProgress(lessonKeys) {
  try {
    const storage = window.localStorage;
    const saved = JSON.parse(storage.getItem(progressStorageKey) ?? "[]");
    const done = Array.isArray(saved) ? saved.filter(key => lessonKeys.includes(key)) : [];
    return { storage, done };
  } catch {
    return { storage: null, done: [] };
  }
}

export function saveProgress(storage, done) {
  if (!storage) return;
  try {
    if (done.length) storage.setItem(progressStorageKey, JSON.stringify(done));
    else storage.removeItem(progressStorageKey);
  } catch {
    // Quota or privacy settings: the progress stays for this visit.
  }
}

// Brings the progress of this visit and the one in the `progreso` LiveStore
// together. The first time the store opens both are joined and `add` says
// what the store lacks. Later, what another device added or cleared since
// `previous` (the stored list last seen) is applied here as well.
export function mergeStoredProgress({ local, stored, previous, lessonKeys }) {
  if (!previous) {
    const next = lessonKeys.filter(key => local.includes(key) || stored.includes(key));
    return { next, add: next.filter(key => !stored.includes(key)) };
  }
  const added = stored.filter(key => !previous.includes(key));
  const removed = previous.filter(key => !stored.includes(key));
  const next = lessonKeys.filter(key => (local.includes(key) || added.includes(key)) && !removed.includes(key));
  return { next, add: [] };
}
