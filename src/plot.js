const initialTurtle = { position: { x: 0, y: 0 }, heading: 0, pen_down: true };

// How many events of `type` are still visible (BORRARPANTALLA starts again).
export function countVisible(events, type) {
  let count = 0;
  for (const event of events ?? []) {
    if (event.type === "clear") count = 0;
    if (event.type === type) count += 1;
  }
  return count;
}

export const countLabels = events => countVisible(events, "label");

// Points along an ARCO event, in drawing units, to frame it.
export function arcPoints({ center, radius, heading, angle }) {
  const steps = Math.max(2, Math.ceil(Math.abs(angle) / 10));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const theta = (heading + angle * i / steps) * Math.PI / 180;
    return { x: center.x + radius * Math.sin(theta), y: center.y + radius * Math.cos(theta) };
  });
}

function parseColor(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [value >> 16 & 255, value >> 8 & 255, value & 255];
}

// Scanline flood fill on an RGBA buffer. From an empty (mostly transparent)
// pixel it fills every connected empty pixel, so strokes are the walls; from
// an inked pixel it recolors the connected pixels of about the same color.
function floodFill(image, startX, startY, [red, green, blue]) {
  const { width, height, data } = image;
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;
  const start = (startY * width + startX) * 4;
  const empty = data[start + 3] < 128;
  const [r0, g0, b0] = [data[start], data[start + 1], data[start + 2]];
  if (!empty && Math.abs(r0 - red) + Math.abs(g0 - green) + Math.abs(b0 - blue) < 6) return;
  const matches = index => empty
    ? data[index + 3] < 128
    : data[index + 3] >= 128 && Math.abs(data[index] - r0) + Math.abs(data[index + 1] - g0) + Math.abs(data[index + 2] - b0) < 48;
  const paint = index => {
    data[index] = red;
    data[index + 1] = green;
    data[index + 2] = blue;
    data[index + 3] = 255;
  };
  const stack = [startX, startY];
  while (stack.length) {
    const y = stack.pop();
    let x = stack.pop();
    let index = (y * width + x) * 4;
    if (!matches(index)) continue;
    while (x > 0 && matches(index - 4)) {
      x -= 1;
      index -= 4;
    }
    let above = false;
    let below = false;
    for (; x < width && matches(index); x += 1, index += 4) {
      paint(index);
      if (y > 0) {
        const up = matches(index - width * 4);
        if (up && !above) stack.push(x, y - 1);
        above = up;
      }
      if (y < height - 1) {
        const down = matches(index + width * 4);
        if (down && !below) stack.push(x, y + 1);
        below = down;
      }
    }
  }
}

// `target` (optional): polylines of flat [x0, y0, x1, y1, …] drawn faint and
// dashed under the program's strokes, the drawing a challenge asks for.
export function drawPlot(canvas, drawing, pickLabels = false, target = null) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const density = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(density, 0, 0, density, 0, 0);
  const turtle = drawing?.turtle ?? initialTurtle;
  const segments = [];
  // Strokes and fills in program order: a fill only sees the strokes before it.
  const inks = [];
  const labels = [];
  let background;
  for (const event of drawing?.events ?? []) {
    if (event.type === "clear") {
      segments.length = 0;
      inks.length = 0;
      labels.length = 0;
    }
    if ((event.type === "move" && event.pen_down) || event.type === "arc") {
      segments.push(event);
      inks.push(event);
    }
    if (event.type === "fill") inks.push(event);
    if (event.type === "label") labels.push(event);
    if (event.type === "background") background = event.color;
  }
  ctx.fillStyle = background ?? "#0e2325";
  ctx.fillRect(0, 0, width, height);

  let minX = Math.min(-40, turtle.position.x);
  let maxX = Math.max(40, turtle.position.x);
  let minY = Math.min(-40, turtle.position.y);
  let maxY = Math.max(40, turtle.position.y);
  for (const segment of segments) {
    const points = segment.type === "arc" ? arcPoints(segment) : [segment.from, segment.to];
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }
  for (const line of target ?? []) {
    for (let i = 0; i < line.length; i += 2) {
      minX = Math.min(minX, line[i]);
      maxX = Math.max(maxX, line[i]);
      minY = Math.min(minY, line[i + 1]);
      maxY = Math.max(maxY, line[i + 1]);
    }
  }
  for (const { at } of labels) {
    minX = Math.min(minX, at.x);
    maxX = Math.max(maxX, at.x);
    minY = Math.min(minY, at.y);
    maxY = Math.max(maxY, at.y);
  }

  // Normalize before subtracting so even coordinates near Number.MAX_VALUE fit.
  const magnitude = Math.max(Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY));
  const midX = (minX / magnitude + maxX / magnitude) / 2;
  const midY = (minY / magnitude + maxY / magnitude) / 2;
  const spanX = maxX / magnitude - minX / magnitude;
  const spanY = maxY / magnitude - minY / magnitude;
  const padding = Math.min(36, width / 5, height / 5);
  // Labels run to the right of their point: keep room for the widest one.
  const labelFont = '600 15px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.font = labelFont;
  const labelRoom = Math.min(width / 2, Math.max(0, ...labels.map(({ text }) => ctx.measureText(text).width + 4 - padding)));
  const scale = Math.min((width - padding * 2 - labelRoom) / spanX, (height - padding * 2) / spanY);
  const projectX = (x) => (width - labelRoom) / 2 + (x / magnitude - midX) * scale;
  const projectY = (y) => height / 2 - (y / magnitude - midY) * scale;
  const originX = projectX(0);
  const originY = projectY(0);
  // LEECLIC turns a click in CSS pixels back into turtle coordinates.
  canvas.klogoInvert = (px, py) => ({
    x: ((px - (width - labelRoom) / 2) / scale + midX) * magnitude,
    y: ((height / 2 - py) / scale + midY) * magnitude,
  });

  // A custom background is a clean sheet: no grid or axes over it.
  if (background === undefined) {
    ctx.beginPath();
    for (let x = originX % 24; x < width; x += 24) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = originY % 24; y < height; y += 24) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.strokeStyle = "#193638";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.strokeStyle = "#2e5151";
    ctx.stroke();
  }

  if (target?.length) {
    ctx.save();
    ctx.beginPath();
    for (const line of target) {
      ctx.moveTo(projectX(line[0]), projectY(line[1]));
      for (let i = 2; i < line.length; i += 2) ctx.lineTo(projectX(line[i]), projectY(line[i + 1]));
    }
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = background === undefined ? "#ffd16680" : "#88888899";
    ctx.stroke();
    ctx.restore();
  }

  // With RELLENA the ink goes to its own layer, so the background and the grid
  // are not walls for the fill. Without it, strokes go straight to the canvas.
  const hasFill = inks.length !== segments.length;
  const layer = hasFill ? document.createElement("canvas") : null;
  const inkCtx = layer ? layer.getContext("2d") : ctx;
  if (layer) {
    layer.width = canvas.width;
    layer.height = canvas.height;
    inkCtx.setTransform(density, 0, 0, density, 0, 0);
  }
  inkCtx.lineCap = "round";
  let ink;
  let strokeWidth;
  for (const event of inks) {
    if (event.type === "fill") {
      if (ink !== undefined) inkCtx.stroke();
      ink = undefined;
      strokeWidth = undefined;
      const image = inkCtx.getImageData(0, 0, layer.width, layer.height);
      floodFill(image, Math.floor(projectX(event.at.x) * density), Math.floor(projectY(event.at.y) * density),
        parseColor(event.color ?? "#76f2bf"));
      inkCtx.putImageData(image, 0, 0);
      continue;
    }
    const { color = "#76f2bf", width = 2 } = event;
    if (color !== ink || width !== strokeWidth) {
      if (ink !== undefined) inkCtx.stroke();
      inkCtx.beginPath();
      inkCtx.strokeStyle = color;
      inkCtx.lineWidth = width;
      ink = color;
      strokeWidth = width;
    }
    if (event.type === "arc") {
      // Logo headings start at the top and turn clockwise; canvas angles start
      // at the right and, with y pointing down, also turn clockwise.
      const { center, radius, heading, angle } = event;
      const start = (heading - 90) * Math.PI / 180;
      const end = (heading + angle - 90) * Math.PI / 180;
      const x = projectX(center.x);
      const y = projectY(center.y);
      const r = radius * scale / magnitude;
      inkCtx.moveTo(x + r * Math.cos(start), y + r * Math.sin(start));
      inkCtx.arc(x, y, r, start, end, angle < 0);
      continue;
    }
    const { from, to } = event;
    inkCtx.moveTo(projectX(from.x), projectY(from.y));
    inkCtx.lineTo(projectX(to.x), projectY(to.y));
  }
  if (ink !== undefined) inkCtx.stroke();
  if (layer) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  ctx.font = labelFont;
  ctx.textBaseline = "bottom";
  const labelTargets = pickLabels ? [] : null;
  for (const { at, text, color = "#76f2bf" } of labels) {
    ctx.fillStyle = color;
    // Keep the text inside the canvas even when it is wider than the reserved room.
    const textWidth = ctx.measureText(text).width;
    const x = Math.max(4, Math.min(projectX(at.x) + 6, width - textWidth - 4));
    const y = Math.max(19, projectY(at.y) - 5);
    ctx.fillText(text, x, y);
    labelTargets?.push({ at, left: x - 4, right: x + textWidth + 4, top: y - 18, bottom: y + 4 });
  }

  if (turtle.visible === false) return labelTargets;
  ctx.save();
  ctx.translate(projectX(turtle.position.x), projectY(turtle.position.y));
  ctx.rotate(turtle.heading * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6.5, 7);
  ctx.lineTo(0, 4);
  ctx.lineTo(-6.5, 7);
  ctx.closePath();
  ctx.fillStyle = turtle.pen_down ? "#f3f7e9" : "#0e2325";
  ctx.fill();
  ctx.strokeStyle = turtle.pen_down ? "#0e2325" : "#f3f7e9";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  return labelTargets;
}
