// Text size steps for A− / A+ in Más opciones. The workspace multiplies every
// font size of its styles by `--kl-text`.
export const textSizes = [1, 1.15, 1.3, 1.5];

const textStorageKey = "klogo.text.size.v1";

export function restoreTextSize() {
  try {
    const saved = Number(window.localStorage.getItem(textStorageKey));
    if (textSizes.includes(saved)) return saved;
  } catch {
    // The web viewer blocks local storage: start at the normal size.
  }
  return 1;
}

export function saveTextSize(size) {
  try {
    window.localStorage.setItem(textStorageKey, String(size));
  } catch {
    // Not kept between visits when storage is unavailable.
  }
}

export function nextTextSize(size, direction) {
  const index = textSizes.indexOf(size) + direction;
  return textSizes[Math.max(0, Math.min(textSizes.length - 1, index))];
}
