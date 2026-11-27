import { useEffect, useRef } from "react";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { timeOfDay } from "./aula-state.js";

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

export function AulaTeacher({
  students, stale, listOpen, toggleList, lesson, open, busy, paused,
  sendToClass, togglePause, sentNote, canDownload, onSummary, manualCopy, manualCopyRef, closeManualCopy,
  cleanUp, openClass, confirmEnd, requestEnd, cancelEnd, endClass,
  lowerHand, openDelivery, forward,
}) {
  const hands = students.filter(student => student.hand).length;
  const countLabel = (students.length === 1 ? "1 alumno" : `${students.length} alumnos`)
    + (hands === 1 ? " · 1 pide ayuda" : hands > 1 ? ` · ${hands} piden ayuda` : "");
  const summaryLabel = canDownload ? "Descargar resumen" : "Copiar resumen";

  return (
    <>
      {/* One row, Kunobi style: the class at a glance, Enviar ▾ and Pausar; the
          summary as an icon; rare or destructive actions in ⋯. */}
      <div className="kl-aula-row kl-aula-bar" role="group" aria-label="Clase">
        <button type="button" className="kl-secondary kl-aula-tool kl-aula-count" aria-expanded={listOpen}
          aria-controls="klogo-aula-list" aria-label={countLabel} title={listOpen ? "Ocultar la lista" : "Ver la lista"}
          onClick={toggleList}>
          <ToolbarIcon name="users" /><span>{students.length}</span>
          {hands > 0 && <span className="kl-aula-hands"><ToolbarIcon name="hand" />{hands}</span>}
        </button>
        <span className="kl-aula-sep" aria-hidden="true" />
        <AulaMenu label="Enviar a la clase" className="kl-aula-send" trigger={<>
          <ToolbarIcon name="send" /><span className="kl-aula-tool-text">Enviar</span><ToolbarIcon name="chevronDown" />
        </>}>
          {close => <>
            <button type="button" className="kl-secondary" aria-label="Enviar mi lección" disabled={busy || !open || !lesson}
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
          onClick={onSummary}
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
              onClick={() => { close(); requestEnd(); }}><ToolbarIcon name="exit" />Terminar clase…</button>
          </>}
        </AulaMenu>
      </div>
      {confirmEnd && (
        <div className="kl-aula-confirm" role="group" aria-label="Terminar la clase">
          <span>¿Terminar la clase? Se borran nombres, manos y entregas.</span>
          <button type="button" className="kl-secondary kl-aula-danger" disabled={busy || !open} onClick={endClass}>Sí, terminar</button>
          <button type="button" className="kl-secondary" onClick={cancelEnd}>Cancelar</button>
        </div>
      )}
      {manualCopy && (
        <div className="kl-aula-manual">
          <label htmlFor="klogo-aula-summary">Resumen de la clase: cópialo (⌘C o Ctrl+C) y pégalo en una hoja de cálculo.</label>
          <textarea id="klogo-aula-summary" ref={manualCopyRef} readOnly value={manualCopy} rows={4} />
          <button type="button" className="kl-secondary" onClick={closeManualCopy}>Cerrar</button>
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
                        <span className="kl-aula-note">{timeOfDay.format(student.delivery.t)}</span>
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
}
