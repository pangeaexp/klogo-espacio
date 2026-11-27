// Who this page is in the Aula (index.mdx):
//   "teacher": the person whose Kunobi hosts the room (the Space's owner);
//              uses their own `programas` and `progreso` and sees the notebooks.
//   "student": anyone else: a visitor of the web link, or another Kunobi
//              account the Space is shared with; uses their own notebook.
//   null:      not known yet (the room is opening).
// The page cannot tell accounts apart, but the room can: `anfitrion` is a
// host-only key (index.mdx rules), so writing it succeeds only for the host.
// A person whose write is denied, or whose room does not open, is a student,
// so nothing of theirs ever lands in the teacher's stores.
import { useEffect, useSyncExternalStore } from "react";
import { useSession } from "kunobi";
import { roomName } from "./aula-state.js";

export const HOST_PROBE_KEY = "anfitrion";

// One probe per actor for the whole page, shared by every component.
const probes = new Map();
const listeners = new Set();
let version = 0;
const notify = () => { version += 1; listeners.forEach(listener => listener()); };
const subscribe = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const settled = new Set(["applied", "duplicate", "denied"]);
const retryAfter = 2000;

async function probe(room, id) {
  probes.set(id, { role: null, pending: true });
  let status;
  try {
    status = (await room.apply({ type: "set", key: HOST_PROBE_KEY, value: { id, t: Date.now() } }))?.status;
  } catch {
    status = "unavailable";
  }
  if (settled.has(status)) {
    probes.set(id, { role: status === "denied" ? "student" : "teacher", pending: false });
  } else {
    probes.set(id, { role: null, pending: false, retryAt: Date.now() + retryAfter });
  }
  notify();
}

// Returns { role, id }: `id` is the room actor id (a visitor's matches its
// LiveStore actor id; a Kunobi account's names its notebook row).
export function useAulaRole() {
  const room = useSession(roomName, { model: "map" });
  useSyncExternalStore(subscribe, () => version);
  const status = room?.status ?? "refused";
  const actor = status === "open" ? room.actor ?? null : null;
  const id = actor?.id ?? null;
  const visitor = actor?.kind === "visitor";
  const known = id ? probes.get(id) : null;

  useEffect(() => {
    if (!id || visitor || known?.role || known?.pending) return undefined;
    const wait = Math.max(0, (known?.retryAt ?? 0) - Date.now());
    const timer = setTimeout(() => probe(room, id), wait);
    return () => clearTimeout(timer);
  }, [id, visitor, known?.role, known?.pending, known?.retryAt]);

  if (visitor) return { role: "student", id };
  if (status === "refused" || status === "closed") return { role: "student", id: null };
  return { role: known?.role ?? null, id };
}
