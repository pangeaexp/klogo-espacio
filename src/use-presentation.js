import { useEffect, useRef, useState } from "react";
import { nextTextSize, restoreTextSize, saveTextSize } from "./text-size.js";

// The text size (A− / A+) and the presentation mode for a projector: larger
// text, taller panes, fewer buttons and, where the browser allows it, full
// screen. `workspaceRef` is the element that goes full screen.
export function usePresentation() {
  const [textSize, setTextSize] = useState(restoreTextSize);
  const [presenting, setPresenting] = useState(false);
  const workspaceRef = useRef(null);
  const presentingFullscreen = useRef(false);

  useEffect(() => {
    const left = () => {
      if (presentingFullscreen.current && !document.fullscreenElement) {
        presentingFullscreen.current = false;
        setPresenting(false);
      }
    };
    document.addEventListener("fullscreenchange", left);
    return () => document.removeEventListener("fullscreenchange", left);
  }, []);

  function startPresenting() {
    setPresenting(true);
    const workspace = workspaceRef.current;
    try {
      workspace?.requestFullscreen?.()?.then(() => { presentingFullscreen.current = true; }, () => {});
    } catch {
      // Without full screen (a sandboxed viewer) the mode still enlarges the page.
    }
  }

  function stopPresenting() {
    setPresenting(false);
    if (presentingFullscreen.current && document.fullscreenElement) {
      presentingFullscreen.current = false;
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function changeTextSize(direction) {
    const size = nextTextSize(textSize, direction);
    setTextSize(size);
    saveTextSize(size);
  }

  // A path for young children starts with larger text, never smaller.
  function raiseTextSize(size) {
    if (textSize < size) {
      setTextSize(size);
      saveTextSize(size);
    }
  }

  return {
    workspaceRef, presenting, textSize, startPresenting, stopPresenting, changeTextSize, raiseTextSize,
    // The page's text scale: the presentation mode makes it at least 140 %.
    textScale: presenting ? Math.max(textSize, 1.4) : textSize,
  };
}
