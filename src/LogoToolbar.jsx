import { useEffect, useRef } from "react";
import { ImageExport } from "./ImageExport.jsx";
import { LessonPicker } from "./LessonNav.jsx";
import { ProjectGallery } from "./ProjectGallery.jsx";
import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { textSizes } from "./text-size.js";

// The main button reserves the width of its longest label.
const primaryWidths = ["Ejecutar", "Pausar", "Continuar"];

export function LogoToolbar({ execution, files, editorLocked, picker, reloadTarget, reference,
  ProgramLibrary, libraryHref, library, presentation, gallery, image, feedback }) {
  const { phase, inProgress, canPause, isHeld, animating, onPrimary, onStep, onStop } = execution;
  const { source, fileName, fileStatus, openingFile, canDownloadFile, fileInputRef,
    openLogo, downloadLogo, copyLogo } = files;
  const { presenting, textSize, startPresenting, stopPresenting, changeTextSize } = presentation;
  const { note, audioUnavailable, showKeyInput, keyInputRef } = feedback;
  const showLibraryLink = libraryHref && typeof window !== "undefined" && window.location.protocol === "kunobi-mdx:";
  const fileOptionsRef = useRef(null);
  const fileOptionsButtonRef = useRef(null);
  const canStep = (phase === "ready" || isHeld) && !openingFile;
  const runMessage = note || (audioUnavailable ? "Audio no disponible" : "");
  const primaryLabel = {
    loading: "Ejecutar",
    ready: "Ejecutar",
    running: "Pausar",
    input: "Pausar",
    key: "Pausar",
    click: "Pausar",
    pausing: "Pausar",
    step: "Continuar",
    paused: "Continuar",
    unavailable: "Reintentar motor",
  }[phase];

  useEffect(() => {
    function closeOnOutsidePress(event) {
      const options = fileOptionsRef.current;
      if (options?.open && !options.contains(event.target)) options.open = false;
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);

  function closeFileOptions() {
    fileOptionsRef.current.open = false;
    fileOptionsButtonRef.current.focus();
  }

  function reloadExample() {
    picker.loadExample(reloadTarget);
  }

  return (
    <>
      <div className="kl-toolbar" role="group" aria-label="Controles de KLogo">
        {/* The toolbar keeps the same buttons and widths in every phase so it never reflows during a run. */}
        <button type="button" className="kl-run kl-toolbar-run" disabled={phase === "loading" || openingFile}
          aria-label={primaryLabel} aria-disabled={inProgress && !canPause && !isHeld} onClick={onPrimary}
          title={primaryLabel === "Ejecutar" ? "Ctrl / ⌘ + Intro en el editor"
            : canPause || isHeld ? "F8 en el editor" : "El programa espera una entrada"}>
          <ToolbarIcon name={canPause || (inProgress && !isHeld) ? "pause" : "play"} />
          <span className="kl-run-label">
            <span>{primaryLabel}</span>
            {primaryWidths.map(label => <span key={label} className="kl-run-ghost" aria-hidden="true">{label}</span>)}
          </span>
        </button>
        {phase !== "unavailable" && (
          <button type="button" className="kl-secondary kl-step-action" aria-label="Paso"
            aria-disabled={!canStep} disabled={phase === "loading"} onClick={onStep}
            title="Ejecuta una instrucción (F10 en el editor)">
            <ToolbarIcon name="step" />
          </button>
        )}
        {phase !== "unavailable" && (
          <button type="button" className="kl-secondary kl-icon-action kl-stop-action" aria-label="Detener" title="Detener"
            aria-disabled={!inProgress && !animating} disabled={phase === "loading"}
            onClick={onStop}><ToolbarIcon name="stop" /></button>
        )}
        <LessonPicker {...picker} editorLocked={editorLocked} />
        <div className="kl-toolbar-actions">
          {presenting && (
            <button type="button" className="kl-secondary kl-present-exit" aria-label="Salir de la presentación"
              title="Salir de la presentación" onClick={stopPresenting}>
              <ToolbarIcon name="exitPresent" /><span className="kl-present-exit-text">Salir</span></button>
          )}
          <button type="button" className="kl-secondary kl-tool kl-icon-action kl-reload-action" aria-label="Recargar ejemplo" title="Recargar ejemplo"
            disabled={editorLocked || !reloadTarget} onClick={reloadExample}><ToolbarIcon name="reload" /></button>
          <button type="button" className="kl-secondary kl-tool kl-icon-action kl-reference-trigger" aria-label="Ver sintaxis"
            title="Ver sintaxis de la orden del cursor" aria-expanded={reference.expanded}
            aria-controls={reference.expanded ? "klogo-editor-reference" : undefined}
            onClick={reference.onSyntax}><ToolbarIcon name="book" /></button>
          {ProgramLibrary && (
            <ProgramLibrary compact source={source} fileName={fileName} locked={editorLocked} origin={library.origin}
              describeOrigin={library.describeOrigin} onOpen={library.onOpen} onSaved={library.onSaved} />
          )}
          {showLibraryLink ? (
            <a className="kl-secondary kl-tool kl-icon-action" href={libraryHref} aria-label="Mis programas" title="Mis programas">
              <ToolbarIcon name="folder" />
            </a>
          ) : !canDownloadFile && !ProgramLibrary && (
            <button type="button" className="kl-secondary kl-tool kl-icon-action" aria-label="Copiar código" title="Copiar código"
              disabled={openingFile} onClick={copyLogo}><ToolbarIcon name="copy" /></button>
          )}
          <details className="kl-options" ref={fileOptionsRef} onKeyDown={event => {
            if (event.key === "Escape" && fileOptionsRef.current.open) {
              event.preventDefault();
              closeFileOptions();
            }
          }}>
            <summary className="kl-secondary kl-tool kl-icon-action" aria-label="Más opciones" title="Más opciones"
              ref={fileOptionsButtonRef}><ToolbarIcon name="more" /></summary>
            <div className="kl-options-items">
              {/* At 360 px or less the toolbar has no room for this icon: it moves here. */}
              <button type="button" className="kl-secondary kl-menu-reload" disabled={editorLocked || !reloadTarget} onClick={() => {
                closeFileOptions();
                reloadExample();
              }}><ToolbarIcon name="reload" />Recargar ejemplo</button>
              <button type="button" className="kl-secondary" disabled={editorLocked} onClick={() => {
                closeFileOptions();
                fileInputRef.current.click();
              }}><ToolbarIcon name="open" />Abrir .logo</button>
              {canDownloadFile && (
                <button type="button" className="kl-secondary" disabled={openingFile} onClick={() => {
                  closeFileOptions();
                  downloadLogo();
                }}><ToolbarIcon name="download" />Descargar .logo</button>
              )}
              {!canDownloadFile && (showLibraryLink || ProgramLibrary) && (
                <button type="button" className="kl-secondary" disabled={openingFile} onClick={() => {
                  closeFileOptions();
                  copyLogo();
                }}><ToolbarIcon name="copy" />Copiar código</button>
              )}
              <button type="button" className="kl-secondary" disabled={!image.canExport} onClick={() => {
                closeFileOptions();
                image.onExport();
              }}><ToolbarIcon name="image" />Guardar imagen</button>
              <button type="button" className="kl-secondary" onClick={() => {
                closeFileOptions();
                reference.onOpen();
              }}><ToolbarIcon name="book" />Referencia Logo</button>
              <button type="button" className="kl-secondary" disabled={editorLocked} onClick={() => {
                fileOptionsRef.current.open = false;
                gallery.setOpen(true);
              }}><ToolbarIcon name="gallery" />Galería de programas</button>
              <button type="button" className="kl-secondary" aria-pressed={presenting} onClick={() => {
                closeFileOptions();
                if (presenting) stopPresenting();
                else startPresenting();
              }}><ToolbarIcon name="present" />{presenting ? "Salir de la presentación" : "Modo presentación"}</button>
              <div className="kl-text-size" role="group" aria-label="Tamaño del texto">
                <span>Texto</span>
                <button type="button" className="kl-secondary" aria-label="Texto más pequeño" title="Texto más pequeño"
                  disabled={textSize === textSizes[0]} onClick={() => changeTextSize(-1)}>A−</button>
                <output aria-live="polite">{Math.round(textSize * 100)}{"\u00a0"}%</output>
                <button type="button" className="kl-secondary" aria-label="Texto más grande" title="Texto más grande"
                  disabled={textSize === textSizes.at(-1)} onClick={() => changeTextSize(1)}>A+</button>
              </div>
            </div>
          </details>
        </div>
        <input type="file" ref={fileInputRef} accept=".logo" hidden onChange={event => openLogo(event, editorLocked)} />
        {image.preview && (
          <ImageExport image={image.preview} canDownload={canDownloadFile}
            onClose={() => { image.onClose(); fileOptionsButtonRef.current?.focus(); }} />
        )}
        {gallery.open && (
          <ProjectGallery otherExamples={gallery.otherExamples}
            onOpen={key => { gallery.setOpen(false); gallery.onSelect(key); }}
            onClose={() => {
              const opener = gallery.open instanceof Element ? gallery.open : fileOptionsButtonRef.current;
              gallery.setOpen(false);
              opener?.focus();
            }} />
        )}
      </div>
      {(showKeyInput || runMessage || fileStatus) && (
        <div className="kl-toolbar-feedback">
          {showKeyInput ? (
            <span className="kl-key-input kl-muted" role="group" aria-label="Entrada de teclado"
              aria-disabled={phase !== "key"} tabIndex={0} ref={keyInputRef}>Pulsa una tecla para continuar.</span>
          ) : runMessage && <span className="kl-muted">{runMessage}</span>}
          {fileStatus && <span className="kl-muted" role="status">{fileStatus}</span>}
        </div>
      )}
    </>
  );
}
