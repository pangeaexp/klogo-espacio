export const clueLabels = {
  V: "posición exacta",
  A: "en otra posición",
  "·": "sin coincidencia",
};

export function WordleOutput({ lines, outputRef }) {
  const entries = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1] ?? "";
    if (/^[A-ZÑÁÉÍÓÚÜ]{4}$/.test(line) && /^[VA·]{4}$/.test(next)) {
      entries.push({ word: [...line], marks: [...next] });
      index += 1;
    } else if (line === "Solución:" && next) {
      entries.push({ message: `Solución: ${next}` });
      index += 1;
    } else {
      entries.push({ message: line === "Escribe-cuatro-letras." ? "Escribe cuatro letras." : line });
    }
  }

  return (
    <div ref={outputRef} className="kl-wordle-log" role="log" aria-label="Pistas">
      <ul className="kl-wordle-entries">
        {entries.map((entry, index) => (
          entry.word ? (
            <li key={index} className="kl-tiles">
              {entry.word.map((letter, position) => {
                const mark = entry.marks[position];
                return (
                  <span
                    key={position}
                    className="kl-tile"
                    data-mark={mark}
                    role="img"
                    aria-label={`${letter}, ${clueLabels[mark]}`}
                  >
                    {letter}
                    <small aria-hidden="true">{mark}</small>
                  </span>
                );
              })}
            </li>
          ) : (
            <li key={index} className="kl-wordle-message">{entry.message}</li>
          )
        ))}
      </ul>
    </div>
  );
}
