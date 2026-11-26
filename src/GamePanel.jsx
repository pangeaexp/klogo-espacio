import { HanoiBoard } from "./HanoiBoard.jsx";
import { clueLabels, WordleOutput } from "./WordleOutput.jsx";

// The board of the two games in place of the canvas: Torres de Hanói, or the
// Mini-Wordle with its legend, the word box on desktop and the guesses so far.
export function GamePanel({ isHanoi, lines, phase, delayMs, onMove, input, outputRef, waitingToStart }) {
  return (
    <section className="kl-pane kl-game" aria-labelledby="klogo-game">
      <div className="kl-pane-head">
        <h2 id="klogo-game" className="kl-pane-title">{isHanoi ? "Torres de Hanói" : "Partida"}</h2>
      </div>
      {isHanoi ? (
        <HanoiBoard lines={lines ?? []} phase={phase} delayMs={delayMs} onMove={onMove} />
      ) : (
        <div className="kl-game-content">
          <p className="kl-muted kl-attempts">Cuatro letras, seis intentos.</p>
          <div className="kl-legend" aria-label="Leyenda de pistas">
            {Object.entries(clueLabels).map(([mark, label]) => (
              <span key={mark}><b className="kl-tile" data-mark={mark}>{mark}</b> {label}</span>
            ))}
          </div>
          {input}
          {lines?.length > 0 && <WordleOutput lines={lines} outputRef={outputRef} />}
          {waitingToStart && <p className="kl-muted">Pulsa Ejecutar para empezar.</p>}
        </div>
      )}
    </section>
  );
}
