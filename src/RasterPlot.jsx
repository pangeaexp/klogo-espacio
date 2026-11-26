import { useEffect, useRef, useState } from "react";

export function mergeRaster(previous, update) {
  const { width, height, palette, reset } = update;
  const rows = reset || !previous || previous.width !== width || previous.height !== height
    ? Array(height).fill(null)
    : previous.rows.slice();
  for (const { y, indices } of update.rows) rows[y] = indices;
  return { width, height, palette, rows };
}

function pointInImage(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  };
}

function regionBetween(start, end) {
  const size = Math.max(Math.abs(start.x - end.x), Math.abs(start.y - end.y));
  // Equal fractions of both axes preserve the aspect ratio of the image.
  const fit = center => Math.max(0, Math.min(1 - size, center - size / 2));
  return { x: fit((start.x + end.x) / 2), y: fit((start.y + end.y) / 2), size };
}

export function RasterPlot({ raster, onSelectRegion, onPixelClick, children }) {
  const canvas = useRef(null);
  const drag = useRef(null);
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const { width, height, palette, rows } = raster;
    const context = canvas.current.getContext("2d");
    if (!context) return;
    const image = context.createImageData(width, height);
    const colors = palette.map(color => [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
      255,
    ]);
    for (let y = 0; y < height; y += 1) {
      const row = rows[y];
      for (let x = 0; x < width; x += 1) {
        image.data.set(colors[row?.[x] ?? 0], (y * width + x) * 4);
      }
    }
    context.putImageData(image, 0, 0);
  }, [raster]);

  function startSelection(event) {
    if (!onSelectRegion || event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, start: pointInImage(event) };
  }

  function moveSelection(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    setSelection(regionBetween(drag.current.start, pointInImage(event)));
  }

  function clearSelection(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setSelection(null);
  }

  function finishSelection(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const region = regionBetween(drag.current.start, pointInImage(event));
    clearSelection(event);
    const { width, height } = event.currentTarget.getBoundingClientRect();
    if (region.size * Math.min(width, height) >= 8 && region.size < 1) {
      onSelectRegion?.(region);
    }
  }

  return (
    <div className="kl-raster-area">
      <div className="kl-raster-frame" style={{ "--kl-ratio": raster.width / raster.height }}>
        <canvas
          ref={canvas}
          className={onSelectRegion || onPixelClick ? "kl-raster kl-raster-zoom" : "kl-raster"}
          width={raster.width}
          height={raster.height}
          role="img"
          aria-label={`Imagen de ${raster.width} por ${raster.height} píxeles`}
          aria-describedby={onSelectRegion ? "klogo-zoom-instructions" : undefined}
          onPointerDown={startSelection}
          onPointerMove={moveSelection}
          onPointerUp={finishSelection}
          onPointerCancel={clearSelection}
          onLostPointerCapture={clearSelection}
          onClick={onPixelClick && (event => {
            // LEECLIC on LIENZO answers with the pixel column and row, from 0.
            const box = event.currentTarget.getBoundingClientRect();
            const column = Math.floor((event.clientX - box.left) / box.width * raster.width);
            const row = Math.floor((event.clientY - box.top) / box.height * raster.height);
            onPixelClick(Math.min(raster.width - 1, Math.max(0, column)), Math.min(raster.height - 1, Math.max(0, row)));
          })}
        />
        {selection && onSelectRegion && (
          <div className="kl-raster-selection" aria-hidden="true" style={{
            left: `${selection.x * 100}%`, top: `${selection.y * 100}%`,
            width: `${selection.size * 100}%`, height: `${selection.size * 100}%`,
          }} />
        )}
        {children}
      </div>
    </div>
  );
}
