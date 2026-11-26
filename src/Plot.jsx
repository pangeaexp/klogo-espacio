import { useEffect, useRef, useState } from "react";
import { countLabels, countVisible, drawPlot } from "./plot.js";

export function Plot({ drawing, count, onPick, pickLabels = false, target = null }) {
  const canvas = useRef(null);
  const labelTargets = useRef(null);
  // Turtle coordinates under the pointer, shown next to it. A touch keeps
  // them for a moment after the finger lifts.
  const [pointer, setPointer] = useState(null);
  const touchTimer = useRef(0);
  useEffect(() => () => clearTimeout(touchTimer.current), []);
  const track = event => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const py = event.clientY - box.top;
    const point = event.currentTarget.klogoInvert?.(px, py);
    if (!point) return;
    clearTimeout(touchTimer.current);
    setPointer({ x: Math.round(point.x) + 0, y: Math.round(point.y) + 0, px, py, width: box.width, height: box.height });
  };
  const leave = event => {
    if (event.pointerType !== "touch") {
      setPointer(null);
      return;
    }
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setPointer(null), 1500);
  };
  const pointerProps = { onPointerMove: track, onPointerDown: track, onPointerLeave: leave, onPointerCancel: leave };
  // Above and to the right of the pointer, kept inside the canvas.
  const coords = pointer && (
    <output className="kl-coords" aria-hidden="true" style={{
      left: Math.min(pointer.px + 12, pointer.width - 118),
      top: pointer.py < 40 ? pointer.py + 18 : pointer.py - 34,
    }}>x {pointer.x}  y {pointer.y}</output>
  );
  useEffect(() => {
    const element = canvas.current;
    const paint = () => { labelTargets.current = drawPlot(element, drawing, pickLabels, target); };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, [drawing, pickLabels, target]);

  const labels = countLabels(drawing?.events);
  const fills = countVisible(drawing?.events, "fill");
  const extras = [
    fills && `${fills} ${fills === 1 ? "relleno" : "rellenos"}`,
    labels && `${labels} ${labels === 1 ? "rótulo" : "rótulos"}`,
  ].filter(Boolean);
  const label = drawing
    ? `Lienzo de tortuga con ${count} ${count === 1 ? "trazo visible" : "trazos visibles"}${extras.length ? ` y ${extras.join(" y ")}` : ""}`
    : "Lienzo de tortuga al inicio";
  const fullLabel = target ? `${label}, con el dibujo objetivo del reto en discontinua` : label;
  // While LEECLIC waits, a click (or Intro on the focused canvas, at its centre)
  // answers with turtle coordinates rounded to one decimal.
  const pick = (px, py) => {
    const label = labelTargets.current?.findLast(({ left, right, top, bottom }) =>
      px >= left && px <= right && py >= top && py <= bottom);
    const point = label?.at ?? canvas.current.klogoInvert?.(px, py);
    if (!point) return;
    const round = value => Math.round(value * 10) / 10 + 0;
    onPick(round(point.x), round(point.y));
  };
  if (!onPick) return <>
    <canvas ref={canvas} className="kl-canvas" role="img" aria-label={fullLabel} {...pointerProps} />
    {coords}
  </>;
  return <>
    <canvas ref={canvas} className="kl-canvas kl-canvas-pick" role="button" tabIndex={0} {...pointerProps}
    aria-label={`${fullLabel}. Haz clic para elegir un punto`}
    onClick={event => {
      const box = event.currentTarget.getBoundingClientRect();
      pick(event.clientX - box.left, event.clientY - box.top);
    }}
    onKeyDown={event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const box = event.currentTarget.getBoundingClientRect();
      pick(box.width / 2, box.height / 2);
    }} />
    {coords}
  </>;
}

export function visibleTraces(events) {
  let count = 0;
  for (const event of events) {
    if (event.type === "clear") count = 0;
    if ((event.type === "move" && event.pen_down) || event.type === "arc") count += 1;
  }
  return count;
}
