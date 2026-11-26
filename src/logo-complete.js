// Suggestions while typing in the editor: the commands of the Referencia Logo,
// the procedures of the program and, after «:», its variables.
import { logoReference } from "./logo-reference.js";

// Lower case without accents, so «subel» finds SUBELÁPIZ.
const fold = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const wordChar = /[\p{L}\p{N}_.?]/u;

// The commands children use most come first among those with the same start.
const common = new Set(["AVANZA", "RETROCEDE", "GIRADERECHA", "GIRAIZQUIERDA", "REPITE", "PARA", "FIN", "HAZ",
  "SUBELÁPIZ", "BAJALÁPIZ", "COLORLAPIZ", "GROSORLAPIZ", "ESCRIBE", "SI", "ARCO", "RELLENA", "ROTULA", "NOTA"]);

// One candidate per spelling. `name` is what gets written; `detail` is shown
// next to it: what goes after the command, or the full name for a short variant.
const commandCandidates = logoReference.flatMap(group => group.entries).flatMap(entry => {
  const names = entry.name.split(" … ");
  if (!names.every(name => /^[\p{L}\d]+$/u.test(name))) return [];
  const [main] = names;
  const takesArguments = entry.syntax.trim() !== main;
  const own = names.map((name, index) => ({
    name, detail: index === 0 ? entry.syntax.split("\n")[0].slice(main.length).trim() : `cierra ${main}`,
    rank: common.has(name) ? 0 : 1, space: index === 0 && takesArguments,
  }));
  const variants = (entry.variants ?? []).map(name => ({ name, detail: `= ${main}`, rank: 2, space: takesArguments }));
  const aliases = (entry.aliases ?? []).map(name => ({ name, detail: `= ${main}`, rank: 3, space: takesArguments }));
  return [...own, ...variants, ...aliases];
});

function programNames(source) {
  const procedures = [];
  const variables = new Set();
  for (const line of source.split("\n").map(text => text.split(";", 1)[0])) {
    const header = /^\s*(?:PARA|TO)\s+([^\s\[\]()]+)(.*)$/i.exec(line);
    if (header) {
      const inputs = [...header[2].matchAll(/:([^\s\[\]()]+)/g)].map(match => match[1]);
      procedures.push({ name: header[1].toUpperCase(), detail: inputs.join(" ") || "procedimiento", rank: 0, space: inputs.length > 0 });
      inputs.forEach(name => variables.add(name));
    }
    for (const match of line.matchAll(/\b(?:HAZ|MAKE|LOCAL|DESDE|PARACADA)\s+"([^\s\[\]()]+)/gi)) variables.add(match[1]);
  }
  return { procedures, variables: [...variables] };
}

// Suggestions for the word that ends at `caret`, or null. The word must have
// at least two characters (one after «:»), and the caret must not be inside a
// comment or a quoted word. `start` is where the word begins (with its «:»).
export function logoCompletions(source, caret, limit = 6) {
  const lineStart = source.lastIndexOf("\n", caret - 1) + 1;
  const before = source.slice(lineStart, caret);
  if (before.includes(";")) return null;
  const after = source.slice(caret, caret + 1);
  if (after && wordChar.test(after)) return null;
  const chars = Array.from(before);
  let index = chars.length;
  while (index > 0 && wordChar.test(chars[index - 1])) index -= 1;
  const word = chars.slice(index).join("");
  const mark = chars[index - 1];
  if (mark === "\"") return null;
  const variable = mark === ":";
  if (word.length < (variable ? 1 : 2) || /^\d/.test(word)) return null;

  const { procedures, variables } = programNames(source);
  const prefix = fold(word);
  const pool = variable
    ? variables.map(name => ({ name: `:${name}`, match: name, detail: "variable", rank: 0, space: false }))
    : [...procedures, ...commandCandidates].map(candidate => ({ ...candidate, match: candidate.name }));
  const seen = new Set();
  const items = pool
    .filter(candidate => fold(candidate.match).startsWith(prefix) && fold(candidate.match) !== prefix)
    .sort((a, b) => a.rank - b.rank || a.match.length - b.match.length || a.match.localeCompare(b.match, "es"))
    .filter(candidate => !seen.has(candidate.name) && seen.add(candidate.name))
    .slice(0, limit)
    .map(({ name, detail, space }) => ({ name, detail, space }));
  if (!items.length) return null;
  const start = lineStart + chars.slice(0, variable ? index - 1 : index).join("").length;
  return { start, end: caret, word: (variable ? ":" : "") + word, items };
}

// Text that replaces the word: the suggestion in the case the child is
// writing, and a space after a command that takes arguments.
export function completionText(item, word) {
  const lower = word.replace(/^:/, "") === word.replace(/^:/, "").toLowerCase() && /\p{Ll}/u.test(word);
  const name = lower ? item.name.toLowerCase() : item.name;
  return item.space ? `${name} ` : name;
}
