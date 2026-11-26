const indentUnit = "  ";
const procedureStart = /^(?:PARA|TO)(?=\s|$)/i;
const procedureEnd = /^(?:FIN|END)$/i;

const indentation = line => line.match(/^[ \t]*/)[0];
const code = line => line.split(";", 1)[0].trim();

function openBrackets(line) {
  let depth = 0;
  for (const bracket of code(line).match(/[\[\]]/g) ?? []) {
    depth = bracket === "[" ? depth + 1 : Math.max(0, depth - 1);
  }
  return depth;
}

function closingBracketIndent(before) {
  const openings = [];
  for (const line of before.split("\n")) {
    let depth = 0;
    for (const bracket of code(line).match(/[\[\]]/g) ?? []) {
      if (bracket === "[") {
        openings.push(indentation(line) + indentUnit.repeat(depth++));
      } else {
        openings.pop();
        depth = Math.max(0, depth - 1);
      }
    }
  }
  return openings.at(-1);
}

export function logoIndentEdit(source, start, end, key) {
  const lineStart = start === 0 ? 0 : source.lastIndexOf("\n", start - 1) + 1;
  const before = source.slice(lineStart, start);
  const indent = indentation(before);
  if (key === "]") {
    if (before !== indent) return null;
    const target = closingBracketIndent(source.slice(0, lineStart));
    if (target === undefined || target === indent) return null;
    return { start: lineStart, end, text: target + "]" };
  }

  const current = code(before);
  if (procedureEnd.test(current)) {
    const signature = source.slice(0, lineStart).split("\n").findLast(line =>
      procedureStart.test(code(line)) || procedureEnd.test(code(line)));
    if (signature && procedureStart.test(code(signature))) {
      const target = indentation(signature);
      return { start: lineStart, end, text: target + before.trimStart() + "\n" + target };
    }
  }

  const brackets = openBrackets(before);
  const next = indent + indentUnit.repeat(brackets + Number(procedureStart.test(current)));
  const after = source.slice(end).match(/^[ \t]*(?=\])/);
  if (brackets && after) {
    const closing = indent + indentUnit.repeat(brackets - 1);
    return { start, end: end + after[0].length, text: "\n" + next + "\n" + closing, caret: start + next.length + 1 };
  }
  return { start, end, text: "\n" + next };
}
