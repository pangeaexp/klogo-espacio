// The Aula bar of index.mdx: a class shared in a Kunobi room. The teacher (who
// hosts the room) opens a class and sees who is in it, in which lesson, how
// many challenges each has passed and who raised a hand. Students enter with
// a name. The room saves nothing and lasts while the teacher's page is open;
// on index.mdx, AulaClassroom.jsx adds what is kept: the name in the student's
// notebook (`savedName`, `onNameChosen`) and the teacher's notebooks (`extra`).
import { useEffect, useRef, useState } from "react";
import { useSession } from "kunobi";
import { allowsLogoDownload } from "./viewport.js";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import {
  classRoster, cleanName, deliveryEntry, describeSend, endClassKeys, forwardDelivery, handsFirst, pauseClass,
  summaryCsv, summaryFileName, summaryTsv, maxName, newClass, roomMessages, roomName, sameEntry,
  sendLesson, sendProgram, staleKeys, studentEntry, writeErrors,
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

// A drop-down like ⋯ in the toolbar: <details> that closes on Escape, on a
// press outside it and after choosing an item (`children` gets `close`).
function AulaMenu({ label, className = "", trigger, children }) {
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  useEffect(() => {
    function closeOnOutsidePress(event) {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    }
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);
  function close() {
    if (menuRef.current) menuRef.current.open = false;
    buttonRef.current?.focus();
  }
  return (
    <details className={`kl-options kl-aula-menu ${className}`} ref={menuRef} onKeyDown={event => {
      if (event.key === "Escape" && menuRef.current.open) {
        event.preventDefault();
        close();
      }
    }}>
      <summary className="kl-secondary kl-aula-tool" aria-label={label} title={label} ref={buttonRef}>{trigger}</summary>
      <div className="kl-options-items">{children(close)}</div>
    </details>
  );
}
const timeFormat = new Intl.DateTimeFormat("es", { timeStyle: "short" });

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
  const hands = students.filter(student => student.hand).length;
  const countLabel = (students.length === 1 ? "1 alumno" : `${students.length} alumnos`)
    + (hands === 1 ? " · 1 pide ayuda" : hands > 1 ? ` · ${hands} piden ayuda` : "");
  const summaryLabel = canDownload ? "Descargar resumen" : "Copiar resumen";
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
      <>
        {/* One row, Kunobi style: the class at a glance, Enviar ▾ and Pausar; the
            summary as an icon; rare or destructive actions in ⋯. */}
        <div className="kl-aula-row kl-aula-bar" role="group" aria-label="Clase">
          <button type="button" className="kl-secondary kl-aula-tool kl-aula-count" aria-expanded={listOpen}
            aria-controls="klogo-aula-list" aria-label={countLabel} title={listOpen ? "Ocultar la lista" : "Ver la lista"}
            onClick={() => setListOpen(value => !value)}>
            <ToolbarIcon name="users" /><span>{students.length}</span>
            {hands > 0 && <span className="kl-aula-hands"><ToolbarIcon name="hand" />{hands}</span>}
          </button>
          <span className="kl-aula-sep" aria-hidden="true" />
          <AulaMenu label="Enviar a la clase" className="kl-aula-send" trigger={<>
            <ToolbarIcon name="send" /><span className="kl-aula-tool-text">Enviar</span><ToolbarIcon name="chevronDown" />
          </>}>
            {close => <>
              <button type="button" className="kl-secondary" aria-label="Enviar mi lección" disabled={busy || !open || !lesson_}
                title="Cada alumno puede abrir la lección que tienes abierta"
                onClick={() => { close(); sendToClass("lesson"); }}><ToolbarIcon name="book" />Mi lección</button>
              <button type="button" className="kl-secondary" aria-label="Enviar mi programa" disabled={busy || !open}
                title="Cada alumno puede abrir una copia del programa de tu editor"
                onClick={() => { close(); sendToClass("program"); }}><ToolbarIcon name="open" />Mi programa</button>
            </>}
          </AulaMenu>
          <button type="button" className="kl-secondary kl-aula-tool" aria-pressed={paused} disabled={busy || !open}
            onClick={togglePause} aria-label={paused ? "Reanudar la clase" : "Pausar la clase"}
            title={paused ? "Reanudar la clase" : "Pausar la clase: el alumnado ve un aviso para que mire al profesor"}>
            <ToolbarIcon name={paused ? "play" : "pause"} />{paused && <span className="kl-aula-tool-text">Reanudar</span>}
          </button>
          <span className="kl-aula-status" role="status">
            {sentNote && <><ToolbarIcon name="check" />{sentNote}</>}
          </span>
          <button type="button" className="kl-secondary kl-aula-tool" disabled={busy} aria-label={summaryLabel}
            onClick={canDownload ? downloadSummary : copySummary}
            title={canDownload
              ? "Descargar resumen: nombre, lección, retos y entregas de quien ha estado en esta clase, en un archivo .csv"
              : "Copiar resumen: nombre, lección, retos y entregas de quien ha estado en esta clase, para pegar en una hoja de cálculo"}>
            <ToolbarIcon name={canDownload ? "download" : "table"} />
          </button>
          <AulaMenu label="Más opciones del aula" trigger={<ToolbarIcon name="more" />}>
            {close => <>
              <button type="button" className="kl-secondary" disabled={busy || !open || stale === 0}
                title="Borra los datos de quien ya no está en el aula"
                onClick={() => { close(); cleanUp(); }}><ToolbarIcon name="eraser" />Limpiar ausentes{stale > 0 ? ` (${stale})` : ""}</button>
              <button type="button" className="kl-secondary" disabled={busy || !open}
                title="Empieza una clase nueva: el alumnado vuelve a escribir su nombre"
                onClick={() => { close(); openClass(); }}><ToolbarIcon name="reload" />Nueva clase</button>
              <button type="button" className="kl-secondary kl-aula-menu-danger" disabled={busy || !open}
                onClick={() => { close(); setConfirmEnd(true); }}><ToolbarIcon name="exit" />Terminar clase…</button>
            </>}
          </AulaMenu>
        </div>
        {confirmEnd && (
          <div className="kl-aula-confirm" role="group" aria-label="Terminar la clase">
            <span>¿Terminar la clase? Se borran nombres, manos y entregas.</span>
            <button type="button" className="kl-secondary kl-aula-danger" disabled={busy || !open} onClick={endClass}>Sí, terminar</button>
            <button type="button" className="kl-secondary" onClick={() => setConfirmEnd(false)}>Cancelar</button>
          </div>
        )}
        {manualCopy && (
          <div className="kl-aula-manual">
            <label htmlFor="klogo-aula-summary">Resumen de la clase: cópialo (⌘C o Ctrl+C) y pégalo en una hoja de cálculo.</label>
            <textarea id="klogo-aula-summary" ref={manualCopyRef} readOnly value={manualCopy} rows={4} />
            <button type="button" className="kl-secondary" onClick={() => setManualCopy("")}>Cerrar</button>
          </div>
        )}
        {listOpen && (
          students.length === 0
            ? <p id="klogo-aula-list" className="kl-aula-note">Nadie ha entrado todavía. Comparte el enlace del aula.</p>
            : (
              <div id="klogo-aula-list" className="kl-aula-scroll"><table className="kl-aula-list">
                <thead><tr><th scope="col"><span className="kl-sr">Mano</span></th><th scope="col">Alumno</th><th scope="col">Lección o programa</th>
                  <th scope="col" title="Retos superados"><ToolbarIcon name="trophy" /><span className="kl-sr">Retos</span></th><th scope="col">Entrega</th></tr></thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} data-hand={student.hand}>
                      <td className="kl-aula-hand-cell">{student.hand && (
                        <button type="button" className="kl-secondary kl-aula-tool kl-aula-hand" disabled={busy || !open}
                          onClick={() => lowerHand(student.id)} aria-label={`Bajar la mano de ${student.name}`}
                          title="Pide ayuda. Pulsa cuando le hayas atendido"><ToolbarIcon name="hand" /></button>
                      )}</td>
                      <th scope="row">{student.name}</th>
                      <td>{student.lessonName}</td>
                      <td>{student.done}</td>
                      <td>{student.delivery && (
                        <span className="kl-aula-delivery">
                          <span className="kl-aula-note">{timeFormat.format(student.delivery.t)}</span>
                          <button type="button" className="kl-secondary kl-aula-tool" disabled={busy} onClick={() => openDelivery(student)}
                            aria-label={`Abrir el programa de ${student.name}`} title="Abrir en tu editor, en lugar de tu programa">
                            <ToolbarIcon name="open" /></button>
                          <button type="button" className="kl-secondary kl-aula-tool" disabled={busy || !open} onClick={() => forward(student)}
                            aria-label={`Enviar a la clase el programa de ${student.name}`} title="Enviar a la clase">
                            <ToolbarIcon name="broadcast" /></button>
                        </span>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )
        )}
      </>
    );
  } else if (!joined) {
    body = (
      // No <form>: the web link's iframe has sandbox="allow-scripts", which
      // blocks form submission, so the button and Enter call enter() directly.
      <div className="kl-aula-row" role="group" aria-label="Entrar en el aula">
        <label htmlFor="klogo-aula-name">Tu nombre</label>
        <input id="klogo-aula-name" value={name} maxLength={maxName} autoComplete="off"
          onChange={event => setName(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); enter(); } }} />
        <button type="button" className="kl-secondary" disabled={busy || !open || !cleanName(name)} onClick={enter}>Entrar en el aula</button>
        <span className="kl-aula-note">{onNameChosen
          ? "El profesor verá tu nombre, tu lección y los retos que superes. Tu nombre se guarda en tu cuaderno."
          : "El profesor verá tu nombre, tu lección y los retos que superes."}</span>
      </div>
    );
  } else {
    body = (
      <div className="kl-aula-row">
        <span>En el aula como <strong>{mine.nombre}</strong></span>
        <button type="button" className="kl-secondary kl-aula-tool" aria-pressed={handUp} disabled={busy || !open} onClick={toggleHand}>
          <ToolbarIcon name="hand" />{handUp ? "Bajar la mano" : "Pedir ayuda"}
        </button>
        <button type="button" className="kl-secondary kl-aula-tool" disabled={busy || !open} onClick={deliver}
          title="El profesor recibe una copia del programa de tu editor">
          <ToolbarIcon name="upload" />{myDelivery ? "Entregar de nuevo" : "Entregar"}</button>
        {myDelivery && <span className="kl-aula-note"><ToolbarIcon name="check" />Entregado a las {timeFormat.format(myDelivery.t)}</span>}
        {handUp && <span className="kl-aula-note">El profesor ve que pides ayuda.</span>}
        {offer && (
          <div className="kl-aula-offer" role="status">
            <span>El profesor ha enviado {offer.kind === "lesson" ? "la lección" : "el programa"} <strong>{offer.title}</strong>.</span>
            <button type="button" className="kl-secondary kl-aula-open" disabled={locked} onClick={openSent}
              title={locked ? "Detén tu programa para abrirlo" : offer.kind === "program" ? "Sustituye el programa de tu editor" : undefined}>Abrir</button>
            <button type="button" className="kl-secondary" onClick={() => setHandledSend(envio.id)}>Ahora no</button>
            {locked && <span className="kl-aula-note">Detén tu programa para abrirlo.</span>}
          </div>
        )}
      </div>
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

const aulaStyles = `
  .kl-workspace .kl-aula { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin: 0 0 12px; padding: 8px 10px; border: 1px solid #c7d1c5; border-radius: 10px; background: #fffef8; font-size: calc(14px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-title { margin: 0; font-size: calc(14px * var(--kl-text, 1)); color: #213d36; }
  .kl-workspace .kl-aula-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; flex: 1 1 auto; min-width: 0; margin: 0; }
  .kl-workspace .kl-aula-row input { min-width: 0; flex: 0 1 14em; padding: 5px 8px; border: 1px solid #c7d1c5; border-radius: 7px; font: inherit; }
  .kl-workspace .kl-aula-note { margin: 0; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-error { flex: 1 0 100%; margin: 0; color: #9b2c1f; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-note .kl-icon { inline-size: 15px; block-size: 15px; margin-inline-end: 3px; vertical-align: -3px; color: #216447; }
  .kl-workspace .kl-aula-bar { gap: 6px; }
  .kl-workspace .kl-aula-tool { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-inline-size: 36px; block-size: 36px; padding: 0 8px; }
  .kl-workspace .kl-aula-tool[aria-pressed="true"] { color: #174b35; background: #e6f2ea; border-color: #216447; font-weight: 650; }
  .kl-workspace .kl-aula-menu > summary .kl-icon:last-child:not(:first-child) { inline-size: 14px; block-size: 14px; }
  .kl-workspace .kl-aula-send .kl-options-items { inset-inline-start: 0; inset-inline-end: auto; }
  .kl-workspace .kl-aula-menu-danger, .kl-workspace .kl-aula-menu-danger .kl-icon { color: #9b2c1f; }
  .kl-workspace .kl-aula-sep { inline-size: 1px; block-size: 22px; background: #c7d1c5; }
  .kl-workspace .kl-aula-status { display: inline-flex; align-items: center; gap: 4px; flex: 1 1 0; min-width: 0; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-status .kl-icon { inline-size: 15px; block-size: 15px; color: #216447; }
  .kl-workspace .kl-aula-count { font-variant-numeric: tabular-nums; }
  .kl-workspace .kl-aula-hands { display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 6px; color: #8a5a00; background: #fff4d6; font-weight: 650; }
  .kl-workspace .kl-aula-hands .kl-icon { inline-size: 14px; block-size: 14px; }
  .kl-workspace .kl-aula-hand { color: #8a5a00; background: #fff4d6; border-color: #e3c27a; }
  .kl-workspace .kl-aula-list .kl-aula-hand-cell { inline-size: 1%; padding-inline-end: 0; }
  .kl-workspace .kl-aula-list thead .kl-icon { inline-size: 15px; block-size: 15px; vertical-align: -3px; }
  .kl-workspace .kl-aula-scroll { flex: 1 0 100%; min-width: 0; overflow-x: auto; }
  .kl-workspace .kl-aula-list { width: 100%; border-collapse: collapse; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-list :is(th, td) { padding: 4px 8px; border-top: 1px solid #e3e8df; text-align: left; vertical-align: middle; }
  .kl-workspace .kl-aula-list thead th { border-top: 0; color: #48635a; font-weight: 600; }
  .kl-workspace .kl-aula-list tr[data-hand="true"] { background: #fff4d6; }
  .kl-workspace .kl-aula-list td:nth-child(4) { font-variant-numeric: tabular-nums; }
  .kl-workspace .kl-aula-offer { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; flex: 1 0 100%; padding: 6px 8px; border-radius: 8px; background: #e6f2ea; }
  .kl-workspace .kl-aula-open { color: #fff; background: #216447; border-color: #216447; font-weight: 650; }
  .kl-workspace .kl-aula-delivery { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
  .kl-workspace .kl-aula-confirm { flex: 1 0 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 2px 6px; border-radius: 8px; background: #fbe9e5; }
  .kl-workspace .kl-aula-danger { color: #fff; background: #9b2c1f; border-color: #9b2c1f; font-weight: 650; }
  .kl-workspace .kl-aula-pause { position: fixed; inset: 0; z-index: 50; display: grid; place-content: center; gap: 8px; padding: 24px; text-align: center; color: #fffef8; background: rgb(22 46 40 / .94); font-size: calc(18px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-pause p { margin: 0; }
  .kl-workspace .kl-aula-pause-title { font-size: calc(34px * var(--kl-text, 1)); font-weight: 700; }
  .kl-workspace .kl-aula-checklist { flex: 1 0 100%; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-checklist summary { cursor: pointer; color: #213d36; font-weight: 600; }
  .kl-workspace .kl-aula-checklist ol { margin: 6px 0 0; padding-inline-start: 1.4em; display: grid; gap: 3px; }
  .kl-workspace .kl-aula-manual { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex: 1 0 100%; }
  .kl-workspace .kl-aula-manual label { flex: 1 0 100%; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-manual textarea { flex: 1 1 100%; min-width: 0; font: 12px/1.4 ui-monospace, monospace; }
  @media (max-width: 680px) {
    .kl-workspace .kl-aula-tool { min-inline-size: 44px; block-size: 44px; }
  }
  @media (max-width: 420px) {
    .kl-workspace .kl-aula-send .kl-aula-tool-text { display: none; }
    .kl-workspace .kl-aula-sep { display: none; }
    .kl-workspace .kl-aula-status:not(:empty) { order: 10; flex-basis: 100%; }
  }
  .kl-workspace .kl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
