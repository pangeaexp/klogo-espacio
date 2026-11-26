// What a program says and asks: the box for LEEPALABRA, the ELIZA
// conversation and the Salida panel with errors and their help.

export function WordInput({ inputRef, label, answer, onChange, onSubmit }) {
  return (
    <section className="kl-input" aria-labelledby="klogo-input-label">
      <label id="klogo-input-label" className="kl-pane-title" htmlFor="klogo-answer">{label}</label>
      <div className="kl-input-row">
        <input
          ref={inputRef}
          id="klogo-answer"
          className="kl-answer"
          value={answer}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              onSubmit(answer);
            }
          }}
          spellCheck={false}
          autoCorrect="off"
          maxLength={256}
        />
        <button type="button" className="kl-run" onClick={() => onSubmit(answer)}>Enviar</button>
      </div>
    </section>
  );
}

// Lines that start with «ELIZA: » or «Tú:» are shown as that speaker's.
export function ElizaConversation({ lines, outputRef, input }) {
  return (
    <section className="kl-pane kl-conversation" aria-labelledby="klogo-eliza">
      <div className="kl-pane-head"><h2 className="kl-pane-title" id="klogo-eliza">ELIZA</h2></div>
      <div className="kl-transcript" ref={outputRef} role="log" aria-label="Conversación con ELIZA">
        {lines?.length ? lines.map((line, index) => {
          const fromEliza = line.startsWith("ELIZA: ");
          const fromUser = line.startsWith("Tú:");
          const speaker = fromEliza ? "ELIZA" : fromUser ? "Tú" : "";
          const message = fromEliza ? line.slice("ELIZA: ".length) : fromUser ? line.slice("Tú:".length) : line;
          return <p key={index} data-speaker={speaker}>{speaker && <strong>{speaker}: </strong>}{message}</p>;
        }) : <p className="kl-muted">Pulsa Ejecutar para iniciar la conversación.</p>}
      </div>
      {input}
    </section>
  );
}

// The printed text (when this view shows it) and the error, with a link to
// its place in the code and, when the help has one, a button that fixes it.
export function OutputPanel({ isMobile, showPrinted, printed, outputRef, diagnostic, help, canFix, onGoTo, onFix, children }) {
  const location = diagnostic?.line ? `Línea ${diagnostic.line}, columna ${diagnostic.column}` : "";
  return (
    <>
      {children}
      {showPrinted && printed?.length > 0 && (
        <section className="kl-print" aria-labelledby={isMobile ? undefined : "klogo-print"}>
          {!isMobile && <h2 className="kl-pane-title" id="klogo-print">Salida</h2>}
          <pre ref={outputRef} role="log" aria-label="Texto impreso">{printed.join("\n")}</pre>
        </section>
      )}
      {isMobile && showPrinted && !printed?.length && !diagnostic && (
        <p className="kl-empty-output kl-muted">Sin salida de texto.</p>
      )}
      {diagnostic && (
        <div className="kl-diagnostic" role="alert">
          <p>
            {location && <><button type="button" className="kl-diagnostic-link"
              onClick={onGoTo}>{location}</button>{". "}</>}
            {diagnostic.message}
          </p>
          {help && (
            <p className="kl-diagnostic-help">
              {help.hint}
              {help.fix && <>{" "}<button type="button" className="kl-secondary kl-diagnostic-fix"
                disabled={!canFix} onClick={() => onFix(help.fix)}>{help.fix.label}</button></>}
            </p>
          )}
        </div>
      )}
    </>
  );
}
