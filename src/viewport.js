export const mobileQuery = "(max-width: 680px)";

export function subscribeToViewport(change) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}

export function mobileViewport() {
  return window.matchMedia(mobileQuery).matches;
}

export function desktopViewport() {
  return false;
}

// Downloads work outside an iframe or in one that allows them.
export function allowsLogoDownload() {
  if (typeof window === "undefined" || window.parent === window) return true;
  const frame = window.frameElement;
  return Boolean(frame && (!frame.hasAttribute("sandbox") || frame.sandbox.contains("allow-downloads")));
}

// Props for a pane: a tab panel on mobile, a plain section on desktop.
export function panelProps(id, isMobile, activeTab) {
  return {
    id: `klogo-panel-${id}`,
    hidden: isMobile && activeTab !== id,
    role: isMobile ? "tabpanel" : undefined,
    "aria-labelledby": isMobile ? `klogo-tab-${id}` : undefined,
    tabIndex: isMobile ? 0 : undefined,
  };
}
