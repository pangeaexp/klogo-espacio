import { useEffect, useLayoutEffect, useRef, useState } from "react";

const towerNames = ["A", "B", "C"];
const moveErrors = {
  "ESCRIBE-DOS-TORRES": "Elige dos torres.",
  "TORRE-DESCONOCIDA": "Elige una torre A, B o C.",
  "MISMA-TORRE": "Elige una torre de destino distinta.",
  "ORIGEN-VACIO": "La torre de origen está vacía.",
  "DESTINO-MENOR": "Un disco grande no puede quedar encima de uno pequeño.",
};

function readStack(text) {
  if (!/^(?:[1-9]\d*(?: [1-9]\d*)*)?$/.test(text)) return null;
  return (text.match(/\d+/g) ?? []).reverse();
}

function readBoard(lines) {
  let stacks;
  let moves = 0;
  let error;
  let won = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === "TABLERO") {
      const board = lines.slice(i + 1, i + 4).map(readStack);
      if (board.length === 3 && board.every(Boolean) && /^\d+$/.test(lines[i + 4])) {
        stacks = board;
        moves = Number(lines[i + 4]);
        error = undefined;
        i += 4;
      }
    } else if (line === "VICTORIA") {
      won = true;
    } else if (moveErrors[line]) {
      error = moveErrors[line];
    }
  }
  return { stacks, moves, error, won };
}

export function HanoiBoard({ lines, phase, delayMs, onMove }) {
  const [origin, setOrigin] = useState(null);
  const boardRef = useRef(null);
  const previousLayout = useRef(null);
  const { stacks, moves, error, won } = readBoard(lines);
  const active = phase === "input" && !won;

  useEffect(() => {
    if (!active) setOrigin(null);
  }, [active]);

  useLayoutEffect(() => {
    if (!boardRef.current) {
      previousLayout.current = null;
      return;
    }
    const positions = new Map();
    for (const disk of boardRef.current.querySelectorAll(".kl-hanoi-disk")) {
      const button = disk.closest("button");
      positions.set(disk.dataset.size, { rect: disk.getBoundingClientRect(), button, disk });
    }
    const previous = previousLayout.current;
    previousLayout.current = { moves, positions };

    if (
      phase !== "pausing" || !previous || previous.moves + 1 !== moves
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    for (const [size, { rect, button, disk }] of positions) {
      const start = previous.positions.get(size);
      if (!start || start.button === button || !disk.animate) continue;
      const dx = start.rect.left - rect.left;
      const dy = start.rect.top - rect.top;
      const lift = Math.min(dy, 0) - 18;
      button.dataset.moving = "true";
      const animation = disk.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx}px, ${lift}px)`, offset: 0.26 },
        { transform: `translate(0px, ${lift}px)`, offset: 0.74 },
        { transform: "translate(0px, 0px)" },
      ], { duration: Math.min(380, Math.max(0, delayMs - 40)), easing: "ease-in-out" });
      return () => {
        animation.cancel();
        delete button.dataset.moving;
      };
    }
  }, [moves, phase, delayMs]);

  function selectTower(tower) {
    if (!active) return;
    if (origin === null) {
      setOrigin(tower);
    } else {
      setOrigin(null);
      onMove(origin + tower);
    }
  }

  const moveCount = `${moves} ${moves === 1 ? "movimiento" : "movimientos"}`;
  const instruction = origin
    ? `Origen ${origin}. Elige la torre de destino.`
    : "Elige la torre de origen y luego la de destino.";

  return (
    <div className="kl-hanoi">
      <style>{`
        .kl-hanoi { padding: 15px 14px; }
        .kl-hanoi .kl-hanoi-goal { margin: 0; color: #355550; font-size: 14px; }
        .kl-hanoi-towers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(6px, 1.4vw, 12px); margin-block: 18px 12px; }
        .kl-hanoi .kl-hanoi-tower { display: grid; grid-template-rows: 1fr auto; gap: 8px; min-width: 0; padding: 8px 5px; border: 1px solid #cdd8cf; border-radius: 10px; background: #edf1e9; color: #213d36; font: 700 14px/1.3 system-ui, sans-serif; cursor: pointer; }
        .kl-hanoi .kl-hanoi-tower:hover:not([aria-disabled="true"]) { border-color: #357862; background: #e3eee3; }
        .kl-hanoi .kl-hanoi-tower[aria-pressed="true"] { box-shadow: inset 0 0 0 2px #1e654d; background: #e0f0e5; }
        .kl-hanoi .kl-hanoi-tower[aria-disabled="true"] { cursor: default; }
        .kl-hanoi .kl-hanoi-tower[data-moving] { position: relative; z-index: 1; }
        .kl-hanoi-stack { position: relative; isolation: isolate; height: clamp(90px, 17vh, 158px); width: 100%; display: flex; flex-direction: column-reverse; align-items: center; padding: 0 4px 5px; gap: 3px; }
        .kl-hanoi-stack::before { content: ""; position: absolute; bottom: 3px; top: 10px; width: 5px; left: calc(50% - 2.5px); border-radius: 3px 3px 0 0; background: #91a997; z-index: -1; }
        .kl-hanoi-stack::after { content: ""; position: absolute; bottom: 0; left: 3px; right: 3px; height: 5px; border-radius: 3px; background: #527363; z-index: -1; }
        .kl-hanoi-disk { display: grid; place-items: center; height: clamp(20px, 3.5vh, 30px); flex: none; border-radius: 5px; border: 1px solid #0002; color: #fffdf4; box-shadow: inset 0 -3px #0002; font-size: 12px; }
        .kl-hanoi-disk[data-size="1"] { width: 40%; background: #22654e; }
        .kl-hanoi-disk[data-size="2"] { width: 65%; background: #896024; }
        .kl-hanoi-disk[data-size="3"] { width: 90%; background: #46637c; }
        .kl-hanoi .kl-hanoi-feedback { margin: 0; min-height: 2.7em; color: #355550; }
        .kl-hanoi .kl-hanoi-feedback[data-error="true"] { color: #8b3025; }
        .kl-hanoi .kl-hanoi-feedback[data-won="true"] { color: #185340; font-weight: 650; }
        .kl-hanoi .kl-hanoi-result { display: flex; align-items: baseline; gap: 4px 14px; flex-wrap: wrap; }
        .kl-hanoi .kl-hanoi-auto { margin-top: 10px; }
        .kl-hanoi .kl-hanoi-count { margin: 0; min-width: 8em; color: #355550; font-size: 13px; }
      `}</style>
      <p className="kl-hanoi-goal">Lleva los tres discos de A a C.</p>
      {stacks && (
        <>
          <div ref={boardRef} className="kl-hanoi-towers" role="group" aria-label="Torres de Hanói">
            {towerNames.map((tower, index) => {
              const disks = stacks[index];
              const description = disks.length ? `discos ${disks.join(", ")} de abajo arriba` : "vacía";
              return (
                <button
                  type="button"
                  key={tower}
                  className="kl-hanoi-tower"
                  aria-label={`Torre ${tower}, ${description}`}
                  aria-pressed={origin === tower}
                  aria-disabled={!active}
                  onClick={() => selectTower(tower)}
                >
                  <span className="kl-hanoi-stack" aria-hidden="true">
                    {disks.map(disk => (
                      <span key={disk} className="kl-hanoi-disk" data-size={disk}>{disk}</span>
                    ))}
                  </span>
                  <span aria-hidden="true">{tower}</span>
                </button>
              );
            })}
          </div>
          <div className="kl-hanoi-result">
            <p className="kl-hanoi-count">{moveCount}</p>
            <p className="kl-hanoi-feedback" role="status" data-won={won} data-error={!!error}>
              {won ? "¡Resuelto! Los tres discos están en C." :
                phase === "pausing" ? "Resolviendo…" : active ? origin ? instruction : error || instruction : ""}
            </p>
          </div>
          {!won && (
            <button
              type="button"
              className="kl-run kl-hanoi-auto"
              disabled={!active}
              onClick={() => {
                setOrigin(null);
                onMove("AUTO");
              }}
            >
              Resolver automáticamente
            </button>
          )}
        </>
      )}
      {!stacks && phase === "ready" && <p className="kl-muted">Pulsa Ejecutar para empezar.</p>}
    </div>
  );
}
