const background = "#0e2325";
const defaultInk = "#76f2bf";
const depthTolerance = 1e-6;

function rgb(color) {
  const value = Number.parseInt(color.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

// An orthographic camera makes depth linear across each projected triangle.
export function paintSolids(context, faces, lines, scaleX, scaleY) {
  const { width, height } = context.canvas;
  const image = context.createImageData(width, height);
  const { data } = image;
  const depths = new Float32Array(width * height).fill(Infinity);
  const [r, g, b] = rgb(background);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = 255;
  }

  const devicePoint = ({ x, y, z }) => ({ x: x * scaleX, y: y * scaleY, z });
  function pixel(index, z, color) {
    // Match the buffer precision so shared edges resolve in a consistent order.
    if (z > depths[index] + 1e-7) return;
    depths[index] = z;
    const start = index * 4;
    data[start] = color[0];
    data[start + 1] = color[1];
    data[start + 2] = color[2];
  }

  function triangle(a, b, c, color) {
    const bx = b.x - a.x;
    const by = b.y - a.y;
    const cx = c.x - a.x;
    const cy = c.y - a.y;
    const area = bx * cy - by * cx;
    if (Math.abs(area) < 1e-9) return;

    const left = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
    const right = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
    const top = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
    const bottom = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
    const db = b.z - a.z;
    const dc = c.z - a.z;
    for (let y = top; y <= bottom; y++) {
      const dy = y + 0.5 - a.y;
      for (let x = left; x <= right; x++) {
        const dx = x + 0.5 - a.x;
        const u = (dx * cy - dy * cx) / area;
        const v = (bx * dy - by * dx) / area;
        if (u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9) {
          pixel(y * width + x, a.z + u * db + v * dc, color);
        }
      }
    }
  }

  for (const face of faces) {
    const vertices = face.vertices.map(devicePoint);
    const color = rgb(face.color);
    for (let i = 1; i + 1 < vertices.length; i++) {
      triangle(vertices[0], vertices[i], vertices[i + 1], color);
    }
  }

  function stroke({ start, finish, color = defaultInk, width: lineWidth = 2 }) {
    const a = devicePoint(start);
    const b = devicePoint(finish);
    const radius = lineWidth * (scaleX + scaleY) / 4;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const squaredLength = dx * dx + dy * dy;
    const top = Math.max(0, Math.floor(Math.min(a.y, b.y) - radius));
    const bottom = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y) + radius));
    const ink = rgb(color);
    for (let y = top; y <= bottom; y++) {
      // Only scan where the centerline lies within one radius of this row.
      const row = y + 0.5 - a.y;
      const t0 = dy === 0 ? 0 : Math.max(0, Math.min(1, (row - radius) / dy));
      const t1 = dy === 0 ? 1 : Math.max(0, Math.min(1, (row + radius) / dy));
      const x0 = a.x + dx * t0;
      const x1 = a.x + dx * t1;
      const left = Math.max(0, Math.floor(Math.min(x0, x1) - radius));
      const right = Math.min(width - 1, Math.ceil(Math.max(x0, x1) + radius));
      for (let x = left; x <= right; x++) {
        const offset = x + 0.5 - a.x;
        const t = squaredLength === 0 ? 0 : Math.max(0, Math.min(1, (offset * dx + row * dy) / squaredLength));
        if ((offset - dx * t) ** 2 + (row - dy * t) ** 2 <= radius * radius) {
          pixel(y * width + x, a.z + t * (b.z - a.z) - depthTolerance, ink);
        }
      }
    }
  }

  for (const line of lines) stroke(line);
  context.putImageData(image, 0, 0);
  return point => {
    const projected = devicePoint(point);
    const x = Math.floor(projected.x);
    const y = Math.floor(projected.y);
    return x >= 0 && x < width && y >= 0 && y < height
      && point.z <= depths[y * width + x] + 0.003;
  };
}
