export const treasureProject = "mapa-del-tesoro";
export const treasureTitle = "Mapa del tesoro";

export function isTreasureSource(source) {
  return /^; Proyecto libre · Mapa del tesoro\s*$/m.test(source);
}

export function readTreasureMap(drawing) {
  const places = [];
  const messages = [];
  let attempts = 0;
  for (const event of drawing?.events ?? []) {
    if (event.type === "clear") places.length = 0;
    if (event.type === "label" && attempts === 0) places.push(event);
    if (event.type !== "print") continue;
    const count = /^KLOGOMAPA (\d+)$/.exec(event.text);
    if (count) attempts = Number(count[1]);
    else messages.push(event.text);
  }
  return { places, messages, attempts };
}
