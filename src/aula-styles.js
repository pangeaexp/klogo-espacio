export const aulaStyles = `
  .kl-workspace .kl-aula { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin: 0 0 12px; padding: 8px 10px; border: 1px solid #c7d1c5; border-radius: 10px; background: #fffef8; font-size: calc(14px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-title { margin: 0; font-size: calc(14px * var(--kl-text, 1)); color: #213d36; }
  .kl-workspace .kl-aula-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; flex: 1 1 auto; min-width: 0; margin: 0; }
  .kl-workspace .kl-aula-row input { min-width: 0; flex: 0 1 14em; padding: 5px 8px; border: 1px solid #c7d1c5; border-radius: 7px; font: inherit; }
  .kl-workspace .kl-aula-note { margin: 0; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-error { flex: 1 0 100%; margin: 0; color: #9b2c1f; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-note .kl-icon { inline-size: 15px; block-size: 15px; margin-inline-end: 3px; vertical-align: -3px; color: #216447; }
  .kl-workspace .kl-aula-bar { gap: 6px; }
  .kl-workspace .kl-aula-tool { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-inline-size: 36px; block-size: 36px; padding: 0 8px; }
  .kl-workspace .kl-aula-tool[aria-pressed="true"] { color: #174b35; background: #e6f2ea; border-color: #216447; font-weight: 650; }
  .kl-workspace .kl-aula-menu > summary .kl-icon:last-child:not(:first-child) { inline-size: 14px; block-size: 14px; }
  .kl-workspace .kl-aula-send .kl-options-items { inset-inline-start: 0; inset-inline-end: auto; }
  .kl-workspace .kl-aula-menu-danger, .kl-workspace .kl-aula-menu-danger .kl-icon { color: #9b2c1f; }
  .kl-workspace .kl-aula-sep { inline-size: 1px; block-size: 22px; background: #c7d1c5; }
  .kl-workspace .kl-aula-status { display: inline-flex; align-items: center; gap: 4px; flex: 1 1 0; min-width: 0; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-status .kl-icon { inline-size: 15px; block-size: 15px; color: #216447; }
  .kl-workspace .kl-aula-count { font-variant-numeric: tabular-nums; }
  .kl-workspace .kl-aula-hands { display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 6px; color: #8a5a00; background: #fff4d6; font-weight: 650; }
  .kl-workspace .kl-aula-hands .kl-icon { inline-size: 14px; block-size: 14px; }
  .kl-workspace .kl-aula-hand { color: #8a5a00; background: #fff4d6; border-color: #e3c27a; }
  .kl-workspace .kl-aula-list .kl-aula-hand-cell { inline-size: 1%; padding-inline-end: 0; }
  .kl-workspace .kl-aula-list thead .kl-icon { inline-size: 15px; block-size: 15px; vertical-align: -3px; }
  .kl-workspace .kl-aula-scroll { flex: 1 0 100%; min-width: 0; overflow-x: auto; }
  .kl-workspace .kl-aula-list { width: 100%; border-collapse: collapse; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-list :is(th, td) { padding: 4px 8px; border-top: 1px solid #e3e8df; text-align: left; vertical-align: middle; }
  .kl-workspace .kl-aula-list thead th { border-top: 0; color: #48635a; font-weight: 600; }
  .kl-workspace .kl-aula-list tr[data-hand="true"] { background: #fff4d6; }
  .kl-workspace .kl-aula-list td:nth-child(4) { font-variant-numeric: tabular-nums; }
  .kl-workspace .kl-aula-offer { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; flex: 1 0 100%; padding: 6px 8px; border-radius: 8px; background: #e6f2ea; }
  .kl-workspace .kl-aula-open { color: #fff; background: #216447; border-color: #216447; font-weight: 650; }
  .kl-workspace .kl-aula-delivery { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
  .kl-workspace .kl-aula-confirm { flex: 1 0 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 2px 6px; border-radius: 8px; background: #fbe9e5; }
  .kl-workspace .kl-aula-danger { color: #fff; background: #9b2c1f; border-color: #9b2c1f; font-weight: 650; }
  .kl-workspace .kl-aula-pause { position: fixed; inset: 0; z-index: 50; display: grid; place-content: center; gap: 8px; padding: 24px; text-align: center; color: #fffef8; background: rgb(22 46 40 / .94); font-size: calc(18px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-pause p { margin: 0; }
  .kl-workspace .kl-aula-pause-title { font-size: calc(34px * var(--kl-text, 1)); font-weight: 700; }
  .kl-workspace .kl-aula-checklist { flex: 1 0 100%; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-checklist summary { cursor: pointer; color: #213d36; font-weight: 600; }
  .kl-workspace .kl-aula-checklist ol { margin: 6px 0 0; padding-inline-start: 1.4em; display: grid; gap: 3px; }
  .kl-workspace .kl-aula-manual { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex: 1 0 100%; }
  .kl-workspace .kl-aula-manual label { flex: 1 0 100%; color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
  .kl-workspace .kl-aula-manual textarea { flex: 1 1 100%; min-width: 0; font: 12px/1.4 ui-monospace, monospace; }
  @media (max-width: 680px) {
    .kl-workspace .kl-aula-tool { min-inline-size: 44px; block-size: 44px; }
  }
  @media (max-width: 420px) {
    .kl-workspace .kl-aula-send .kl-aula-tool-text { display: none; }
    .kl-workspace .kl-aula-sep { display: none; }
    .kl-workspace .kl-aula-status:not(:empty) { order: 10; flex-basis: 100%; }
  }
  .kl-workspace .kl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
