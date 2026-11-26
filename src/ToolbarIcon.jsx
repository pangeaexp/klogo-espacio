const toolbarIcons = {
  play: "M7 4l13 8-13 8z",
  stop: "M6 6h12v12H6z",
  step: "M5 5l9 7-9 7zM18 5v14",
  pause: "M8 5v14M16 5v14",
  folder: "M3 18V6h6l2 2h10v3M3 18l3-7h16l-3 7z",
  copy: "M8 8h12v12H8zM16 8V4H4v12h4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  open: "M6 3h9l4 4v14H6zM12 17V9m-3 3 3-3 3 3",
  download: "M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5",
  book: "M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zm0 0v15",
  hint: "M9 18h6M10 22h4M9 15c0-1.5-3-2.8-3-6a6 6 0 1 1 12 0c0 3.2-3 4.5-3 6",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01",
  prev: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  reload: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  flag: "M5 21V4h12l-2.5 4 2.5 4H5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  forward: "M12 20V5m-6 6 6-6 6 6",
  back: "M12 4v15m-6-6 6 6 6-6",
  turnRight: "M6 20v-7a6 6 0 0 1 6-6h7m-4-4 4 4-4 4",
  turnLeft: "M18 20v-7a6 6 0 0 0-6-6H5m4-4-4 4 4 4",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  gallery: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  present: "M3 4h18v12H3zM8 20h8M12 16v4",
  exitPresent: "M3 4h18v12H3zM9 7l6 6M15 7l-6 6M8 20h8M12 16v4",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4",
  // The Aula bar.
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  hand: "M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 5.5v-2a1.5 1.5 0 0 1 3 0V12M14 5.5a1.5 1.5 0 0 1 3 0V12M17 7.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L3.7 14.3a1.5 1.5 0 0 1 .5-2 1.9 1.9 0 0 1 2.3.3L8 13",
  send: "M10 14 21 3M21 3l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1z",
  broadcast: "M18.4 19.4a9 9 0 1 0-12.8 0M15.5 16.5a5 5 0 1 0-7 0M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  upload: "M12 15V3m-4 4 4-4 4 4M5 16v5h14v-5",
  table: "M4 4h16v16H4zM4 10h16M10 4v16",
  eraser: "M19 20H8.5l-4.2-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4L11.5 20M18 13.3 11.7 7",
  exit: "M3 21h18M5 21V5a2 2 0 0 1 2-2h7M13 12v.01M17 14v7M14 7h7m-3-3 3 3-3 3",
  chevronDown: "M6 9l6 6 6-6",
  check: "M5 12l5 5L20 7",
};

export function ToolbarIcon({ name }) {
  return <svg className="kl-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"
    stroke="currentColor" strokeWidth={name === "more" ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={toolbarIcons[name]} />
  </svg>;
}
