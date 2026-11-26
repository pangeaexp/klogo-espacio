// One challenge per lesson. `check` receives what the run left behind and
// returns true when the challenge is met, or a short hint in Spanish.
// `play: true` marks challenges that are met by playing, not by changing code.
import { getProjectChallenge } from "./projects.js";

const near = (a, b, tolerance = 0.01) => Math.abs(a - b) <= tolerance;
const length = ({ from, to }) => Math.hypot(to.x - from.x, to.y - from.y, (to.z ?? 0) - (from.z ?? 0));
const count = (items, test) => items.filter(test).length;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function lastPrint(prints, pattern) {
  for (let i = prints.length - 1; i >= 0; i -= 1) {
    const match = pattern.exec(prints[i]);
    if (match) return match;
  }
  return null;
}

function tracesHint(moves, wanted) {
  return `Hay ${plural(moves.length, "trazo", "trazos")}; el reto pide ${wanted}.`;
}

function countNumerationBoard(moves, arcs, minY, maxY) {
  // Count packages by their two long edges and loose counters by their centers.
  const edges = new Set(moves.filter(({ from, to }) =>
    from.y >= minY && from.y <= maxY && near(from.y, to.y) &&
    near(Math.min(from.x, to.x), -116) && near(Math.max(from.x, to.x), 4),
  ).map(({ from }) => Math.round(from.y)));
  const packages = [...edges].filter(y => edges.has(y - 14)).length;
  const counters = new Set(arcs.filter(({ center, radius, angle }) =>
    center.y > minY && center.y < maxY && center.x >= 30 && near(radius, 5) && near(Math.abs(angle), 360),
  ).map(({ center }) => `${Math.round(center.x)},${Math.round(center.y)}`));
  return { packages, loose: counters.size };
}

export const challenges = {
  tortuga: {
    goal: "Termina el cuadrado: cuatro lados de 100 que vuelvan al punto de partida.",
    check({ moves, turtle }) {
      if (moves.length < 4) return `Hay ${plural(moves.length, "lado", "lados")}; faltan ${4 - moves.length} para el cuadrado.`;
      if (moves.length > 4) return `Hay ${moves.length} lados; el cuadrado tiene 4. Borra alguna orden.`;
      if (!moves.every(move => near(length(move), 100))) return "Cada lado debe medir 100: usa AVANZA 100.";
      if (!near(turtle.position.x, 0) || !near(turtle.position.y, 0)) return "El cuadrado no se cierra: gira 90 a la derecha antes de cada lado.";
      return true;
    },
  },
  bucles: {
    goal: "Dibuja un triángulo equilátero de lado 100 con REPITE.",
    check({ moves, turtle }) {
      if (moves.length !== 3) return tracesHint(moves, 3);
      if (!moves.every(move => near(length(move), 100))) return "Cada lado debe medir 100.";
      if (!near(turtle.position.x, 0) || !near(turtle.position.y, 0)) return "El triángulo no se cierra: gira 120° en cada vuelta.";
      return true;
    },
  },
  poligonos: {
    goal: "Dibuja un heptágono: siete lados iguales que se cierren.",
    check({ moves, turtle }) {
      if (moves.length !== 7) return tracesHint(moves, 7);
      if (!moves.every(move => near(length(move), length(moves[0])))) return "Los siete lados deben medir lo mismo.";
      if (!near(turtle.position.x, 0, 0.1) || !near(turtle.position.y, 0, 0.1)) return "La figura no se cierra: reparte 360° entre 7.";
      return true;
    },
  },
  variables: {
    goal: "Haz una espiral de 36 trazos en la que cada paso crezca 3 respecto al anterior.",
    check({ moves }) {
      if (moves.length !== 36) return tracesHint(moves, 36);
      const lengths = moves.map(length);
      if (!lengths.slice(1).every((value, i) => near(value - lengths[i], 3))) return "Cada trazo debe medir 3 más que el anterior.";
      return true;
    },
  },
  argumentos: {
    goal: "Añade un cuadrado de lado 60 llamando otra vez a POLIGONO.",
    check({ moves }) {
      if (count(moves, move => near(length(move), 60)) < 4) return "Falta un cuadrado con cuatro lados de 60.";
      if (moves.length < 13) return "Conserva el triángulo y el hexágono.";
      return true;
    },
  },
  desde: {
    goal: "Con DESDE, dibuja diez cuadrados de lado 10, 20, 30… hasta 100.",
    check({ moves }) {
      for (let side = 10; side <= 100; side += 10) {
        if (count(moves, move => near(length(move), side)) < 4) return `Falta el cuadrado de lado ${side}.`;
      }
      return true;
    },
  },
  aleatorio: {
    goal: "Tira dos dados diez veces y escribe la suma de cada tirada (de 2 a 12).",
    check({ prints }) {
      if (prints.length !== 10) return `Hay ${plural(prints.length, "línea", "líneas")} en Salida; el reto pide 10.`;
      if (!prints.every(text => /^\d+$/.test(text) && Number(text) >= 2 && Number(text) <= 12)) return "Cada suma debe estar entre 2 y 12.";
      return true;
    },
  },
  colores: {
    goal: "Pinta cuatro franjas de 15 columnas, cada una de un color distinto.",
    check({ raster }) {
      if (!raster) return "Usa LIENZO para pintar las franjas.";
      for (const row of raster.rows) {
        if (!row) return "Pinta todas las filas.";
        const runs = [];
        for (const index of row) {
          if (runs.length && runs.at(-1).index === index) runs.at(-1).width += 1;
          else runs.push({ index, width: 1 });
        }
        if (runs.length !== 4 || runs.some(run => run.index === 0 || run.width !== 15)) return "Cada fila debe tener cuatro franjas de 15 píxeles.";
        if (new Set(runs.map(run => run.index)).size !== 4) return "Usa cuatro colores distintos.";
      }
      return true;
    },
  },
  rosetaColores: {
    goal: "Usa cuatro tintas y dibuja 16 triángulos que den la vuelta completa.",
    check({ moves, turtle }) {
      if (moves.length !== 48) return tracesHint(moves, "48 (16 triángulos)");
      if (new Set(moves.map(move => move.color)).size !== 4) return "Alterna cuatro tintas distintas.";
      if (!near(turtle.heading % 360, 0, 0.1) && !near(turtle.heading % 360, 360, 0.1)) return "Reparte 360° entre los 16 triángulos.";
      return true;
    },
  },
  grosores: {
    goal: "Añade una cuarta muestra, más abajo, con grosor 20.",
    check({ moves }) {
      if (!moves.some(move => move.width === 20)) return "Ninguna línea tiene grosor 20.";
      if (moves.length !== 4) return tracesHint(moves, 4);
      return true;
    },
  },
  rotulos: {
    goal: "Añade otra parada con su nombre: seis rótulos y cinco tramos.",
    check({ labels, moves }) {
      if (labels.length < 6) return `Hay ${plural(labels.length, "rótulo", "rótulos")}; el reto pide 6.`;
      if (moves.length < 5) return tracesHint(moves, 5);
      return true;
    },
  },
  arcos: {
    goal: "Ponle nariz a la cara: un círculo pequeño relleno de otro color.",
    check({ arcs, fills }) {
      if (arcs.length < 5) return "Falta el círculo de la nariz.";
      if (fills.length < 4) return "Rellena también la nariz.";
      return true;
    },
  },
  relleno: {
    goal: "Dibuja un cuadrado más, al lado, y rellénalo de lila (#c5a6ff).",
    check({ fills }) {
      if (fills.length < 5) return "Falta un quinto relleno.";
      if (!fills.some(fill => fill.color === "#c5a6ff")) return "Usa la tinta #c5a6ff para el relleno nuevo.";
      return true;
    },
  },
  art: {
    goal: "Teje la figura con 10 hilos por abanico en lugar de 16.",
    check({ moves }) {
      return moves.length === 44 ? true : tracesHint(moves, "44 (4 del marco y 10 por abanico)");
    },
  },
  paquetesDeDiez: {
    goal: "Construye el 34 en el tablero de abajo con paquetes de diez y fichas sueltas.",
    check({ moves, arcs }) {
      const { packages, loose } = countNumerationBoard(moves, arcs, -Infinity, -36);
      if (packages === 3 && loose === 4) return true;
      return `Abajo hay ${plural(packages, "paquete", "paquetes")} de diez y ${plural(loose, "ficha suelta", "fichas sueltas")}. ¿Cómo puedes formar el 34?`;
    },
  },
  mismasCifras: {
    goal: "Intercambia el 2 y el 4 para que el 42 quede arriba y el 24 abajo.",
    check({ moves, arcs }) {
      const top = countNumerationBoard(moves, arcs, 0, Infinity);
      const bottom = countNumerationBoard(moves, arcs, -Infinity, -56);
      if (top.packages !== 4 || top.loose !== 2) return "Para poner el 42 arriba, fíjate en qué cifra cuenta los paquetes de diez.";
      if (bottom.packages !== 2 || bottom.loose !== 4) return "Para poner el 24 abajo, dibuja dos paquetes de diez y cuatro fichas sueltas.";
      return true;
    },
  },
  saltaEnLaRecta: {
    goal: "Lleva la tortuga del 8 al 14 con saltos de dos en dos.",
    check({ arcs, turtle }) {
      // On this number line 36 drawing units are one step.
      const correctJumps = arcs.every(({ center, radius, heading, angle }, index) =>
        near(center.x, -72 + 72 * index) && near(center.y, 0) &&
        near(radius, 36) && near(heading, 270) && near(angle, 180));
      if (!correctJumps) return "Sal del 8 y usa SALTO 2 cada vez. Cada salto debe empezar donde terminó el anterior.";
      if (arcs.length < 3) return `Has dado ${plural(arcs.length, "salto", "saltos")} de dos. ¿Cuántos necesitas para llegar al 14?`;
      if (arcs.length > 3) return "Te has pasado del 14. Prueba con menos saltos.";
      if (!near(turtle.position.x, 108) || !near(turtle.position.y, 0)) return "Deja la tortuga en el 14 al acabar.";
      return true;
    },
  },
  cuentaLasHuellas: {
    goal: "Haz que la tortuga deje exactamente siete marcas en el lienzo.",
    check({ arcs, moves }) {
      if (moves.some(move => !near(length(move), 0)) || arcs.some(({ angle }) => !near(Math.abs(angle), 360))) {
        return "Deja solo marcas redondas. Usa HUELLA para dibujarlas.";
      }
      // Count separate footprints even if the turtle redraws one.
      const footprints = new Set(arcs.map(({ center }) =>
        `${Math.round(center.x * 100)},${Math.round(center.y * 100)}`));
      if (footprints.size === 7) return true;
      return `Hay ${plural(footprints.size, "marca visible", "marcas visibles")}. ¿Cuántas vueltas de REPITE dejan siete?`;
    },
  },
  cartasDePuntos: {
    goal: "Forma el 13 con las cartas boca arriba.",
    check({ arcs, prints }) {
      const dots = count(arcs, ({ radius, angle }) => near(radius, 5) && near(Math.abs(angle), 360));
      const shown = lastPrint(prints, /=\s*(-?\d+)\s*$/);
      if (dots !== 13) return `Hay ${plural(dots, "punto", "puntos")} a la vista. ¿Qué cartas suman 13?`;
      if (!shown || Number(shown[1]) !== 13) return "Los puntos suman 13, pero el resultado no dice 13. Conserva la suma del programa.";
      return true;
    },
  },
  paquetesDeDos: {
    goal: "Escribe el 25 en binario dividiendo entre 2.",
    check({ prints }) {
      const steps = count(prints, line => /entre 2 da/.test(line));
      const result = lastPrint(prints, /^(-?\d+) en binario es (.*)$/);
      if (!result || result[1] !== "25") return "Empieza por el 25: cambia el número de la primera línea.";
      if (steps !== 5) return `Hay ${plural(steps, "división", "divisiones")}; el 25 necesita 5 hasta llegar a 0.`;
      if (result[2].replace(/\s+/g, "") !== "11001") return "Los restos, leídos de abajo arriba, forman el binario. Conserva PONPRIMERO.";
      return true;
    },
  },
  cuentaConLuces: {
    goal: "Cuenta de 0 a 31 con cinco luces.",
    check({ arcs, fills, prints }) {
      const lights = count(arcs, ({ radius, angle }) => near(radius, 18) && near(Math.abs(angle), 360));
      const lit = count(fills, fill => fill.color === "#ffd166");
      const numbers = prints.filter(line => /^\d+$/.test(line)).map(Number);
      if (lights !== 5) return `Al final se ven ${plural(lights, "luz", "luces")}; el reto pide 5.`;
      if (numbers.at(-1) !== 31) return `La cuenta termina en ${numbers.at(-1) ?? "nada"}. ¿Hasta dónde llegan cinco luces?`;
      if (numbers.length !== 32 || numbers.some((n, i) => n !== i)) return "Cuenta todos los números, de 0 a 31, sin saltarte ninguno.";
      if (lit !== 5) return "En el 31 tienen que estar encendidas las cinco luces.";
      return true;
    },
  },
  cerosYUnos: {
    goal: "Dibuja la boca: en la sexta fila, pinta las cuatro casillas del centro.",
    check({ raster }) {
      if (!raster) return "Usa LIENZO para pintar el dibujo.";
      const rows = raster.rows.map(row => (row ?? []).map(index => (index ? 1 : 0)).join(""));
      const face = ["00111100", "01000010", "10100101", "10000001", "10000001", "10111101", "01000010", "00111100"];
      if (rows[5] !== face[5]) return `La sexta fila dibuja ${rows[5] ?? "nada"}. Cambia los ceros del centro por unos y deja los bordes como están.`;
      const changed = face.findIndex((row, i) => rows[i] !== row);
      if (changed !== -1) return `La fila ${changed + 1} ha cambiado. Deja el resto de la cara como estaba.`;
      return true;
    },
  },
  palabras: {
    goal: "Usa una palabra de siete letras y escribe también su última letra.",
    check({ prints }) {
      if (prints[0] !== "7") return "La primera línea debe ser 7: elige una palabra de siete letras.";
      if (prints.length < 4 || Array.from(prints[3]).length !== 1) return "Añade una cuarta línea con la última letra.";
      return true;
    },
  },
  frases: {
    goal: "Escribe también la primera y la última letra de la frase.",
    check({ prints }) {
      const letters = Array.from(prints[0] ?? "");
      if (prints.length < 4) return "Añade dos líneas: la primera letra y la última.";
      if (prints[2] !== letters[0]) return "La tercera línea debe ser la primera letra.";
      if (prints[3] !== letters.at(-1)) return "La cuarta línea debe ser la última letra.";
      return true;
    },
  },
  listas: {
    goal: "Alarga la lista de giros hasta ocho para que la ruta tenga ocho tramos.",
    check({ moves }) {
      return moves.length === 8 ? true : tracesHint(moves, 8);
    },
  },
  extremos: {
    goal: "Pon una ficha NEGRA al principio de :fichas y escribe la lista nueva.",
    check({ prints }) {
      return prints.includes("NEGRA ROJA AZUL VERDE AMARILLA") ? true : "Escribe [NEGRA ROJA AZUL VERDE AMARILLA].";
    },
  },
  eligeFicha: {
    goal: "Añade NARANJA al final de :fichas y escribe la lista.",
    check({ prints }) {
      return prints.includes("ROJA AZUL VERDE AZUL AMARILLA NARANJA") ? true : "Escribe la lista con NARANJA al final.";
    },
  },
  fichasRepetidas: {
    goal: "Quita las fichas ROJA y escribe esa lista sin repetidas.",
    check({ prints }) {
      return prints.includes("AZUL AMARILLA VERDE") ? true : "Combina QUITA \"ROJA y SINREPETIDOS.";
    },
  },
  mensaje: {
    goal: "Forma y escribe el mensaje [BIENVENIDA A KLOGO HASTA PRONTO].",
    check({ prints }) {
      return prints.includes("BIENVENIDA A KLOGO HASTA PRONTO") ? true : "Usa FRASE para añadir HASTA y PRONTO como dos palabras.";
    },
  },
  pilas: {
    goal: "Apila también una ficha AMARILLA: debe ser la primera en salir.",
    check({ prints }) {
      if (prints[0] !== "AMARILLA") return "La primera ficha que sale debe ser AMARILLA.";
      if (prints.length !== 4) return "Deben salir cuatro fichas.";
      return true;
    },
  },
  recursion: {
    goal: "Cuenta hacia atrás de dos en dos: 10, 8, 6, 4, 2 y 0.",
    check({ prints }) {
      return prints.join(" ") === "10 8 6 4 2 0" ? true : `Salida muestra ${prints.join(" ") || "nada"}.`;
    },
  },
  devuelve: {
    goal: "Escribe el doble de SUMAHASTA 4. Debe salir 20.",
    check({ prints }) {
      return prints.includes("20") ? true : "Combina DOBLE y SUMAHASTA en una sola expresión.";
    },
  },
  circulo: {
    goal: "Lanza 3000 puntos para afinar la estimación.",
    check({ prints }) {
      const match = lastPrint(prints, /Dentro: (\d+)/);
      if (!match) return "Conserva la línea que escribe Dentro.";
      return Number(match[1]) > 1800 ? true : "Con 3000 puntos caen más de 1800 dentro del círculo.";
    },
  },
  rosa: {
    goal: "Dibuja una rosa de tres pétalos.",
    check({ moves }) {
      const tips = new Set();
      for (const { to } of moves) {
        if (Math.hypot(to.x, to.y) >= 99) tips.add(Math.round((Math.atan2(to.y, to.x) * 180 / Math.PI + 360) % 360 / 10) % 36);
      }
      return tips.size === 3 ? true : `La rosa tiene ${plural(tips.size, "pétalo", "pétalos")}. Prueba otros valores de :petalos.`;
    },
  },
  baliza: {
    play: true,
    goal: "Llega a la baliza con el menor número de movimientos: 11.",
    check({ prints }) {
      const match = lastPrint(prints, /^Movimientos (\d+)$/);
      if (!match) return "Guía la ficha hasta la baliza.";
      return Number(match[1]) <= 11 ? true : `Has usado ${match[1]} movimientos. Busca un camino de 11.`;
    },
  },
  clics: {
    goal: "Une ocho puntos en lugar de seis.",
    check({ moves }) {
      return moves.length === 8 ? true : tracesHint(moves, 8);
    },
  },
  melodia: {
    goal: "Añade dos notas a la melodía: siete notas y siete tramos.",
    check({ moves }) {
      return moves.length === 7 ? true : tracesHint(moves, 7);
    },
  },
  piano: {
    play: true,
    goal: "Graba una melodía de al menos tres notas: R, tus notas y R otra vez.",
    check({ prints }) {
      const match = lastPrint(prints, /^PIANOESTADO LISTO (\d+)$/);
      if (!match) return "Pulsa R, toca tus notas y pulsa R para terminar.";
      return Number(match[1]) >= 3 ? true : `La grabación tiene ${plural(Number(match[1]), "nota", "notas")}.`;
    },
  },
  fractales: {
    goal: "Dibuja la curva de Koch de nivel 4: 256 trazos.",
    check({ moves }) {
      return moves.length === 256 ? true : tracesHint(moves, 256);
    },
  },
  cubo3d: {
    goal: "Convierte el cubo en una torre el doble de alta.",
    check({ moves3 }) {
      if (moves3.length !== 12) return `Hay ${plural(moves3.length, "arista", "aristas")}; la torre tiene 12.`;
      const top = Math.max(...moves3.flatMap(move => [move.from.z, move.to.z]));
      return near(top, 220, 0.1) ? true : `La torre llega a ${Math.round(top)}; debe llegar a 220.`;
    },
  },
  rampa3d: {
    goal: "Usa una pendiente de 45 grados.",
    check({ moves3 }) {
      const top = Math.max(0, ...moves3.map(move => move.to.z));
      return near(top, 56.57, 0.1) ? true : `La rampa sube hasta ${top.toFixed(1)}; con 45° llega a 56,6.`;
    },
  },
  alabeo3d: {
    goal: "Usa un ángulo de 45 grados.",
    check({ moves3 }) {
      const top = Math.max(0, ...moves3.map(move => move.to.z));
      return near(top, 56.57, 0.1) ? true : `La tortuga sube hasta ${top.toFixed(1)}; con 45° llega a 56,6.`;
    },
  },
  cubocolor3d: {
    goal: "Convierte el cubo en una torre de 160 de alto.",
    check({ faces }) {
      if (faces.length !== 6) return `Hay ${plural(faces.length, "cara", "caras")}; la torre tiene 6.`;
      const top = Math.max(...faces.flatMap(face => face.vertices.map(vertex => vertex.z)));
      return near(top, 160, 0.1) ? true : `La torre mide ${Math.round(top)}; debe medir 160.`;
    },
  },
};

// Collects what a run left behind (after the last BORRARPANTALLA) and checks
// the lesson's challenge: true, a hint string, or null when there is none.
export function checkChallenge(key, { drawing, raster, prints }) {
  const challenge = challenges[key] ?? getProjectChallenge(key);
  if (!challenge || !drawing) return null;
  const parts = { moves: [], moves3: [], arcs: [], fills: [], labels: [], faces: [] };
  for (const event of drawing.events) {
    if (event.type === "clear") parts.moves = [], parts.arcs = [], parts.fills = [], parts.labels = [];
    if (event.type === "clear3") parts.moves3 = [], parts.faces = [];
    if (event.type === "move" && event.pen_down) parts.moves.push(event);
    if (event.type === "move3" && event.pen_down) parts.moves3.push(event);
    if (event.type === "arc") parts.arcs.push(event);
    if (event.type === "fill") parts.fills.push(event);
    if (event.type === "label") parts.labels.push(event);
    if (event.type === "face3") parts.faces.push(event);
  }
  return challenge.check({ ...parts, turtle: drawing.turtle, raster, prints, usedLoop: drawing.used_loop === true });
}
