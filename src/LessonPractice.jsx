import { useState } from "react";

// Short hands-on practices above some Primeros pasos challenges (see
// `practices` in use-logo-lessons.js). They never touch the program or the
// progress: they only show the idea the challenge needs.
const turnPractices = {
  bucles: {
    title: "Práctica · Reparte una vuelta",
    intro: "Una vuelta completa son 360°. En el cuadrado y el triángulo equilátero, la tortuga gira lo mismo en cada esquina para mirar hacia el lado siguiente.",
    shapes: [[4, "Cuadrado"], [3, "Triángulo equilátero"]],
  },
  poligonos: {
    title: "Práctica · Más lados, giros más pequeños",
    intro: "En una figura de lados iguales, la tortuga da una vuelta completa, 360°, repartida en tantos giros como lados. Con más lados, cada giro es más pequeño.",
    shapes: [[5, "Pentágono"], [6, "Hexágono"], [8, "Octágono"]],
  },
};

function TurnPractice({ title, intro, shapes }) {
  const [turnsInCircle, setTurnsInCircle] = useState(shapes[0][0]);
  const [turns, setTurns] = useState(0);
  const angle = 360 / turnsInCircle;
  const total = turns * angle;
  const complete = turns === turnsInCircle;

  return (
    <details className="kl-turn-practice">
      <summary>{title}</summary>
      <p>{intro}</p>
      <div className="kl-turn-practice-body">
        <div className="kl-turn-dial" aria-hidden="true" style={{ "--sector": `${angle}deg`, "--turned": `${total}deg` }}>
          <span className="kl-turn-needle" />
        </div>
        <div className="kl-turn-controls">
          <label>Figura
            <select value={turnsInCircle} onChange={event => {
              setTurnsInCircle(Number(event.target.value));
              setTurns(0);
            }}>
              {shapes.map(([sides, name]) => <option key={sides} value={sides}>{name}</option>)}
            </select>
          </label>
          <p><strong>360° ÷ {turnsInCircle} = {angle}°</strong> en cada esquina.</p>
          <button type="button" className="kl-secondary" onClick={() => setTurns(complete ? 0 : turns + 1)}>
            {complete ? "Reiniciar giros" : `Girar ${angle}°`}
          </button>
          <p role="status">{turns} de {turnsInCircle} giros · {total}° en total.
            {complete && " La tortuga vuelve a mirar en la dirección inicial."}</p>
        </div>
      </div>
    </details>
  );
}

// The inks of «Colores · Roseta de tres tintas», in the lesson's order, and a
// fourth one to try what the challenge asks.
const inks = [["#ffb454", "naranja"], ["#76f2bf", "turquesa"], ["#c5a6ff", "lila"], ["#ff8a65", "coral"]];
const inkRounds = 12;

function InkPractice() {
  const [count, setCount] = useState(3);
  const [round, setRound] = useState(0);
  const used = inks.slice(0, count);
  const rest = round ? (round - 1) % count : null;
  const [color, colorName] = round ? used[rest] : [null, null];
  const done = round === inkRounds;
  return (
    <details className="kl-turn-practice kl-ink-practice">
      <summary>Práctica · Tintas que se repiten</summary>
      <p>CUENTAREP dice en qué vuelta va el bucle: 1, 2, 3… RESTO da lo que sobra al repartir entre las tintas, así que vuelve a 0 y las tintas se repiten en orden.</p>
      <div className="kl-turn-practice-body">
        <ol className="kl-ink-rounds" aria-label={`Vueltas pintadas: ${round} de ${inkRounds}`}>
          {Array.from({ length: inkRounds }, (_, index) => (
            <li key={index} style={index < round ? { background: used[index % count][0] } : undefined}
              title={index < round ? `Vuelta ${index + 1}: ${used[index % count][1]}` : `Vuelta ${index + 1}`} />
          ))}
        </ol>
        <div className="kl-turn-controls">
          <label>Tintas
            <select value={count} onChange={event => { setCount(Number(event.target.value)); setRound(0); }}>
              {[2, 3, 4].map(n => <option key={n} value={n}>{n}: {inks.slice(0, n).map(([, name]) => name).join(", ")}</option>)}
            </select>
          </label>
          <button type="button" className="kl-secondary" onClick={() => setRound(done ? 0 : round + 1)}>
            {done ? "Empezar de nuevo" : "Siguiente vuelta"}
          </button>
          <p role="status">{round === 0 ? "Pulsa «Siguiente vuelta» para empezar."
            : <>Vuelta {round}: <strong>RESTO ({round} − 1) {count} = {rest}</strong>, tinta {rest + 1} ·{" "}
              <span className="kl-ink-chip" style={{ background: color }} aria-hidden="true" /> {colorName}.</>}</p>
        </div>
      </div>
    </details>
  );
}

export function LessonPractice({ practice }) {
  if (practice === "tintas") return <InkPractice />;
  const turns = turnPractices[practice];
  return turns ? <TurnPractice key={practice} {...turns} /> : null;
}
