// The person's view of the students' notebooks (`cuadernos`) in the Aula,
// only in Kunobi: who has one, how many programs and challenges, when they
// last saved; open any program in the editor, copy every notebook as one
// text to keep, or delete a whole notebook. Unlike the room, notebooks stay
// after the class ends.
import { useEffect, useRef, useState } from "react";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { SLOTS, classNotebooksText, repeatedNames } from "./cuaderno.js";
import { useNotebooks } from "./library-stores.js";

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" });
const fileName = name => {
  const safe = name.replace(/[\/\\]/g, "_");
  return /\.logo$/i.test(safe) ? safe : `${safe}.logo`;
};

export function NotebooksPanel({ locked = false, onOpenProgram }) {
  const { ready, canEdit, notebooks, remove } = useNotebooks();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [manualCopy, setManualCopy] = useState("");
  const manualCopyRef = useRef(null);
  useEffect(() => {
    if (manualCopy) manualCopyRef.current?.select();
  }, [manualCopy]);

  const label = ready ? `Cuadernos (${notebooks.length})` : "Cuadernos";
  const who = notebook => notebook.name || "Sin nombre";

  function openProgram(notebook, program) {
    if (locked) { setNote("Detén tu programa para abrir uno de un cuaderno."); return; }
    onOpenProgram?.(program.source, fileName(program.name), program.origin ?? "");
    setNote(`Abierto «${program.name}» del cuaderno de ${who(notebook)}`);
  }

  // A notebook lives in its student's browser: a copy of them all keeps the
  // class's programs safe. Like the Aula's summary, a hidden textarea (the
  // page runs in a sandboxed iframe), and a visible one if copying fails.
  function copyAll() {
    const text = classNotebooksText(notebooks);
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
    const programs = notebooks.reduce((sum, notebook) => sum + notebook.programs.length, 0);
    if (copied) {
      setManualCopy("");
      setNote(`Cuadernos copiados: ${notebooks.length} ${notebooks.length === 1 ? "cuaderno" : "cuadernos"}, `
        + `${programs} ${programs === 1 ? "programa" : "programas"}. Pégalos en un documento para guardarlos.`);
    } else {
      setManualCopy(text);
      setNote("");
    }
  }

  async function erase(notebook) {
    setBusy(true);
    try {
      const ok = await remove(notebook.id);
      setNote(ok ? `Cuaderno borrado: ${who(notebook)}` : "No se pudo borrar el cuaderno. Inténtalo de nuevo.");
      if (ok) { setConfirm(null); if (shown === notebook.id) setShown(null); }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kl-notebooks" role="group" aria-label="Cuadernos del alumnado">
      <style>{notebookStyles}</style>
      <button type="button" className="kl-secondary kl-aula-tool" aria-expanded={open} aria-controls="klogo-notebooks"
        title="Los programas y retos que guarda cada alumno en su cuaderno. Se conservan entre clases."
        onClick={() => setOpen(value => !value)}>
        <ToolbarIcon name="book" /><span className="kl-aula-tool-text">{label}</span>
      </button>
      {open && ready && notebooks.length > 0 && (
        <button type="button" className="kl-secondary kl-aula-tool" onClick={copyAll}
          title="Todos los programas de todos los cuadernos en un texto, para guardar una copia">
          <ToolbarIcon name="copy" /><span className="kl-aula-tool-text">Copiar todos</span>
        </button>
      )}
      {note && <span className="kl-aula-note" role="status">{note}</span>}
      {manualCopy && (
        <div className="kl-aula-manual">
          <label htmlFor="klogo-notebooks-copy">Cuadernos de la clase: cópialos (⌘C o Ctrl+C) y pégalos en un documento para guardarlos.</label>
          <textarea id="klogo-notebooks-copy" ref={manualCopyRef} readOnly value={manualCopy} rows={6} />
          <button type="button" className="kl-secondary" onClick={() => setManualCopy("")}>Cerrar</button>
        </div>
      )}
      {open && (
        <div id="klogo-notebooks" className="kl-notebooks-body">
          {!ready && <p className="kl-aula-note">Cargando cuadernos…</p>}
          {ready && notebooks.length === 0 && (
            <p className="kl-aula-note">Aún no hay cuadernos. Se crean cuando un alumno entra en el aula o guarda un programa desde el enlace.</p>
          )}
          {ready && repeatedNames(notebooks).map(({ name, count }) => (
            <p key={name} className="kl-aula-note kl-notebooks-repeated">
              Hay {count} cuadernos con el nombre «{name}». Puede ser el mismo alumno en otro navegador u ordenador,
              o dos alumnos con el mismo nombre: mira «Última vez» y sus programas.
            </p>
          ))}
          {ready && notebooks.length > 0 && (
            <div className="kl-aula-scroll"><table className="kl-aula-list">
              <thead><tr>
                <th scope="col">Alumno</th><th scope="col">Programas</th>
                <th scope="col" title="Retos superados"><ToolbarIcon name="trophy" /><span className="kl-sr">Retos</span></th>
                <th scope="col">Última vez</th><th scope="col"><span className="kl-sr">Acciones</span></th>
              </tr></thead>
              <tbody>
                {notebooks.map(notebook => (
                  <NotebookRow key={notebook.id} notebook={notebook} who={who(notebook)}
                    shown={shown === notebook.id} confirming={confirm === notebook.id} busy={busy} canEdit={canEdit} locked={locked}
                    onToggle={() => setShown(value => (value === notebook.id ? null : notebook.id))}
                    onOpen={program => openProgram(notebook, program)}
                    onAskDelete={() => { setConfirm(notebook.id); setNote(""); }}
                    onDelete={() => erase(notebook)} onCancel={() => setConfirm(null)} />
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      )}
    </div>
  );
}

function NotebookRow({ notebook, who, shown, confirming, busy, canEdit, locked, onToggle, onOpen, onAskDelete, onDelete, onCancel }) {
  const count = notebook.programs.length;
  return (
    <>
      <tr>
        <th scope="row" className={notebook.name ? undefined : "kl-notebooks-unnamed"}>{who}</th>
        <td>
          <button type="button" className="kl-secondary kl-notebooks-count" disabled={count === 0} aria-expanded={shown}
            aria-label={`Programas de ${who}: ${count} de ${SLOTS}`} onClick={onToggle}>{count} de {SLOTS}</button>
        </td>
        <td>{notebook.done}</td>
        <td>{notebook.t ? dateFormat.format(notebook.t) : "—"}</td>
        <td>
          <button type="button" className="kl-secondary kl-aula-tool" disabled={busy || !canEdit}
            aria-label={`Borrar el cuaderno de ${who}`} title="Borrar el cuaderno" onClick={onAskDelete}>
            <ToolbarIcon name="eraser" /></button>
        </td>
      </tr>
      {confirming && (
        <tr><td colSpan={5}>
          <div className="kl-aula-confirm" role="group" aria-label={`Borrar el cuaderno de ${who}`}>
            <span>¿Borrar el cuaderno de {who}? Se pierden sus {count} programas y sus retos. No se puede deshacer.</span>
            <button type="button" className="kl-secondary kl-aula-danger" disabled={busy} onClick={onDelete}>Sí, borrar</button>
            <button type="button" className="kl-secondary" disabled={busy} onClick={onCancel}>Cancelar</button>
          </div>
        </td></tr>
      )}
      {shown && (
        <tr><td colSpan={5}>
          <ul className="kl-notebooks-programs" aria-label={`Programas de ${who}`}>
            {notebook.programs.map(program => (
              <li key={program.slot}>
                <button type="button" className="kl-secondary" disabled={locked}
                  title={locked ? "Detén tu programa para abrirlo" : "Abrir en tu editor, en lugar de tu programa"}
                  aria-label={`Abrir ${program.name} de ${who}`} onClick={() => onOpen(program)}>
                  <ToolbarIcon name="open" />{program.name}</button>
                {program.savedAt ? <span className="kl-aula-note">{dateFormat.format(program.savedAt)}</span> : null}
              </li>
            ))}
          </ul>
        </td></tr>
      )}
    </>
  );
}

const notebookStyles = `
  .kl-workspace .kl-notebooks { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; flex: 1 0 100%; min-width: 0; }
  .kl-workspace .kl-notebooks-body { flex: 1 0 100%; min-width: 0; }
  .kl-workspace .kl-notebooks-repeated { margin: 0 0 6px; }
  .kl-workspace .kl-notebooks-count { font-variant-numeric: tabular-nums; padding: 2px 8px; }
  .kl-workspace .kl-notebooks-unnamed { color: #48635a; font-style: italic; font-weight: 400; }
  .kl-workspace .kl-notebooks-programs { display: flex; flex-wrap: wrap; gap: 6px 12px; margin: 0; padding: 0; list-style: none; }
  .kl-workspace .kl-notebooks-programs li { display: inline-flex; align-items: center; gap: 6px; }
  .kl-workspace .kl-notebooks-programs .kl-icon { inline-size: 15px; block-size: 15px; margin-inline-end: 4px; vertical-align: -3px; }
`;
