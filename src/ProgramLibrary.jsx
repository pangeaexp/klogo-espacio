import { useEffect, useRef, useState } from "react";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { arrangePrograms } from "./program-origins.js";
import { useProgramsLibrary } from "./library-stores.js";
import { MAX_TEXT_BYTES, notebookText } from "./cuaderno.js";
const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
const sameName = (a, b) => a.trim().localeCompare(b.trim(), "es", { sensitivity: "accent" }) === 0;

const sorts = [
  { id: "recent", label: "Más recientes" },
  { id: "name", label: "Nombre" },
  { id: "origin", label: "Origen" },
];

// With `compact`, the two actions are icon buttons that flow in the KLogo
// toolbar, and the name form and the list open on their own row below it.
// `useLibrary` says where the programs live (library-stores.js): the
// `programas` LiveStore by default, or a visitor's notebook in the Aula.
export function ProgramLibrary({ source, fileName, locked, onOpen, onSaved, origin = "", describeOrigin = () => undefined, compact = false, useLibrary = useProgramsLibrary }) {
  const library = useLibrary();
  const { status, ready, canEdit, capacity } = library;
  const [editingName, setEditingName] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  // Pending overwrite of a program with the same name: its id.
  const [replacing, setReplacing] = useState(null);
  // Per-row action in progress: { id, kind: "rename" | "delete" }.
  const [rowAction, setRowAction] = useState(null);
  const [newName, setNewName] = useState("");
  const [query, setQuery] = useState("");
  // The notebook's text when the clipboard refused it, shown to copy by hand.
  const [manualCopy, setManualCopy] = useState("");
  const manualCopyRef = useRef(null);
  const [sort, setSort] = useState("recent");
  const renameInput = useRef(null);
  const nameInput = useRef(null);
  const saveButton = useRef(null);
  const entries = [...library.entries].sort(([, a], [, b]) =>
    b.savedAt - a.savedAt || a.name.localeCompare(b.name, "es"));
  const shown = arrangePrograms(
    entries.map(([id, program]) => ({ id, program, origin: describeOrigin(program.origin) })), query, sort);
  const canSave = ready && canEdit && !locked && !saving;

  useEffect(() => {
    if (editingName) nameInput.current?.select();
  }, [editingName]);

  useEffect(() => {
    if (rowAction?.kind === "rename") renameInput.current?.select();
  }, [rowAction]);

  // Runs one library change; `change` answers true or "applied" when done.
  async function run(change, done) {
    setSaving(true);
    try {
      const result = await change();
      if (result === true || result === "applied") {
        setMessage(done);
        return "applied";
      }
      if (result === "full") setMessage(`Tu cuaderno ya tiene ${capacity} programas. Elimina uno o guarda con el nombre de otro para sustituirlo.`);
      else if (result === "too-big") setMessage(`Este programa es demasiado largo para el cuaderno (máximo ${MAX_TEXT_BYTES / 1024} KB). El código sigue en el editor.`);
      else setMessage("No se pudo cambiar la biblioteca. Inténtalo de nuevo.");
      return result || "error";
    } catch {
      setMessage("No se pudo cambiar la biblioteca. Inténtalo de nuevo.");
      return "error";
    } finally {
      setSaving(false);
    }
  }

  function askName() {
    setName(fileName === "programa.logo" ? "" : fileName.replace(/\.logo$/i, ""));
    setMessage("");
    setReplacing(null);
    setRowAction(null);
    setEditingName(true);
  }

  function closeName() {
    setEditingName(false);
    setReplacing(null);
    saveButton.current?.focus();
  }

  async function saveProgram(overwrite = false) {
    const title = name.trim();
    if (!title || !canSave) return;
    const existing = entries.find(([, program]) => sameName(program.name, title));
    if (existing && !overwrite) {
      setReplacing(existing[0]);
      setMessage("");
      return;
    }

    const program = { name: title, source, savedAt: Date.now(), ...(origin && { origin }) };
    setMessage("Guardando…");
    const result = await run(() => library.save(existing ? existing[0] : null, program),
      existing ? `Programa sustituido: ${title}` : `Programa guardado: ${title}`);
    if (result === "applied") {
      onSaved?.(title);
      setEditingName(false);
      setReplacing(null);
      saveButton.current?.focus();
    } else if (result === "error") {
      setMessage("No se pudo guardar. El código sigue en el editor.");
    }
  }

  function startRename(id, program) {
    setEditingName(false);
    setRowAction({ id, kind: "rename" });
    setNewName(program.name);
    setMessage("");
  }

  async function renameProgram(id) {
    const title = newName.trim();
    if (!title || saving) return;
    if (entries.some(([other, program]) => other !== id && sameName(program.name, title))) {
      setMessage(`Ya hay un programa llamado «${title}». Elige otro nombre.`);
      return;
    }
    if (await run(() => library.rename(id, title), `Programa renombrado: ${title}`) === "applied") {
      setRowAction(null);
    }
  }

  async function deleteProgram(id, program) {
    if (await run(() => library.remove(id), `Programa eliminado: ${program.name}`) === "applied") {
      setRowAction(null);
    }
  }

  useEffect(() => {
    if (manualCopy) manualCopyRef.current?.select();
  }, [manualCopy]);

  // A notebook lives in this browser only: copying it keeps its programs
  // safe elsewhere. Like the Aula's summary, it uses a hidden textarea
  // (the page runs in a sandboxed iframe) and falls back to a visible one.
  function copyNotebook() {
    const text = notebookText(entries);
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
      setMessage(`Cuaderno copiado: ${entries.length} ${entries.length === 1 ? "programa" : "programas"}. Pégalo en un documento para guardarlo.`);
    } else {
      setManualCopy(text);
      setMessage("");
    }
  }

  function openProgram(program) {
    const name = program.name.replace(/[\/\\]/g, "_");
    onOpen(program.source, /\.logo$/i.test(name) ? name : `${name}.logo`, program.origin);
    setMessage(`Programa abierto: ${program.name}`);
  }

  return (
    <div className="kl-library" role="group" aria-label="Biblioteca Logo" data-compact={compact}>
      <style>{`
        .kl-library { display: grid; gap: 7px; flex: 1 0 100%; min-width: 0; }
        .kl-library-actions, .kl-library-name { display: flex; gap: 6px 8px; align-items: center; flex-wrap: wrap; }
        .kl-library-list { margin: 6px 0 0; padding: 0; list-style: none; display: grid; gap: 5px; max-height: 13rem; overflow: auto; }
        .kl-library-list li { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .kl-library-list button { overflow-wrap: anywhere; text-align: left; }
        .kl-library p { margin: 0; }
        .kl-library-list .kl-library-open { flex: 0 1 auto; }
        .kl-library-row-actions { display: inline-flex; gap: 6px; flex-wrap: wrap; }
        .kl-library-filter { display: flex; gap: 6px 8px; align-items: center; flex-wrap: wrap; }
        .kl-library-filter input { flex: 1 1 10rem; min-width: 0; }
        .kl-library-meta { display: inline-flex; gap: 4px 8px; flex-wrap: wrap; font-size: calc(12px * var(--kl-text, 1)); }
        .kl-library-origin { padding: 1px 8px; border-radius: 999px; background: #e8eee2; color: #355550; }
        .kl-library-confirm { flex: 1 0 100%; display: flex; gap: 6px 8px; align-items: center; flex-wrap: wrap; }
        .kl-library-notebook { display: flex; gap: 6px 8px; align-items: center; flex-wrap: wrap; margin: 0 0 6px; }
        .kl-library-notebook p { flex: 1 1 16rem; min-width: 0; }
        .kl-library-manual { display: grid; gap: 6px; margin: 6px 0 0; }
        .kl-library-manual textarea { width: 100%; box-sizing: border-box; min-width: 0; font: 12px/1.4 ui-monospace, monospace; }
      `}</style>
      <div className="kl-library-actions">
        <button ref={saveButton} type="button" className={compact ? "kl-secondary kl-tool kl-icon-action" : "kl-secondary"}
          disabled={!canSave} onClick={askName} aria-label="Guardar programa" title="Guardar programa">
          {compact ? <ToolbarIcon name="save" /> : "Guardar programa"}
        </button>
        <button type="button" className={compact ? "kl-secondary kl-tool kl-icon-action" : "kl-secondary"}
          aria-expanded={showPrograms} aria-controls="klogo-saved-programs" aria-label="Mis programas" title="Mis programas"
          onClick={() => setShowPrograms(open => !open)}>{compact ? <ToolbarIcon name="list" /> : "Mis programas"}</button>
        {status === "opening" && <span className="kl-muted" role="status">Cargando biblioteca…</span>}
        {status !== "opening" && !ready && <span className="kl-muted" role="status">Biblioteca sin conexión.</span>}
      </div>
      {editingName && (
        <div className="kl-library-name">
          <label htmlFor="klogo-program-name">Nombre del programa</label>
          <input id="klogo-program-name" ref={nameInput} className="kl-answer" value={name}
            maxLength={100} disabled={saving} onChange={event => setName(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveProgram();
              }
              if (event.key === "Escape") closeName();
            }} />
          <button type="button" className="kl-secondary" disabled={!name.trim() || !canSave} onClick={() => saveProgram()}>Guardar</button>
          <button type="button" className="kl-secondary" disabled={saving} onClick={closeName}>Cancelar</button>
          {replacing && (
            <div className="kl-library-confirm" role="alert">
              <span>Ya hay un programa llamado «{name.trim()}».</span>
              <button type="button" className="kl-secondary" disabled={!canSave} onClick={() => saveProgram(true)}>Sustituirlo</button>
              <button type="button" className="kl-secondary" disabled={saving}
                onClick={() => { setReplacing(null); nameInput.current?.select(); }}>Cambiar el nombre</button>
            </div>
          )}
        </div>
      )}
      <div id="klogo-saved-programs" hidden={!showPrograms}>
        {capacity && ready && (
          <div className="kl-library-notebook">
            <p className="kl-muted">Tu cuaderno se guarda en este navegador. En otro ordenador o navegador empezarás uno nuevo: copia tus programas para no perderlos.</p>
            <button type="button" className="kl-secondary" disabled={entries.length === 0} onClick={copyNotebook}>Copiar mi cuaderno</button>
          </div>
        )}
        {manualCopy && (
          <div className="kl-library-manual">
            <label htmlFor="klogo-notebook-copy">Tu cuaderno: cópialo (⌘C o Ctrl+C) y pégalo en un documento.</label>
            <textarea id="klogo-notebook-copy" ref={manualCopyRef} readOnly value={manualCopy} rows={6} />
            <button type="button" className="kl-secondary" onClick={() => setManualCopy("")}>Cerrar</button>
          </div>
        )}
        {ready && entries.length === 0 && (
          <p className="kl-muted">{capacity ? `Aún no hay programas en tu cuaderno. Caben ${capacity}.` : "Aún no hay programas guardados."}</p>
        )}
        {entries.length > 0 && (
          <div className="kl-library-filter">
            <input type="search" className="kl-answer" aria-label="Buscar en mis programas" placeholder="Buscar"
              value={query} onChange={event => setQuery(event.target.value)}
              onKeyDown={event => { if (event.key === "Escape" && query) { event.preventDefault(); setQuery(""); } }} />
            <select aria-label="Ordenar por" value={sort} onChange={event => setSort(event.target.value)}>
              {sorts.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <span className="kl-muted" role="status">
              {query.trim() ? `${shown.length} de ${entries.length}`
                : capacity ? `${entries.length} de ${capacity} programas`
                : `${entries.length} ${entries.length === 1 ? "programa" : "programas"}`}
            </span>
          </div>
        )}
        {entries.length > 0 && shown.length === 0 && (
          <p className="kl-muted">Ningún programa coincide con «{query.trim()}».</p>
        )}
        {shown.length > 0 && (
          <ul className="kl-library-list">
            {shown.map(({ id, program, origin: from }) => (
              <li key={id}>
                {rowAction?.id === id && rowAction.kind === "rename" ? (
                  <span className="kl-library-confirm">
                    <label htmlFor={`klogo-rename-${id}`}>Nuevo nombre</label>
                    <input id={`klogo-rename-${id}`} ref={renameInput} className="kl-answer" value={newName}
                      maxLength={100} disabled={saving} onChange={event => setNewName(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void renameProgram(id);
                        }
                        if (event.key === "Escape") setRowAction(null);
                      }} />
                    <button type="button" className="kl-secondary" disabled={!newName.trim() || saving || !canEdit}
                      onClick={() => renameProgram(id)}>Renombrar</button>
                    <button type="button" className="kl-secondary" disabled={saving} onClick={() => setRowAction(null)}>Cancelar</button>
                  </span>
                ) : (
                  <>
                    <button type="button" className="kl-secondary kl-library-open" disabled={locked || saving}
                      onClick={() => openProgram(program)}>
                      {program.name}
                    </button>
                    <span className="kl-library-meta">
                      {from && <span className="kl-library-origin" title="De dónde salió">{from}</span>}
                      <span className="kl-muted">{dateFormat.format(program.savedAt)}</span>
                    </span>
                    <span className="kl-library-row-actions">
                      <button type="button" className="kl-secondary" disabled={!ready || !canEdit || saving}
                        aria-label={`Renombrar ${program.name}`} onClick={() => startRename(id, program)}>Renombrar</button>
                      <button type="button" className="kl-secondary" disabled={!ready || !canEdit || saving}
                        aria-label={`Eliminar ${program.name}`}
                        onClick={() => { setRowAction({ id, kind: "delete" }); setMessage(""); }}>Eliminar</button>
                    </span>
                  </>
                )}
                {rowAction?.id === id && rowAction.kind === "delete" && (
                  <span className="kl-library-confirm" role="alert">
                    <span>¿Eliminar «{program.name}»? No se puede deshacer.</span>
                    <button type="button" className="kl-secondary" disabled={saving}
                      onClick={() => deleteProgram(id, program)}>Sí, eliminar</button>
                    <button type="button" className="kl-secondary" disabled={saving} onClick={() => setRowAction(null)}>Cancelar</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="kl-muted" role="status" hidden={!message}>{message}</span>
    </div>
  );
}
