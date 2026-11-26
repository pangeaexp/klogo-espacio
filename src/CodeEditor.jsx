// The code field with its line numbers, the lines the hints point at, the
// band of the Paso mode and the list of suggestions, plus the Variables
// panel of the Paso mode. The logic lives in use-logo-editor.js.

export function CodeEditor({
  editorRef, lineNumbersRef, hintLinesRef, stepLineRef, source, lineNumbers, hintLines, stepAt, showClickStep,
  readOnly, completion, acceptCompletion, onChange, onKeyDown, onScroll, onDismissCompletion, onBlur,
}) {
  return (
    <div className="kl-code-box">
      <div className="kl-line-gutter" aria-hidden="true">
        <pre className="kl-line-numbers" ref={lineNumbersRef}>{lineNumbers}</pre>
      </div>
      <div className="kl-hint-lines" ref={hintLinesRef} aria-hidden="true">
        {hintLines.map(line => (
          <div className="kl-hint-line" key={line} data-line={line} style={{ "--kl-hint-row": line - 1 }} />
        ))}
      </div>
      {stepAt && (stepAt.kind !== "click" || showClickStep) && (
        <div className="kl-step-line" ref={stepLineRef} data-line={stepAt.line}
          data-click={stepAt.kind === "click"} aria-hidden="true" />
      )}
      <textarea
        ref={editorRef}
        id="klogo-source"
        className="kl-source"
        value={source}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        onMouseDown={onDismissCompletion}
        onBlur={event => {
          onDismissCompletion();
          onBlur(event.currentTarget);
        }}
        aria-autocomplete="list"
        aria-controls={completion ? "klogo-completions" : undefined}
        aria-activedescendant={completion ? `klogo-completion-${completion.active}` : undefined}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
      />
      {completion && (
        <div className="kl-completions" data-above={completion.above}
          style={{ top: completion.top, left: completion.left, maxWidth: `min(320px, calc(100% - ${completion.left + 4}px))` }}>
          <ul role="listbox" id="klogo-completions" aria-label="Sugerencias">
            {completion.items.map((item, index) => (
              <li key={item.name} id={`klogo-completion-${index}`} role="option" aria-selected={index === completion.active}
                onMouseDown={event => event.preventDefault()} onClick={() => acceptCompletion(item)}>
                <strong>{item.name}</strong> <span>{item.detail}</span>
              </li>
            ))}
          </ul>
          <p className="kl-completions-help" aria-hidden="true">Tab completa · Esc cierra</p>
        </div>
      )}
    </div>
  );
}

// Visible variables and the innermost loop before each command of the Paso mode.
export function StepInspector({ inspection }) {
  const variables = Object.entries(inspection.variables ?? {});
  return (
    <section className="kl-step-inspector" aria-label="Variables del modo Paso" aria-live="polite">
      <div className="kl-step-inspector-head">
        <h2 className="kl-pane-title">Variables</h2>
        {inspection.active_loop && (
          <span className="kl-step-loop">
            {inspection.active_loop.command} · Vuelta {inspection.active_loop.current} de {inspection.active_loop.total}
          </span>
        )}
      </div>
      {variables.length > 0 ? (
        <dl className="kl-step-variables">
          {variables.map(([name, value]) => (
            <div key={name}><dt>:{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      ) : <p className="kl-muted">Aún no hay variables visibles.</p>}
    </section>
  );
}
