import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box3, OrthographicCamera, Vector3 } from "three";
import { paintSolids } from "./solid-plot.js";

const initialView = { azimuth: 45, elevation: 30 };
const viewpoints = [
  { label: "Girar a la izquierda", symbol: "←", azimuth: -15, elevation: 0 },
  { label: "Girar a la derecha", symbol: "→", azimuth: 15, elevation: 0 },
  { label: "Elevar vista", symbol: "↑", azimuth: 0, elevation: 12 },
  { label: "Bajar vista", symbol: "↓", azimuth: 0, elevation: -12 },
];

function frameDrawing(segments, faces, position) {
  // Scale first so projecting widely separated Logo coordinates cannot overflow.
  const coordinates = point => Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
  let magnitude = Math.max(1, coordinates(position));
  for (const { from, to } of segments) {
    magnitude = Math.max(magnitude, coordinates(from), coordinates(to));
  }
  for (const { vertices } of faces) {
    for (const vertex of vertices) magnitude = Math.max(magnitude, coordinates(vertex));
  }
  const vector = ({ x, y, z }) => new Vector3(x / magnitude, y / magnitude, z / magnitude);
  const turtle = vector(position);
  const bounds = new Box3().expandByPoint(turtle);
  const include = point => {
    const vertex = vector(point);
    bounds.expandByPoint(vertex);
    return vertex;
  };
  const lines = segments.map(segment => ({ ...segment, from: include(segment.from), to: include(segment.to) }));
  const polygons = faces.map(face => ({ ...face, vertices: face.vertices.map(include) }));
  const center = bounds.getCenter(new Vector3());
  const radius = Math.max(bounds.getSize(new Vector3()).length() / 2, 1e-12);
  return { lines, polygons, turtle, center, radius };
}

function paintSpatial(canvas, framing, view, heading, pitch, roll, penDown, showTurtle = true) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  context.fillStyle = "#0e2325";
  context.fillRect(0, 0, width, height);

  const { lines, polygons, turtle, center, radius } = framing;
  const padding = Math.min(30, width / 5, height / 5);
  const scale = (Math.min(width, height) - padding * 2) / (radius * 2);
  const halfWidth = width / (2 * scale);
  const halfHeight = height / (2 * scale);
  const camera = new OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, radius / 10, radius * 8);
  const azimuth = view.azimuth * Math.PI / 180;
  const elevation = view.elevation * Math.PI / 180;
  camera.up.set(0, 0, 1);
  camera.position.set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation))
    .multiplyScalar(radius * 4).add(center);
  camera.lookAt(center);
  camera.updateMatrixWorld();

  const projection = new Vector3();
  function project(point) {
    projection.copy(point).project(camera);
    return { x: (projection.x + 1) * width / 2, y: (1 - projection.y) * height / 2, z: projection.z };
  }

  const projected = lines.map(({ from, to, color, width }) => {
    const start = project(from);
    const finish = project(to);
    return { start, finish, depth: (start.z + finish.z) / 2, color, width };
  });

  context.lineCap = "round";
  if (polygons.length) {
    const faces = polygons.map(face => ({ ...face, vertices: face.vertices.map(project) }));
    const visible = paintSolids(context, faces, projected, pixelWidth / width, pixelHeight / height);
    if (!visible(project(turtle))) return;
  } else {
    projected.sort((a, b) => b.depth - a.depth);
    for (const { start, finish, color, width } of projected) {
      context.strokeStyle = color ?? "#76f2bf";
      context.lineWidth = width ?? 2;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(finish.x, finish.y);
      context.stroke();
    }
  }

  if (!showTurtle) return;
  const direction = heading * Math.PI / 180;
  const inclination = pitch * Math.PI / 180;
  const bank = roll * Math.PI / 180;
  const level = Math.cos(inclination);
  const rise = Math.sin(inclination);
  const forward = new Vector3(Math.sin(direction) * level, Math.cos(direction) * level, rise);
  const right = new Vector3(Math.cos(direction), -Math.sin(direction), 0);
  const up = new Vector3(-Math.sin(direction) * rise, -Math.cos(direction) * rise, level);
  const lateral = right.clone().multiplyScalar(Math.cos(bank)).addScaledVector(up, -Math.sin(bank));
  const dorsal = up.multiplyScalar(Math.cos(bank)).addScaledVector(right, Math.sin(bank));
  const marker = (along, across, above = 0) => project(turtle.clone()
    .addScaledVector(forward, along / scale)
    .addScaledVector(lateral, across / scale)
    .addScaledVector(dorsal, above / scale));
  const [tip, leftWing, tail, rightWing] = [marker(11, 0), marker(-6, -7), marker(-3, 0), marker(-6, 7)];
  context.beginPath();
  context.moveTo(tip.x, tip.y);
  context.lineTo(leftWing.x, leftWing.y);
  context.lineTo(tail.x, tail.y);
  context.lineTo(rightWing.x, rightWing.y);
  context.closePath();
  context.fillStyle = penDown ? "#f3f7e9" : "#0e2325";
  context.strokeStyle = penDown ? "#0e2325" : "#f3f7e9";
  context.lineWidth = 1.5;
  context.fill();
  context.stroke();
  const fin = marker(-2, 0, 5);
  const body = marker(-2, 0);
  context.beginPath();
  context.moveTo(body.x, body.y);
  context.lineTo(fin.x, fin.y);
  context.strokeStyle = "#ffc36b";
  context.stroke();
}

export function SpatialPlot({ segments, faces, description, turtle, penDown, showTurtle = true }) {
  const [view, setView] = useState(initialView);
  const canvas = useRef(null);
  const redraw = useRef(null);
  const drag = useRef(null);
  const framing = useMemo(() => frameDrawing(segments, faces, turtle.position), [segments, faces, turtle.position]);
  const { heading, pitch = 0, roll = 0 } = turtle;

  useLayoutEffect(() => {
    const target = canvas.current;
    redraw.current = () => paintSpatial(target, framing, view, heading, pitch, roll, penDown, showTurtle);
    redraw.current();
  }, [framing, view, heading, pitch, roll, penDown, showTurtle]);

  useEffect(() => {
    const observer = new ResizeObserver(() => redraw.current?.());
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);

  function turn(azimuth, elevation) {
    setView(current => ({
      azimuth: (current.azimuth + azimuth) % 360,
      elevation: Math.max(-80, Math.min(80, current.elevation + elevation)),
    }));
  }

  return (
    <div className="kl-spatial">
      <canvas ref={canvas} className="kl-spatial-canvas" role="img"
        aria-label={`Lienzo de tortuga 3D con ${description}`}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }} onPointerMove={event => {
          const previous = drag.current;
          if (previous?.id !== event.pointerId) return;
          turn((previous.x - event.clientX) * 0.5, (event.clientY - previous.y) * 0.5);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }} onLostPointerCapture={() => { drag.current = null; }} />
      <div className="kl-spatial-actions" role="group" aria-label="Cámara 3D">
        {viewpoints.map(({ label, symbol, azimuth, elevation }) => (
          <button key={label} type="button" className="kl-secondary" aria-label={label} title={label}
            onClick={() => turn(azimuth, elevation)}>{symbol}</button>
        ))}
        <button type="button" className="kl-secondary" onClick={() => setView(initialView)}>Restablecer vista</button>
      </div>
    </div>
  );
}
