import { useEffect, useRef, useState } from "react";

// Moves per second for each speed. "instant" shows every event at once.
// "auto", the default, draws slowly enough to follow a short program and
// speeds up so that no drawing takes more than `autoSeconds`.
const autoSeconds = 5;
const autoMinimum = 3;
export const turtleSpeeds = [
  { id: "auto", label: "Automática", movesPerSecond: total => Math.max(autoMinimum, total / autoSeconds) },
  { id: "instant", label: "Instantánea" },
  { id: "fast", label: "Rápida", movesPerSecond: 40 },
  { id: "normal", label: "Normal", movesPerSecond: 12 },
  { id: "slow", label: "Lenta", movesPerSecond: 4 },
];

const speedStorageKey = "klogo.turtle.speed.v1";

export function restoreSpeed() {
  try {
    const saved = window.localStorage.getItem(speedStorageKey);
    if (turtleSpeeds.some(speed => speed.id === saved)) return saved;
  } catch {
    // The web viewer blocks local storage: start with the default every time.
  }
  return "auto";
}

export function saveSpeed(id) {
  try {
    window.localStorage.setItem(speedStorageKey, id);
  } catch {
    // Not kept between visits when storage is unavailable.
  }
}

const isMove = event => event.type === "move" || event.type === "move3" || event.type === "arc";
// An arc takes as long as one move per 45°, so a circle lasts eight moves.
const cost = event => event.type === "arc" ? Math.max(1, Math.abs(event.angle) / 45) : 1;
const lerp = (a, b, t) => a + (b - a) * t;
const degrees = radians => (radians * 180 / Math.PI + 360) % 360;

function point(from, to, t) {
  const result = { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
  if (from.z !== undefined) result.z = lerp(from.z, to.z, t);
  return result;
}

// The drawing as it looks after `shown` events plus a fraction of the next move.
function partialDrawing(drawing, shown, partial) {
  const events = drawing.events.slice(0, shown);
  const next = drawing.events[shown];
  let last = null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (isMove(events[i])) {
      last = events[i];
      break;
    }
  }
  if (next && isMove(next) && partial > 0) {
    last = next.type === "arc"
      ? { ...next, angle: next.angle * partial }
      : { ...next, to: point(next.from, next.to, partial) };
    events.push(last);
  }

  const turtle = { ...drawing.turtle, visible: true };
  let spatial = drawing.spatial;
  if (last?.type === "arc") {
    // ARCO draws around the turtle without moving it.
    turtle.position = last.center;
    turtle.heading = last.heading;
    turtle.pen_down = true;
  } else if (last?.type === "move") {
    const dx = last.to.x - last.from.x;
    const dy = last.to.y - last.from.y;
    turtle.position = last.to;
    turtle.pen_down = last.pen_down;
    if (dx || dy) turtle.heading = degrees(Math.atan2(dx, dy));
  } else if (last?.type === "move3" && spatial) {
    const dx = last.to.x - last.from.x;
    const dy = last.to.y - last.from.y;
    const dz = last.to.z - last.from.z;
    spatial = { ...spatial, position: last.to, roll: 0 };
    turtle.pen_down = last.pen_down;
    if (dx || dy) spatial.heading = degrees(Math.atan2(dx, dy));
    if (dx || dy || dz) spatial.pitch = Math.atan2(dz, Math.hypot(dx, dy)) * 180 / Math.PI;
  } else if (!last) {
    turtle.position = { x: 0, y: 0 };
    turtle.heading = 0;
    if (spatial) spatial = { ...spatial, position: { x: 0, y: 0, z: 0 }, heading: 0, pitch: 0, roll: 0 };
  }
  return { ...drawing, events, turtle, spatial };
}

// Reveals the moves of `drawing` one by one at the chosen speed. A new `runId`
// starts from an empty canvas; later replies of the same run keep the progress.
// When `enabled` is false the whole drawing shows at once.
export function useTurtleAnimation(drawing, runId, speedId, enabled) {
  const progress = useRef({ runId: null, shown: 0, partial: 0 });
  const [frame, setFrame] = useState(null);
  const request = useRef(0);
  const latest = useRef(drawing);
  latest.current = drawing;
  const speed = turtleSpeeds.find(option => option.id === speedId);

  useEffect(() => {
    const state = progress.current;
    if (state.runId !== runId) {
      state.runId = runId;
      state.shown = 0;
      state.partial = 0;
    }
    const events = drawing?.events ?? [];
    if (!drawing || !enabled || !speed?.movesPerSecond || state.shown >= events.length) {
      state.shown = events.length;
      state.partial = 0;
      setFrame(null);
      return undefined;
    }

    const rate = typeof speed.movesPerSecond === "function"
      ? speed.movesPerSecond(events.reduce((sum, event) => sum + (isMove(event) ? cost(event) : 0), 0))
      : speed.movesPerSecond;
    let last = performance.now();
    const tick = now => {
      let budget = Math.min(now - last, 250) / 1000 * rate;
      last = now;
      while (budget > 0 && state.shown < events.length) {
        if (!isMove(events[state.shown])) {
          state.shown += 1;
          continue;
        }
        const length = cost(events[state.shown]);
        const left = length * (1 - state.partial);
        if (budget >= left) {
          budget -= left;
          state.shown += 1;
          state.partial = 0;
        } else {
          state.partial += budget / length;
          budget = 0;
        }
      }
      if (state.shown >= events.length) {
        setFrame(null);
        return;
      }
      setFrame({ shown: state.shown, partial: state.partial });
      request.current = requestAnimationFrame(tick);
    };
    setFrame({ shown: state.shown, partial: state.partial });
    request.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request.current);
  }, [drawing, runId, speed, enabled]);

  // Shows the rest of the drawing at once (Detener after the program ended).
  const finish = () => {
    cancelAnimationFrame(request.current);
    progress.current.shown = latest.current?.events.length ?? 0;
    progress.current.partial = 0;
    setFrame(null);
  };

  if (!drawing || !frame) return { drawing, animating: false, finish };
  return { drawing: partialDrawing(drawing, frame.shown, frame.partial), animating: true, finish };
}
