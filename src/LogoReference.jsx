import { useId, useLayoutEffect, useRef, useState } from "react";
import { logoReference } from "./logo-reference.js";

const searchable = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const groups = logoReference.map(({ title, entries }) => ({
  title,
  entries: entries.map(entry => {
    const names = [entry.name, ...entry.name.split(" … "), ...entry.aliases, ...(entry.variants ?? [])].map(searchable);
    const ideas = searchable([title, entry.ideas, entry.result, entry.args].filter(Boolean).join(" "));
    return { ...entry, names, searchText: [...names, ideas].join(" ") };
  }),
}));
const entries = groups.flatMap(group => group.entries);

export function LogoReference({ dialogRef, command, id, hidden, onClose, locked, onLoad }) {
  const docked = !dialogRef;
  const context = searchable(command ?? "");
  const initialEntry = context ? entries.find(entry => entry.names.includes(context)) : undefined;
  const [query, setQuery] = useState(initialEntry ? "" : command ?? "");
  const [selectedName, setSelectedName] = useState("");
  const searchRef = useRef(null);
  const headingId = useId();
  const entryId = useId();
  useLayoutEffect(() => {
    if (docked) searchRef.current?.focus();
  }, [docked]);

  const search = searchable(query).trim();
  const terms = search.split(/\s+/);
  const matches = groups.map(({ title, entries }) => ({
    title,
    entries: entries.filter(entry => terms.every(term => entry.searchText.includes(term))),
  })).filter(group => group.entries.length);
  const matchingEntries = matches.flatMap(group => group.entries);
  const selected = matchingEntries.find(entry => entry.name === selectedName)
    ?? (search ? matchingEntries.find(entry => entry.names.includes(search)) : initialEntry)
    ?? matchingEntries[0];
  const showIndex = !docked || !initialEntry || Boolean(search);
  const close = docked ? onClose : () => dialogRef.current.close();
  const handleKeyDown = event => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const content = (
    <>
      <header className={docked ? "kl-pane-head" : "kl-reference-head"}>
        <h2 id={headingId} className={docked ? "kl-pane-title" : "kl-reference-title"}>Referencia Logo</h2>
        <button type="button" className="kl-secondary" onClick={close}>Cerrar</button>
      </header>
      <div className="kl-reference-content">
        <label className="kl-reference-search">
          Buscar en la referencia
          <input ref={searchRef} type="search" placeholder="Orden o idea, p. ej. círculo" value={query}
            onChange={event => {
              setQuery(event.target.value);
              setSelectedName("");
            }} />
        </label>
        {selected ? (
          <div className="kl-reference-body">
            {showIndex && (
              <nav className="kl-reference-index" aria-label="Órdenes y funciones">
                {matches.map(({ title, entries }) => (
                  <div key={title}>
                    <h3 className="kl-reference-group">{title}</h3>
                    {entries.map(entry => (
                      <button type="button" className="kl-reference-entry" key={entry.name}
                        aria-current={entry === selected ? "true" : undefined}
                        onClick={() => setSelectedName(entry.name)}>{entry.name}</button>
                    ))}
                  </div>
                ))}
              </nav>
            )}
            <article className="kl-reference-detail" aria-labelledby={entryId}>
              <h3 id={entryId} className="kl-pane-title">{selected.name}</h3>
              <dl>
                <dt>Sintaxis</dt><dd><pre className="kl-reference-code">{selected.syntax}</pre></dd>
                <dt>Argumentos</dt><dd>{selected.args}</dd>
                <dt>Resultado</dt><dd>{selected.result}</dd>
                <dt>Alias en inglés</dt><dd>{selected.aliases.join(", ")}</dd>
                {selected.variants && <><dt>También en español</dt><dd>{selected.variants.join(", ")}</dd></>}
                <dt>Ejemplo</dt><dd><pre className="kl-reference-code">{selected.example}</pre></dd>
              </dl>
              {onLoad && (
                <button type="button" className="kl-run" disabled={locked}
                  onClick={() => { close(); onLoad(selected.example); }}>Cargar ejemplo</button>
              )}
            </article>
          </div>
        ) : <p role="status">No hay órdenes ni funciones que coincidan.</p>}
      </div>
    </>
  );
  return docked ? (
    <section id={id} className="kl-pane kl-reference-docked" hidden={hidden} aria-labelledby={headingId} onKeyDown={handleKeyDown}>
      {content}
    </section>
  ) : (
    <dialog ref={dialogRef} className="kl-reference" aria-labelledby={headingId} onKeyDown={handleKeyDown}>
      {content}
    </dialog>
  );
}
