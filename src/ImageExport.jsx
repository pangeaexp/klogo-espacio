import { useEffect, useRef, useState } from "react";
import { ToolbarIcon } from "./ToolbarIcon.jsx";

// The visible plot canvas as a PNG data URL. Pixel canvases (LIENZO) are tiny,
// so they are enlarged without smoothing to keep their square pixels.
export function plotImage(canvas) {
  if (!canvas?.width || !canvas.height) return null;
  const factor = canvas.width < 640 ? Math.min(16, Math.ceil(640 / canvas.width)) : 1;
  if (factor === 1) return canvas.toDataURL("image/png");
  const copy = document.createElement("canvas");
  copy.width = canvas.width * factor;
  copy.height = canvas.height * factor;
  const context = copy.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.drawImage(canvas, 0, 0, copy.width, copy.height);
  return copy.toDataURL("image/png");
}

export function ImageExport({ image, canDownload, onClose }) {
  const [status, setStatus] = useState("");
  const firstButton = useRef(null);
  useEffect(() => { firstButton.current?.focus(); }, []);
  const canCopy = typeof window !== "undefined" && "ClipboardItem" in window && Boolean(navigator.clipboard?.write);

  function download() {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = image.name;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(`Imagen guardada como ${image.name}.`);
  }

  async function copy() {
    try {
      const blob = await (await fetch(image.url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setStatus("Imagen copiada. Pégala en otra aplicación.");
    } catch {
      setStatus("Este navegador no deja copiar la imagen aquí. Guárdala desde la propia imagen.");
    }
  }

  return (
    <div className="kl-image-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="kl-image-dialog" role="dialog" aria-modal="true" aria-labelledby="klogo-image-title"
        onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }}>
        <h2 id="klogo-image-title" className="kl-pane-title">Imagen del dibujo</h2>
        <img className="kl-image-preview" src={image.url} alt="Dibujo de KLogo" width={image.width} height={image.height} />
        <p className="kl-muted">
          {canDownload
            ? "Descárgala como PNG o cópiala."
            : "Esta vista no permite descargas. Haz clic derecho en la imagen, o mantenla pulsada, y elige Guardar imagen."}
        </p>
        <div className="kl-image-actions">
          {canDownload && (
            <button type="button" ref={firstButton} className="kl-run" onClick={download}>
              <ToolbarIcon name="download" />Descargar PNG</button>
          )}
          {canCopy && (
            <button type="button" ref={canDownload ? undefined : firstButton} className="kl-secondary" onClick={copy}>
              <ToolbarIcon name="copy" />Copiar imagen</button>
          )}
          <button type="button" ref={canDownload || canCopy ? undefined : firstButton} className="kl-secondary" onClick={onClose}>
            Cerrar</button>
        </div>
        <span className="kl-muted" role="status">{status}</span>
      </div>
    </div>
  );
}
