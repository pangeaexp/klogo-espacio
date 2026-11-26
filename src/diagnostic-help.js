// Friendlier help under an error of the interpreter: a short explanation for
// the most common mistakes and, when the error is a misspelt name, the closest
// known one with a fix that rewrites it in the program.
import { logoReference } from "./logo-reference.js";

const entries = logoReference.flatMap(group => group.entries);

// Lower case without accents, so SUBELAPIZ and SUBELÁPIZ compare equal.
const fold = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// Known commands: the Spanish name first, then the variants and the English aliases.
const commands = entries.flatMap(entry => [entry.name, ...(entry.variants ?? []), ...(entry.aliases ?? [])]
  .map((name, rank) => ({ name, rank: rank === 0 ? 0 : 1, entry })));
const commandByName = new Map(commands.map(command => [fold(command.name), command]));

// Optimal string alignment distance: insertions, deletions, substitutions and
// swaps of two neighbours (GIRADERECAH) each cost one.
export function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

const tolerance = length => length <= 4 ? 1 : length <= 8 ? 2 : 3;

function closest(word, candidates) {
  const folded = fold(word);
  let best = null;
  for (const candidate of candidates) {
    const distance = editDistance(folded, fold(candidate.name));
    if (distance === 0 || distance > tolerance(folded.length)) continue;
    if (!best || distance < best.distance || (distance === best.distance && candidate.rank < best.rank)) {
      best = { ...candidate, distance };
    }
  }
  return best;
}

// Program text without comments, line by line, as arrays of characters
// (the interpreter counts columns in Unicode characters).
function codeLines(source) {
  return source.split("\n").map(line => {
    const chars = Array.from(line);
    const comment = chars.indexOf(";");
    return comment < 0 ? chars : chars.slice(0, comment);
  });
}

// Procedures (PARA name), their inputs and the variables HAZ, LOCAL, DESDE
// and PARACADA name in the program.
function programNames(source) {
  const procedures = [];
  const variables = [];
  for (const line of codeLines(source).map(chars => chars.join(""))) {
    const header = /^\s*(?:PARA|TO)\s+([^\s\[\]()]+)(.*)$/i.exec(line);
    if (header) {
      procedures.push({ name: header[1].toUpperCase(), rank: 0 });
      for (const match of header[2].matchAll(/:([^\s\[\]()]+)/g)) variables.push({ name: match[1], rank: 0 });
    }
    for (const match of line.matchAll(/\b(?:HAZ|MAKE|LOCAL|DESDE|PARACADA)\s+"([^\s\[\]()]+)/gi)) {
      variables.push({ name: match[1], rank: 0 });
    }
  }
  return { procedures, variables };
}

// The word that starts at a 1-based line and column.
function wordAt(lines, line, column) {
  const chars = lines[line - 1] ?? [];
  let end = column - 1;
  while (end < chars.length && !/[\s\[\]()]/.test(chars[end])) end += 1;
  return chars.slice(column - 1, end).join("");
}

// The word just before a 1-based line and column, looking back across lines.
function wordBefore(lines, line, column) {
  for (let l = line - 1, end = column - 1; l >= 0; l -= 1, end = undefined) {
    const chars = lines[l].slice(0, end ?? lines[l].length);
    const text = chars.join("").trimEnd();
    if (!text) continue;
    const match = /(\S+)$/.exec(text);
    return match[1];
  }
  return "";
}

// Line of the first «[» that is still open at the end of the program.
function unclosedBracket(lines) {
  const open = [];
  lines.forEach((chars, index) => {
    for (const char of chars) {
      if (char === "[") open.push(index + 1);
      else if (char === "]") open.pop();
    }
  });
  return open[0] ?? null;
}

const quote = name => `«${name}»`;

// Returns { hint, fix } for a diagnostic of the interpreter, or null.
// `fix` replaces `length` characters at `line` and `column` with `text`.
export function diagnosticHelp(diagnostic, source) {
  if (!diagnostic?.message || !diagnostic.line) return null;
  const lines = codeLines(source);
  const { line, column, message } = diagnostic;
  const named = /«([^»]+)»/.exec(message)?.[1];

  if (diagnostic.code === "unknown_command" && named) {
    const written = wordAt(lines, line, column) || named;
    const fix = text => ({ label: `Cambiar a ${text}`, line, column, length: Array.from(written).length, text });
    // AVANZA100: the number stuck to the command.
    const glued = /^(\p{L}+?)(-?\d+(?:[.,]\d+)?)$/u.exec(written);
    if (glued && commandByName.has(fold(glued[1]))) {
      const text = `${glued[1]} ${glued[2]}`;
      return { hint: `Falta un espacio entre la orden y el número: ${text}.`, fix: fix(text) };
    }
    // ESCRIBE "hola mundo: only the first word belongs to the quote.
    if (/^"\S/.test(wordBefore(lines, line, column))) {
      return { hint: "Las comillas solo valen para una palabra. Para escribir varias, ponlas entre corchetes: ESCRIBE [hola mundo]." };
    }
    const { procedures } = programNames(source);
    const best = closest(written, [...procedures, ...commands]);
    if (best) {
      const text = written === written.toLowerCase() ? best.name.toLowerCase() : best.name;
      return { hint: `¿Quisiste decir ${best.name}?`, fix: fix(text) };
    }
    return { hint: "KLogo no conoce esta orden. Búscala en la Referencia Logo o créala con PARA … FIN." };
  }

  if (diagnostic.code === "unknown_variable" && named) {
    const { variables } = programNames(source);
    const best = closest(named, variables);
    if (best) {
      return {
        hint: `¿Quisiste decir :${best.name}?`,
        fix: { label: `Cambiar a :${best.name}`, line, column, length: Array.from(named).length + 1, text: `:${best.name}` },
      };
    }
    return { hint: `Antes de usar :${named}, dale un valor. Por ejemplo: HAZ "${named} 10` };
  }

  if (message === "Se esperaba un valor o una expresión.") {
    const previous = wordBefore(lines, line, column);
    const command = commandByName.get(fold(previous));
    if (command?.entry.syntax) {
      const example = command.entry.example?.split("\n")[0];
      return { hint: `A ${previous.toUpperCase()} le falta lo que va detrás. Se escribe ${command.entry.syntax}${example ? `, por ejemplo ${example}` : ""}.` };
    }
    if (/^[-+*/<>=]$/.test(previous)) return { hint: `Falta un número después de ${quote(previous)}.` };
    return null;
  }

  if (message === "Falta «]».") {
    const opened = unclosedBracket(lines);
    return { hint: opened ? `Cada «[» necesita su «]». El «[» de la línea ${opened} no está cerrado.` : "Cada «[» necesita su «]»." };
  }
  if (message === "Se esperaba «[».") {
    return { hint: "Las órdenes que se repiten van entre corchetes, por ejemplo REPITE 4 [ AVANZA 50 GIRADERECHA 90 ]." };
  }
  if (message === "Se esperaba «)».") return { hint: "Falta cerrar un paréntesis: cada «(» necesita su «)»." };
  if (message === "Se esperaba una orden.") {
    const char = (lines[line - 1] ?? [])[column - 1];
    if (char === "]") return { hint: "Sobra este «]»: no hay ningún «[» abierto antes." };
    if (char === ")") return { hint: "Sobra este «)»: no hay ningún «(» abierto antes." };
    return null;
  }
  if (/^Falta FIN para /.test(message)) {
    return { hint: "Escribe FIN en una línea, después de la última orden del procedimiento." };
  }
  return null;
}
