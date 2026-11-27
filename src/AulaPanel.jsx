// The Aula bar of index.mdx: a class shared in a Kunobi room. The teacher (who
// hosts the room) opens a class and sees who is in it, in which lesson, how
// many challenges each has passed and who raised a hand. Students enter with
// a name. The room saves nothing and lasts while the teacher's page is open;
// on index.mdx, AulaClassroom.jsx adds what is kept: the name in the student's
// notebook (`savedName`, `onNameChosen`) and the teacher's notebooks (`extra`).
import { useEffect, useRef, useState } from "react";
import { useSession } from "kunobi";
import { allowsLogoDownload } from "./viewport.js";
import { AulaJoin, AulaStudent } from "./AulaStudent.jsx";
import { AulaTeacher } from "./AulaTeacher.jsx";
import { aulaStyles } from "./aula-styles.js";
import {
  classRoster, cleanName, deliveryEntry, describeSend, endClassKeys, forwardDelivery, handsFirst, newClass,
  pauseClass, roomMessages, roomName, sameEntry, sendLesson, sendProgram, staleKeys, studentEntry,
  summaryCsv, summaryFileName, summaryTsv, writeErrors,
} from "./aula-state.js";

const retryable = new Set(["unavailable", "over_budget"]);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const newOpId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Sends one operation, retrying with the same opId while the room is busy or
// out of reach. Only `applied` and `duplicate` changed (or had changed) it.
async function send(room, op) {
  const opId = newOpId();
  let status = "unavailable";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      status = (await room.apply(op, { opId }))?.status ?? "unavailable";
    } catch {
      status = "unavailable";
    }
    if (!retryable.has(status)) break;
    await wait(500 * (attempt + 1));
  }
  return status;
}

const done = status => status === "applied" || status === "duplicate";

// `source`, `fileName` and `locked` describe the editor; `onOpenLesson` and
// `onOpenProgram` open what the teacher sent, as the Ejemplo menu and
// Mis programas do.
export function AulaPanel({ lesson, doneLessons, source = "", fileName = "", origin = "", originLabel = "", locked = false, onOpenLesson, onOpenProgram,
  savedName = "", onNameChosen, extra = null }) {
  const room = useSession(roomName, { model: "map" });
  const status = room?.status ?? "refused";
  const open = status === "open";
  const readable = open || status === "paused";
  const state = readable ? room.state ?? {} : {};
  const participants = readable ? room.participants ?? [] : [];
  const me = open ? room.actor?.id ?? null : null;
  const lesson_ = lesson || "";
  const clase = state.clase ?? null;
  const classId = clase?.id ?? null;
  const isHost = Boolean(me && clase?.anfitrion === me);
  const mine = me ? state[`alumno.${me}`] : null;
  const joined = Boolean(classId && mine?.clase === classId);
  const handUp = Boolean(me && classId && state[`mano.${me}`]?.clase === classId);
  const myDelivery = me && classId && state[`entrega.${me}`]?.clase === classId ? state[`entrega.${me}`] : null;
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listOpen, setListOpen] = useState(true);
  const [sentNote, setSentNote] = useState("");
  const [handledSend, setHandledSend] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [canDownload] = useState(allowsLogoDownload);
  const [manualCopy, setManualCopy] = useState("");
  const manualCopyRef = useRef(null);
  const writing = useRef(false);

  // Suggest the name kept in the student's notebook, once, if nothing is typed.
  const suggested = useRef(false);
  useEffect(() => {
    if (!savedName || suggested.current) return;
    suggested.current = true;
    setName(current => current || savedName);
  }, [savedName]);

  async function write(op, { quiet = false } = {}) {
    if (!open) return false;
    const result = await send(room, op);
    if (!done(result) && !quiet) setError(writeErrors[result] ?? "Kunobi no pudo guardar el cambio en el aula.");
    if (done(result)) setError("");
    return done(result);
  }

  async function act(run) {
    if (busy) return;
    setBusy(true);
    try { await run(); } finally { setBusy(false); }
  }

  // Keep the teacher's view current: write this student's entry when the
  // lesson or the passed challenges change, and only then.
  const doneKey = doneLessons.join(",");
  useEffect(() => {
    if (!open || !joined || writing.current) return;
    const next = studentEntry({ classId, name: mine.nombre, lesson: lesson_, done: doneLessons, previous: mine,
      program: fileName, origin: originLabel });
    if (sameEntry(next, mine)) return;
    writing.current = true;
    write({ type: "set", key: `alumno.${me}`, value: next }, { quiet: true })
      .finally(() => { writing.current = false; });
  }, [open, joined, classId, lesson_, doneKey, fileName, originLabel, mine?.nombre, mine?.leccion, mine?.programa, mine?.origen, mine?.hechas?.length]);

  const enter = () => act(async () => {
    const chosen = cleanName(name);
    if (!chosen || !me || !classId) return;
    const ok = await write({ type: "set", key: `alumno.${me}`,
      value: studentEntry({ classId, name: chosen, lesson: lesson_, done: doneLessons, previous: mine,
        program: fileName, origin: originLabel }) });
    if (ok) onNameChosen?.(chosen);
  });
  const toggleHand = () => act(() => (handUp
    ? write({ type: "delete", key: `mano.${me}` })
    : write({ type: "set", key: `mano.${me}`, value: { clase: classId, t: Date.now() } })));
  const lowerHand = id => act(() => write({ type: "delete", key: `mano.${id}` }));
  const openClass = () => act(async () => {
    const ok = await write({ type: "set", key: "clase", value: newClass(me) }, { quiet: true });
    if (!ok) setError("Solo puede abrir la clase quien aloja el aula: el profesor, en Kunobi.");
  });
  const sendToClass = kind => act(async () => {
    const result = kind === "lesson" ? sendLesson(clase, lesson_)
      : sendProgram(clase, source, fileName, Date.now(), { lesson: lesson_, origin, originLabel });
    if (result.error) { setError(result.error); setSentNote(""); return; }
    if (await write({ type: "set", key: "clase", value: result.clase })) {
      setSentNote(`Enviado a la clase: ${describeSend(result.clase.envio).title}`);
    }
  });
  const deliver = () => act(async () => {
    const result = deliveryEntry({ classId, source, name: fileName, lesson: lesson_, origin: originLabel });
    if (result.error) { setError(result.error); return; }
    await write({ type: "set", key: `entrega.${me}`, value: result.entrega });
  });
  const openDelivery = student => {
    if (locked) { setError("Detén tu programa para abrir la entrega."); return; }
    onOpenProgram?.(student.delivery.programa, student.delivery.nombre, student.delivery.leccion || "");
    setSentNote(`Abierto el programa de ${student.name}`);
  };
  const forward = student => act(async () => {
    const result = forwardDelivery(clase, student.delivery, student.name);
    if (result.error) { setError(result.error); return; }
    if (await write({ type: "set", key: "clase", value: result.clase })) {
      setSentNote(`Enviado a la clase: ${describeSend(result.clase.envio).title}`);
    }
  });
  const paused = Boolean(clase?.pausa);
  const togglePause = () => act(() => write({ type: "set", key: "clase", value: pauseClass(clase, !paused) }));
  function downloadSummary() {
    const csv = summaryCsv(classRoster(state, participants, classId, { includeAbsent: true }));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = summaryFileName();
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSentNote("Resumen descargado");
  }
  // Where downloads are blocked (the Kunobi page and the web link run in a
  // sandboxed iframe), copy the table to paste in a spreadsheet. If the
  // clipboard is blocked too, show it selected to copy by hand.
  function copySummary() {
    const text = summaryTsv(classRoster(state, participants, classId, { includeAbsent: true }));
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    area.remove();
    if (copied) {
      setManualCopy("");
      setSentNote("Resumen copiado: pégalo en una hoja de cálculo");
    } else {
      setManualCopy(text);
      setSentNote("");
    }
  }
  useEffect(() => {
    if (manualCopy) manualCopyRef.current?.select();
  }, [manualCopy]);
  const endClass = () => act(async () => {
    setConfirmEnd(false);
    // The class last, so students keep seeing it until their entries are gone.
    const keys = endClassKeys(state).sort((a, b) => (a === "clase") - (b === "clase"));
    for (const key of keys) await write({ type: "delete", key });
    setSentNote("");
  });
  const envio = clase?.envio ?? null;
  const offer = !isHost && joined && envio && envio.id !== handledSend ? describeSend(envio) : null;
  function openSent() {
    if (!offer || locked) return;
    if (offer.kind === "lesson") onOpenLesson?.(envio.leccion);
    else onOpenProgram?.(envio.programa, envio.nombre, envio.origen ?? "");
    setHandledSend(envio.id);
  }
  const cleanUp = () => act(async () => {
    for (const key of staleKeys(state, participants, classId)) await write({ type: "delete", key });
  });

  const roster = classRoster(state, participants, classId);
  const students = handsFirst(roster.filter(student => !student.self || !isHost));
  const stale = isHost ? staleKeys(state, participants, classId).length : 0;

  let body;
  if (status === "refused") {
    body = <p className="kl-aula-note">El aula funciona dentro de Kunobi o desde el enlace del profesor. Aquí puedes programar igual.</p>;
  } else if (!open && status !== "paused") {
    body = <p className="kl-aula-note">{roomMessages[status] ?? roomMessages.opening}</p>;
  } else if (!classId) {
    // Only someone in Kunobi (not a visitor of the link) may open the class
    // and gets the checklist: a visitor never hosts the room, so the button
    // would only be refused.
    const teacher = open && room.actor && room.actor.kind !== "visitor";
    body = (
      <div className="kl-aula-row">
        <p className="kl-aula-note">{teacher || !open ? "Todavía no hay clase abierta." : "Todavía no hay clase abierta. Espera a que el profesor la abra."}</p>
        {teacher && <button type="button" className="kl-secondary" disabled={busy || !me} onClick={openClass}>Abrir clase</button>}
        {teacher && (
          <details className="kl-aula-checklist">
            <summary>Antes de clase</summary>
            <ol>
              <li>En Kunobi, comprueba que el enlace del Aula está activo y copia su dirección. Cambia si Kunobi se actualiza o se reinicia, o si revisas el enlace con Update.</li>
              <li>Ábrelo en un móvil o en otro navegador, entra con un nombre de prueba y guarda un programa.</li>
              <li>Comprueba que esa prueba aparece en la lista del Aula y en Cuadernos; después borra su cuaderno.</li>
              <li>Deja esta página abierta toda la clase: si la cierras, el aula se detiene para todos.</li>
            </ol>
          </details>
        )}
      </div>
    );
  } else if (isHost) {
    body = (
      <AulaTeacher students={students} stale={stale} listOpen={listOpen}
        toggleList={() => setListOpen(value => !value)} lesson={lesson_} open={open} busy={busy} paused={paused}
        sendToClass={sendToClass} togglePause={togglePause} sentNote={sentNote}
        canDownload={canDownload} onSummary={canDownload ? downloadSummary : copySummary}
        manualCopy={manualCopy} manualCopyRef={manualCopyRef} closeManualCopy={() => setManualCopy("")}
        cleanUp={cleanUp} openClass={openClass} confirmEnd={confirmEnd}
        requestEnd={() => setConfirmEnd(true)} cancelEnd={() => setConfirmEnd(false)} endClass={endClass}
        lowerHand={lowerHand} openDelivery={openDelivery} forward={forward} />
    );
  } else if (!joined) {
    body = <AulaJoin name={name} setName={setName} enter={enter} disabled={busy || !open} savesName={Boolean(onNameChosen)} />;
  } else {
    body = (
      <AulaStudent name={mine.nombre} handUp={handUp} myDelivery={myDelivery} disabled={busy || !open}
        locked={locked} offer={offer} toggleHand={toggleHand} deliver={deliver}
        openSent={openSent} dismissOffer={() => setHandledSend(envio.id)} />
    );
  }

  const showPause = paused && !isHost && joined;
  return (
    <section className="kl-aula" aria-label="Aula">
      <style>{aulaStyles}</style>
      {showPause && (
        <div className="kl-aula-pause" role="alert">
          <p className="kl-aula-pause-title">👀 Mira al profesor</p>
          <p>La clase está en pausa. Podrás seguir cuando el profesor la reanude.</p>
        </div>
      )}
      <h2 className="kl-aula-title">Aula{status === "paused" ? " · en pausa" : ""}</h2>
      {status === "paused" && <p className="kl-aula-note">{roomMessages.paused}</p>}
      {body}
      {error && <p className="kl-aula-error" role="alert">{error}</p>}
      {extra}
    </section>
  );
}
