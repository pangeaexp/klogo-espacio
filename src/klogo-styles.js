import { mobileQuery } from "./viewport.js";

// The page styles, inserted once by KLogo.
export const klogoStyles = `
        .kl-workspace, .kl-workspace * { box-sizing: border-box; }
        .kl-workspace {
          color-scheme: light;
          color: #182b29;
          background: #f0efe5;
          width: 100%;
          max-width: 1300px;
          margin-inline: auto;
          padding: clamp(16px, 3vw, 36px);
          border: 1px solid #dadbd0;
          border-radius: 16px;
          font: calc(15px * var(--kl-text, 1))/1.45 system-ui, sans-serif;
        }
        .kl-workspace .kl-options-items .kl-menu-reload { display: none; }
        @media (max-width: 360px) {
          .kl-workspace { padding: 12px; }
          .kl-workspace .kl-toolbar { gap: 4px 2px; }
          .kl-workspace .kl-toolbar .kl-reload-action { display: none; }
          .kl-workspace .kl-options-items .kl-menu-reload { display: flex; }
        }
        .kl-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .kl-workspace .kl-title { border: 0; margin: 0; padding: 0; font: 700 clamp(28px, 4vw, 43px)/1 system-ui, sans-serif; letter-spacing: -.06em; color: #182b29; }
        .kl-status { display: inline-flex; align-items: center; gap: 8px; color: #355550; font-size: calc(13px * var(--kl-text, 1)); }
        .kl-dot { display: block; width: 8px; height: 8px; border-radius: 50%; background: #987231; }
        .kl-dot[data-phase=ready] { background: #308461; }
        .kl-dot:is([data-phase=step], [data-phase=paused]) { background: #2f6fb0; }
        .kl-workspace .kl-step-action { display: grid; place-items: center; inline-size: 36px; block-size: 36px; padding: 0; }
        .kl-sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
        .kl-toolbar [aria-disabled=true] { opacity: .5; cursor: default; }
        .kl-run-label { display: inline-grid; }
        .kl-run-label > span { grid-area: 1 / 1; }
        .kl-run-ghost { visibility: hidden; }
        .kl-step-line { position: absolute; left: 0; right: 0; top: 0; pointer-events: none; background: rgb(255 196 84 / .3); box-shadow: inset 3px 0 #d58a1a; }
        .kl-step-line[data-click=true] { background: rgb(48 132 97 / .12); box-shadow: inset 3px 0 #308461; }
        .kl-step-inspector { padding: 10px 13px; border-top: 1px solid #dfe1d7; }
        .kl-step-inspector-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 12px; }
        .kl-step-loop { color: #216447; font-size: calc(13px * var(--kl-text, 1)); font-weight: 600; }
        .kl-step-inspector > p { margin: 6px 0 0; }
        .kl-step-variables { max-height: 160px; overflow: auto; margin: 7px 0 0; font: calc(13px * var(--kl-text, 1))/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        .kl-step-variables > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 12px; padding: 5px 0; border-top: 1px solid #dfe1d7; }
        .kl-step-variables :is(dt, dd) { margin: 0; overflow-wrap: anywhere; }
        .kl-step-variables dd { text-align: end; white-space: pre-wrap; }
        .kl-dot[data-phase=unavailable] { background: #a73c36; }
        .kl-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 14px; align-items: stretch; }
        .kl-grid[data-reference-open=true] { align-items: start; }
        .kl-canvas-panel { display: contents; }
        .kl-workspace .kl-reference { width: min(760px, calc(100% - 24px)); max-height: calc(100dvh - 24px); padding: 16px; border: 1px solid #c7d1c5; border-radius: 12px; color: #183e31; background: #fbfaf5; }
        .kl-reference::backdrop { background: rgb(17 34 32 / .55); }
        .kl-reference-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .kl-workspace .kl-reference-title { margin: 0; color: #182b29; font: 700 calc(21px * var(--kl-text, 1))/1.3 system-ui, sans-serif; }
        .kl-reference-search { display: grid; gap: 4px; margin: 12px 0; color: #355550; }
        .kl-workspace .kl-reference-search input { width: 100%; padding: 8px 10px; border: 1px solid #c7d1c5; border-radius: 7px; background: #fffef8; color: #182b29; font: calc(16px * var(--kl-text, 1))/1.3 system-ui, sans-serif; }
        .kl-reference-body { display: grid; grid-template-columns: minmax(145px, 1fr) minmax(0, 2.15fr); gap: 14px; align-items: start; }
        .kl-reference-index { max-height: min(53dvh, 440px); overflow: auto; padding: 4px; border: 1px solid #d5d8cc; border-radius: 7px; }
        .kl-workspace .kl-reference-group { margin: 7px 6px 3px; color: #48635a; font: 600 calc(13px * var(--kl-text, 1))/1.3 system-ui, sans-serif; }
        .kl-workspace .kl-reference-entry { display: block; width: 100%; padding: 7px 6px; border: 0; border-radius: 4px; background: transparent; color: #213d36; text-align: left; font: 600 calc(13px * var(--kl-text, 1))/1.3 ui-monospace, monospace; cursor: pointer; }
        .kl-workspace .kl-reference-entry[aria-current=true], .kl-workspace .kl-reference-entry:hover { background: #e0ece3; }
        .kl-reference-detail { min-width: 0; }
        .kl-reference-detail dl { margin: 8px 0; }
        .kl-reference-detail dt { margin-top: 6px; font-weight: 650; }
        .kl-reference-detail dd { margin: 1px 0 0; overflow-wrap: anywhere; }
        .kl-workspace .kl-reference-code { margin: 2px 0 8px; padding: 7px 9px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid #d5d8cc; border-radius: 6px; background: #f0f1e8; color: #183e31; font: calc(13px * var(--kl-text, 1))/1.5 ui-monospace, monospace; }
        @media ${mobileQuery} {
          .kl-reference-body { grid-template-columns: minmax(0, 1fr); gap: 10px; }
          .kl-reference-index { max-height: 145px; }
        }
        .kl-canvas-panel[hidden], .kl-reference-docked[hidden] { display: none; }
        .kl-pane.kl-reference-docked { display: block; align-self: start; }
        .kl-reference-docked .kl-reference-content { padding: 0 13px 9px; }
        .kl-reference-docked .kl-reference-body { grid-template-columns: minmax(0, 1fr); }
        .kl-reference-docked .kl-reference-index { max-height: 140px; }
        .kl-reference-docked .kl-reference-index > div { display: flex; flex-wrap: wrap; gap: 4px; }
        .kl-reference-docked .kl-reference-group { flex-basis: 100%; }
        .kl-reference-docked .kl-reference-entry { width: auto; max-width: 100%; overflow-wrap: anywhere; }
        .kl-reference-docked .kl-reference-detail h3 { color: #216447 !important; font-family: ui-monospace, monospace !important; }
        .kl-pane { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; min-width: 0; background: #fbfaf5; border: 1px solid #d5d8cc; border-radius: 12px; overflow: hidden; }
        /* The canvas pane keeps its foot (turtle pad, Objetivo) right under the canvas:
           when the editor pane grows (a longer challenge message), the extra height goes
           below the foot instead of moving its buttons under the child's finger. */
        .kl-plot-pane { grid-template-rows: auto auto auto; align-content: start; }
        /* The pad and Objetivo stay on the left; the status («Dibujando · 3 trazos»)
           changes width while drawing, so it goes to the right on its own. */
        .kl-plot-pane > .kl-pane-foot { justify-content: flex-start; }
        .kl-plot-pane > .kl-pane-foot > [role="status"] { margin-inline-start: auto; }
        .kl-pane-head, .kl-pane-foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px 12px; padding: 9px 13px; min-height: 51px; }
        .kl-pane-head { border-bottom: 1px solid #dfe1d7; }
        .kl-canvas-pick { cursor: crosshair; outline: 3px solid #2f6fb0; outline-offset: -3px; }
        .kl-canvas-pick:focus-visible { outline-color: #d58a1a; }
        .kl-image-backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 16px; background: rgb(14 35 37 / .55); }
        .kl-image-dialog { display: grid; gap: 10px; width: min(560px, 100%); max-height: calc(100vh - 32px); overflow: auto; padding: 16px; border-radius: 14px; background: #fbfbf7; box-shadow: 0 12px 40px rgb(0 0 0 / .3); }
        .kl-image-dialog p { margin: 0; }
        .kl-workspace .kl-gallery { width: min(760px, 100%); }
        .kl-gallery-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .kl-gallery-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
        .kl-gallery-card { display: grid; grid-template-rows: auto 1fr; overflow: hidden; border: 1px solid #dfe1d7; border-radius: 10px; background: #fffef8; }
        .kl-gallery-thumb { display: block; width: 100%; aspect-ratio: 4 / 3; background: #0e2325; }
        .kl-gallery-symbol { display: grid; place-items: center; color: #76f2bf; font-size: 46px; }
        .kl-gallery-section { display: grid; gap: 8px; margin-top: 14px; }
        .kl-workspace .kl-gallery-section-title { margin: 0; font: 700 calc(13px * var(--kl-text, 1))/1.3 system-ui, sans-serif; color: #355550; text-transform: uppercase; letter-spacing: 0.04em; }
        .kl-gallery-text { display: grid; align-content: start; gap: 6px; padding: 10px 12px 12px; }
        .kl-workspace .kl-gallery-text h4 { margin: 0; font: 700 calc(15px * var(--kl-text, 1))/1.3 system-ui, sans-serif; color: #182b29; }
        .kl-gallery-track { justify-self: start; padding: 1px 8px; border-radius: 999px; background: #e8eee2; color: #355550; font-size: calc(12px * var(--kl-text, 1)); }
        .kl-workspace .kl-gallery-text p { margin: 0; font-size: calc(13px * var(--kl-text, 1)); color: #355550; line-height: 1.45; }
        .kl-gallery-text .kl-run { justify-self: start; display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; }
        .kl-image-preview { display: block; width: 100%; height: auto; max-height: 50vh; object-fit: contain; border-radius: 8px; background: #0e2325; }
        .kl-image-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .kl-image-actions button { display: inline-flex; align-items: center; gap: 6px; }
        .kl-speed { display: inline-flex; align-items: center; gap: 8px; font-size: calc(13px * var(--kl-text, 1)); color: #355550; }
        .kl-speed-select { min-height: 32px; padding: 4px 8px; border: 1px solid #c9cfc2; border-radius: 8px; background: #fbfbf7; color: inherit; font: inherit; }
        .kl-zoom-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .kl-pane-foot { border-top: 1px solid #dfe1d7; }
        .kl-pane-title { margin: 0 !important; padding: 0 !important; border: 0 !important; color: #213d36 !important; font: 650 calc(14px * var(--kl-text, 1))/1.4 system-ui, sans-serif !important; }
        .kl-workspace select { color: #213d36; background: #fffef8; border: 1px solid #c7d1c5; border-radius: 7px; padding: 5px 8px; font: inherit; }
        .kl-lesson-nav, .kl-lesson-line { display: contents; }
        .kl-lesson-line > .kl-tool { order: 1; display: grid; place-items: center; inline-size: 32px; block-size: 32px; padding: 0; margin-inline-start: auto; }
        .kl-lesson-line > .kl-progress { order: 1; }
        .kl-challenge-spacer { display: none; }
        .kl-lesson-nav .kl-challenge, .kl-turn-practice, .kl-lesson-summary, .kl-progress-panel { order: 2; flex: 1 0 100%; }
        .kl-turn-practice { min-width: 0; border: 1px solid #c7d1c5; border-radius: 8px; background: #f1f5ec; color: #213d36; font-size: calc(13px * var(--kl-text, 1)); }
        .kl-turn-practice summary { padding: 6px 8px; font-weight: 650; cursor: pointer; }
        .kl-workspace .kl-turn-practice p { margin: 0; }
        .kl-turn-practice > p { padding: 0 8px; }
        .kl-turn-practice-body { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 8px; }
        .kl-turn-controls { flex: 1 1 150px; min-width: 0; display: grid; justify-items: start; gap: 4px; }
        .kl-turn-controls label { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .kl-turn-controls label, .kl-turn-controls select { max-width: 100%; min-width: 0; }
        .kl-turn-dial { position: relative; flex: none; width: 96px; height: 96px; border: 1px solid #8fa99a; border-radius: 50%;
          background: repeating-conic-gradient(from -1deg, #527267 0deg 2deg, transparent 2deg var(--sector)),
            conic-gradient(#bad8c6 0deg var(--turned), #fffef8 var(--turned) 360deg); }
        .kl-turn-needle { position: absolute; inset: 0; transform: rotate(var(--turned)); }
        .kl-turn-needle::before { content: ""; position: absolute; inset: 18% calc(50% - 2px) 50%; border-radius: 2px; background: #154d3c; }
        .kl-turn-needle::after { content: ""; position: absolute; top: 12%; left: calc(50% - 6px); border: 6px solid transparent; border-top: 0; border-bottom-color: #154d3c; }
        .kl-ink-rounds { flex: 1 1 200px; display: grid; grid-template-columns: repeat(6, minmax(0, 28px)); gap: 6px; margin: 0; padding: 0; list-style: none; }
        .kl-ink-rounds li { aspect-ratio: 1; border: 1px solid #8fa99a; border-radius: 50%; background: #fffef8; }
        .kl-ink-chip { display: inline-block; inline-size: calc(12px * var(--kl-text, 1)); block-size: calc(12px * var(--kl-text, 1)); border: 1px solid #527267; border-radius: 50%; vertical-align: -1px; }
        .kl-lesson-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .kl-workspace .kl-text-size { display: flex; align-items: center; gap: 6px; padding: 4px 6px; font-size: calc(13px * var(--kl-text, 1)); color: #355550; }
        .kl-workspace .kl-text-size span { flex: 1; }
        .kl-workspace .kl-options-items .kl-text-size button { justify-content: center; min-width: 40px; padding: 6px 8px; border: 1px solid #cdd8cf; border-radius: 8px; background: #fffdf4; font-weight: 700; }
        .kl-workspace .kl-text-size output { min-width: 5ch; white-space: nowrap; text-align: center; font-variant-numeric: tabular-nums; }
        .kl-workspace .kl-target-toggle { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 5px 11px; border-radius: 999px; }
        .kl-workspace .kl-target-toggle[aria-pressed="true"] { border-color: #d58a1a; background: #fff1d6; color: #6b4a12; }
        .kl-turtle-pad { display: flex; flex-wrap: wrap; gap: 6px; }
        .kl-workspace .kl-turtle-pad .kl-tool { display: grid; place-items: center; min-width: 40px; min-height: 40px; border: 1px solid #cdd8cf; border-radius: 10px; background: #fffdf4; }
        .kl-file-name { min-width: 0; overflow-wrap: anywhere; margin-inline-end: auto; }
        .kl-lesson-summary { margin: 0; font-size: calc(13px * var(--kl-text, 1)); }
        .kl-treasure-project { flex-basis: 100%; }
        .kl-workspace .kl-treasure-project p { margin: 4px 0 0; color: #355550; font-size: calc(13px * var(--kl-text, 1)); }
        .kl-treasure-feedback { display: grid; align-content: start; gap: 5px; padding: 9px 13px; border-top: 1px solid #dfe1d7; }
        .kl-treasure-feedback button { max-width: 100%; overflow-wrap: anywhere; }
        .kl-workspace .kl-treasure-message { margin: 0; padding: 0; border: 0; background: transparent; color: #183e31; max-height: 100px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font: calc(13px * var(--kl-text, 1))/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        .kl-treasure-feedback button[aria-disabled=true] { opacity: .65; cursor: default; }
        .kl-workspace .kl-progress { position: relative; display: inline-flex; align-items: center; gap: 5px; min-height: 32px; padding: 3px 10px; border-radius: 999px; font-size: calc(13px * var(--kl-text, 1)); color: #355550; white-space: nowrap; }
        .kl-progress .kl-icon { inline-size: 15px; block-size: 15px; color: #216447; }
        .kl-progress-panel { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: calc(13px * var(--kl-text, 1)); color: #355550; }
        .kl-progress-panel[hidden], .kl-lesson-summary[hidden] { display: none; }
        .kl-progress-bar { display: inline-block; width: 64px; height: 6px; border-radius: 3px; background: #dfe1d7; overflow: hidden; }
        .kl-progress-bar > span { display: block; height: 100%; background: #308461; }
        .kl-unit-progress { flex-basis: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 4px 14px; margin: 2px 0 0; padding: 0; list-style: none; }
        .kl-unit-progress li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 3px 8px; border-radius: 8px; }
        .kl-unit-progress li[data-current=true] { background: #e8eee2; font-weight: 600; }
        .kl-unit-progress li[data-complete=true] .kl-unit-name { color: #216447; }
        .kl-unit-progress .kl-progress-bar { width: 48px; }
        .kl-unit-count { font-variant-numeric: tabular-nums; }
        .kl-progress-reset { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: calc(13px * var(--kl-text, 1)); }
        .kl-workspace .kl-link-button { border: 0; background: none; padding: 0; text-decoration: underline; color: #355550; }
        .kl-challenge { min-width: 0; margin: 0; padding: 3px 4px 3px 8px; border-left: 3px solid #d58a1a; border-radius: 6px; background: #fff6e3; color: #3b3220; font-size: calc(13px * var(--kl-text, 1)); line-height: 1.45; }
        .kl-challenge[data-done=true] { border-left-color: #308461; background: #e6f5ec; color: #1c3d2c; }
        .kl-workspace .kl-challenge p { margin: 0; }
        .kl-challenge-main { display: flex; align-items: center; gap: 7px; min-width: 0; }
        .kl-challenge-main > .kl-icon { color: #b26f0e; }
        .kl-challenge[data-done=true] .kl-challenge-main > .kl-icon { color: #308461; }
        .kl-challenge-goal { flex: 1; min-width: 0; }
        .kl-challenge-result { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; padding-inline-start: 24px; }
        .kl-challenge-result[hidden] { display: none; }
        .kl-challenge-status { font-weight: 600; }
        .kl-challenge-result[data-celebrate=true] { border-radius: 5px; animation: kl-celebrate 560ms ease-out both; }
        @keyframes kl-celebrate {
          0%, 100% { box-shadow: inset 0 0 0 0 transparent; background-color: transparent; }
          35% { box-shadow: inset 0 0 0 2px #58a47b; background-color: #ccebd7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .kl-challenge-result[data-celebrate=true] { animation: none; }
        }
        .kl-mobile-celebration { position: fixed; z-index: 5; inset-inline: 12px; bottom: max(12px, env(safe-area-inset-bottom)); max-width: 380px; margin-inline: auto; padding: 6px; border: 1px solid #308461; border-radius: 10px; background: #e6f5ec; color: #1c3d2c; box-shadow: 0 3px 14px #182b2926; }
        .kl-mobile-celebration .kl-challenge-result { justify-content: space-between; padding-inline: 6px; }
        .kl-mobile-celebration p { margin: 0; }
        .kl-workspace .kl-hint-button { flex: none; }
        .kl-hint-button .kl-icon { color: #216447; }
        .kl-workspace .kl-hint-button[aria-expanded=true] { background: #e8eee2; }
        .kl-workspace .kl-challenge-hints { margin: 0; padding: 0; list-style: none; }
        .kl-challenge-hints li { margin-top: 7px; padding-top: 6px; border-top: 1px solid rgb(87 62 22 / .2); }
        .kl-open-challenge { flex: 1 0 100%; }
        .kl-solution-hint { margin-top: 7px; padding-top: 6px; border-top: 1px solid rgb(87 62 22 / .2); }
        .kl-solution-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .kl-workspace .kl-solution-hint pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 18rem; overflow: auto; margin: 4px 0 7px; }
        .kl-hint-location { font-size: calc(12px * var(--kl-text, 1)); }
        .kl-workspace .kl-secondary { padding: 5px 8px; border: 1px solid #c7d1c5; border-radius: 7px; color: #213d36; background: #fffef8; font: inherit; font-size: calc(13px * var(--kl-text, 1)); cursor: pointer; }
        .kl-workspace .kl-secondary:disabled { opacity: .55; cursor: default; }
        .kl-workspace .kl-challenge-next { min-height: 34px; color: #fff; background: #216447; border-color: #216447; font-weight: 650; white-space: nowrap; }
        .kl-command-bar { position: relative; z-index: 2; margin-bottom: 12px; }
        .kl-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .kl-lesson-picker { display: flex; align-items: center; gap: 2px; flex: 1 1 240px; min-width: 0; max-width: 460px; padding: 2px; border: 1px solid #c7d1c5; border-radius: 999px; background: #fffef8; }
        .kl-workspace .kl-lesson-picker select { flex: 1 1 auto; min-width: 0; max-width: none; min-height: 32px; padding: 4px 2px; border: 0; background: transparent; font-size: calc(14px * var(--kl-text, 1)); text-overflow: ellipsis; }
        .kl-lesson-position { flex: none; padding-inline: 4px 2px; color: #6b7d77; font-size: calc(13px * var(--kl-text, 1)); font-variant-numeric: tabular-nums; }
        .kl-workspace .kl-lesson-picker .kl-tool { display: grid; place-items: center; flex: none; inline-size: 32px; block-size: 32px; padding: 0; border-radius: 50%; }
        .kl-toolbar-actions { display: contents; }
        .kl-toolbar-actions > :first-child { margin-inline-start: auto; }
        .kl-workspace .kl-tool { border-color: transparent; background: transparent; color: #355550; }
        .kl-workspace .kl-tool:hover:not(:disabled, [aria-disabled=true]) { background: #e8eee2; }
        .kl-toolbar .kl-library, .kl-toolbar .kl-library-actions { display: contents; }
        .kl-toolbar .kl-library > :not(.kl-library-actions), .kl-toolbar .kl-library-actions > span { order: 10; flex: 1 0 100%; min-width: 0; }
        .kl-workspace .kl-run.kl-toolbar-run { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding-inline: 9px; }
        .kl-icon { inline-size: 17px; block-size: 17px; flex: none; }
        .kl-workspace .kl-icon-action { display: grid; place-items: center; inline-size: 36px; block-size: 36px; padding: 0; text-decoration: none; }
        .kl-options { position: relative; }
        .kl-options summary { list-style: none; }
        .kl-options summary::-webkit-details-marker { display: none; }
        .kl-options[open] > summary, .kl-workspace .kl-icon-action:hover:not(:disabled, [aria-disabled=true]) { background: #e8eee2; }
        .kl-options-items { position: absolute; inset-inline-end: 0; top: calc(100% + 5px); z-index: 3; display: grid; gap: 3px; min-width: 174px; padding: 4px; background: #fffef8; border: 1px solid #c7d1c5; border-radius: 8px; box-shadow: 0 5px 15px #183e3124; }
        .kl-workspace .kl-options-items button { display: flex; align-items: center; gap: 8px; padding: 8px; border: 0; background: transparent; text-align: start; }
        .kl-workspace .kl-options-items button:hover:not(:disabled) { background: #e8eee2; }
        .kl-toolbar-feedback { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 6px; overflow-wrap: anywhere; }
        .kl-plot-box, .kl-code-box { position: relative; height: clamp(260px, 43vh, 430px); min-height: 0; }
        .kl-spatial { display: grid; grid-template-rows: minmax(0, 1fr) auto; height: 100%; min-width: 0; }
        .kl-spatial-canvas { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; background: #0e2325; touch-action: none; cursor: grab; }
        .kl-spatial-canvas:active { cursor: grabbing; }
        .kl-spatial-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 6px 10px; }
        .kl-spatial-actions button { min-width: 34px; }
        .kl-code-box { --kl-code-line-height: calc(23.1px * var(--kl-text, 1)); --kl-code-padding: 17px; display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
        .kl-hint-lines { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .kl-hint-line { position: absolute; inset-inline: 0; top: calc(var(--kl-code-padding) + var(--kl-hint-row) * var(--kl-code-line-height)); height: var(--kl-code-line-height); transform: translateY(var(--kl-hint-scroll, 0px)); background: rgb(48 132 97 / .12); box-shadow: inset 3px 0 #308461; }
        .kl-workspace :is(.kl-source, .kl-line-numbers) { font: calc(14px * var(--kl-text, 1))/var(--kl-code-line-height) ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        .kl-completions { position: absolute; z-index: 4; width: max-content; min-width: 0; padding: 4px; border: 1px solid #c7d1c5; border-radius: 8px; background: #fffef8; box-shadow: 0 6px 18px #183e3129; }
        .kl-completions[data-above="true"] { transform: translateY(-100%); }
        .kl-completions ul { margin: 0; padding: 0; list-style: none; }
        .kl-completions li { display: flex; align-items: baseline; gap: 8px; padding: 5px 8px; border-radius: 5px; cursor: pointer; font: calc(13px * var(--kl-text, 1))/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #183e31; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .kl-completions li span { overflow: hidden; text-overflow: ellipsis; color: #5b716b; font-family: system-ui, sans-serif; }
        .kl-completions li[aria-selected="true"] { background: #dcebe1; }
        .kl-completions li:hover { background: #e8eee2; }
        .kl-workspace .kl-completions-help { margin: 3px 8px 1px; font-size: calc(11px * var(--kl-text, 1)); color: #6b7d77; }
        .kl-line-gutter { overflow: hidden; background: #f0f1e8; border-right: 1px solid #dfe1d7; user-select: none; }
        .kl-workspace .kl-line-numbers { min-width: calc(2ch + 16px); margin: 0; border: 0; padding: var(--kl-code-padding) 8px; background: transparent; color: #48635a; text-align: right; white-space: pre; }
        .kl-workspace .kl-source { display: block; width: 100%; height: 100%; margin: 0; resize: none; border: 0; background: #fbfaf5; color: #183e31; border-radius: 0; padding: var(--kl-code-padding) 15px; outline-offset: -3px; tab-size: 2; }
        .kl-raster-area { height: 100%; display: grid; place-items: center; container-type: size; background: #192c36; }
        .kl-raster-frame { position: relative; width: min(100%, calc(100cqh * var(--kl-ratio))); aspect-ratio: var(--kl-ratio); }
        .kl-raster { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
        .kl-raster-zoom { cursor: crosshair; touch-action: none; user-select: none; }
        .kl-raster-selection { position: absolute; pointer-events: none; border: 1px solid white; box-shadow: 0 0 0 1px #192c36; background: rgb(255 255 255 / .15); }
        .kl-piano-keys { position: absolute; inset: 0; }
        .kl-piano-white-keys { position: absolute; inset: 2% 0 7%; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
        .kl-workspace .kl-piano-key {
          display: grid; align-items: end; justify-items: center; min-width: 0;
          padding: 0 0 8px; border: 0; border-radius: 0; color: #21353d; background: transparent;
          font: 700 clamp(12px, 2.2vw, 19px)/1 system-ui, sans-serif;
          cursor: pointer; touch-action: manipulation; user-select: none;
        }
        .kl-workspace .kl-piano-black-key { position: absolute; z-index: 1; color: #fff7df; padding-bottom: 6px; }
        .kl-workspace .kl-piano-key:disabled { cursor: default; }
        .kl-workspace .kl-piano-key:focus-visible { outline-offset: -3px; }
        .kl-piano-intro { display: grid; height: 100%; place-items: center; margin: 0; }
        .kl-coords { position: absolute; z-index: 2; pointer-events: none; padding: 2px 7px; border-radius: 6px; background: #fffef8e6; color: #183e31; font: 600 calc(12px * var(--kl-text, 1))/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre; box-shadow: 0 2px 6px #0003; }
        .kl-canvas { display: block; width: 100%; height: 100%; background: #0e2325; }
        .kl-muted { color: #48635a; font-size: calc(13px * var(--kl-text, 1)); }
        .kl-workspace .kl-run { border: 1px solid #143e32; color: #fffef8; background: #1f614c; border-radius: 8px; padding: 7px 14px; cursor: pointer; font: 650 calc(14px * var(--kl-text, 1))/1.35 system-ui, sans-serif; }
        .kl-workspace .kl-run:hover:not(:disabled, [aria-disabled=true]) { background: #174a3a; }
        .kl-workspace .kl-run:disabled { opacity: .55; cursor: wait; }
        .kl-workspace :is(button, input, textarea, select, a, summary):focus-visible { outline: 2px solid #247d64; }
        .kl-key-input { padding: 4px 8px; border: 1px solid #c7d1c5; border-radius: 5px; }
        .kl-key-input:focus { outline: 2px solid #247d64; outline-offset: 1px; }
        .kl-workspace .kl-diagnostic { margin: 14px 0 0; padding: 10px 13px; border: 1px solid #e6beb1; border-radius: 8px; background: #fff1e9; color: #8b3025; overflow-wrap: anywhere; }
        .kl-workspace .kl-diagnostic p { margin: 0; }
        .kl-workspace .kl-diagnostic .kl-diagnostic-help { margin-top: 6px; color: #5a2a1f; }
        .kl-workspace .kl-diagnostic-fix { margin-inline-start: 4px; padding: 3px 10px; border: 1px solid #d9a898; border-radius: 7px; background: #fffaf5; color: #7a2b20; font-weight: 650; }
        .kl-workspace .kl-diagnostic-link { border: 0; padding: 0; background: transparent; color: inherit; font: inherit; font-weight: 650; text-decoration: underline; cursor: pointer; }
        .kl-print { margin-top: 14px; border: 1px solid #d5d8cc; background: #fbfaf5; border-radius: 8px; padding: 10px 13px; }
        .kl-workspace .kl-transcript { display: flex; flex-direction: column; align-items: start; gap: 8px; height: clamp(220px, 40vh, 410px); overflow: auto; overscroll-behavior: contain; padding: 10px 13px; }
        .kl-workspace .kl-transcript p { margin: 0; max-width: 95%; padding: 6px 9px; border-radius: 8px; background: #e8eee2; overflow-wrap: anywhere; white-space: pre-wrap; }
        .kl-workspace .kl-transcript p[data-speaker="Tú"] { align-self: flex-end; background: #e4eeec; }
        .kl-conversation .kl-input { margin: 0; border: 0; border-top: 1px solid #dfe1d7; border-radius: 0; }
        .kl-workspace .kl-conversation .kl-answer { max-width: none; }
        .kl-game { grid-template-rows: auto minmax(0, 1fr); }
        .kl-game-content { padding: 10px 13px; }
        .kl-patrol-field { display: grid; grid-template: minmax(0, 1fr) / minmax(0, 1fr); place-items: stretch; background: #10162b; color: #fffef8; }
        .kl-patrol-field > * { grid-area: 1 / 1; }
        .kl-patrol-field .kl-raster-area { background: #10162b; }
        .kl-patrol-score, .kl-patrol-buttons { display: flex; gap: 8px 12px; flex-wrap: wrap; }
        .kl-patrol-field > p { place-self: center; z-index: 1; margin: 12px; text-align: center; }
        .kl-patrol-field > .kl-patrol-result { padding: 10px 14px; border: 1px solid #799cbc; border-radius: 8px; background: #10162b; }
        .kl-patrol-controls:focus-visible { outline: 2px solid #247d64; outline-offset: -3px; }
        .kl-workspace .kl-attempts { margin: 0 0 6px; }
        .kl-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 12px; color: #355550; font-size: calc(12px * var(--kl-text, 1)); }
        .kl-legend span { display: inline-flex; align-items: center; gap: 5px; }
        .kl-tile { display: grid; place-items: center; border: 1px solid transparent; border-radius: 8px; background: #e1e7e4; color: #213b36; }
        .kl-tile[data-mark="V"] { background: #27684f; color: #fffefa; }
        .kl-tile[data-mark="A"] { background: #f2cb75; color: #44300a; }
        .kl-tile[data-mark="·"] { background: #e1e7e4; color: #213b36; border-color: #cbd4ce; }
        .kl-legend .kl-tile { width: 20px; height: 20px; border-radius: 4px; font-size: calc(11px * var(--kl-text, 1)); }
        .kl-wordle-log { margin-top: 12px; max-height: 340px; overflow: auto; }
        .kl-workspace .kl-wordle-entries { display: grid; gap: 6px; list-style: none; margin: 0; padding: 0; }
        .kl-workspace .kl-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 48px)); gap: 6px; margin: 0; padding: 0; }
        .kl-tiles .kl-tile { height: 42px; position: relative; font: 700 calc(20px * var(--kl-text, 1))/1 system-ui, sans-serif; }
        .kl-tiles small { position: absolute; right: 4px; bottom: 3px; font: 650 calc(9px * var(--kl-text, 1))/1 system-ui, sans-serif; }
        .kl-wordle-message { color: #355550; overflow-wrap: anywhere; }
        .kl-input { margin-top: 14px; padding: 10px 13px; border: 1px solid #d5d8cc; border-radius: 8px; background: #fbfaf5; }
        .kl-input-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 6px; }
        .kl-workspace .kl-answer { flex: 1 1 140px; min-width: 0; max-width: 280px; padding: 7px 10px; background: #fffef8; border: 1px solid #c7d1c5; border-radius: 7px; color: #183e31; font: calc(16px * var(--kl-text, 1))/1.35 system-ui, sans-serif; }
        .kl-workspace .kl-input p { margin: 8px 0 0; }
        .kl-workspace .kl-print pre { margin: 6px 0 0; max-height: 200px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: #183e31; background: transparent; border: 0; padding: 0; }
        @media ${mobileQuery} {
          .kl-header { margin-bottom: 10px; }
          .kl-grid { grid-template-columns: minmax(0, 1fr); }
          .kl-canvas-panel { display: block; min-width: 0; }
          .kl-workspace [role=tabpanel][hidden] { display: none; }
          .kl-command-bar { position: sticky; top: 0; background: #f0efe5; padding: 6px 0; margin-bottom: 8px; }
          .kl-lesson-picker { order: 5; flex: 1 0 100%; max-width: none; }
          .kl-workspace .kl-lesson-picker select { min-height: 40px; }
          .kl-workspace .kl-lesson-picker .kl-tool { inline-size: 44px; block-size: 44px; }
          .kl-run-label { display: none; }
          .kl-workspace .kl-run.kl-toolbar-run { min-width: 44px; justify-content: center; }
          .kl-toolbar { gap: 4px; }
          .kl-workspace .kl-progress { min-height: 44px; }
          .kl-pane-head > .kl-file-name { flex: 1 1 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .kl-pane-head:has(.kl-lesson-nav) { column-gap: 6px; }
          .kl-workspace .kl-run.kl-toolbar-run { min-height: 44px; }
          .kl-workspace .kl-icon-action { inline-size: 44px; block-size: 44px; }
          .kl-workspace .kl-step-action { inline-size: 44px; block-size: 44px; }
          .kl-workspace .kl-hint-button, .kl-lesson-line > .kl-tool { inline-size: 44px; block-size: 44px; }
          .kl-treasure-feedback button { min-height: 44px; }
          .kl-workspace .kl-challenge-next { min-height: 44px; }
          .kl-turn-practice summary { min-height: 44px; align-content: center; }
          .kl-turn-controls :is(button, select) { min-height: 44px; }
          .kl-workspace .kl-options-items button { min-height: 44px; }
          .kl-spatial-actions button { min-width: 44px; min-height: 44px; }
          .kl-tab-list { margin-top: 7px; }
          .kl-tab-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border: 1px solid #d5d8cc; border-radius: 9px; background: #e7e9df; }
          .kl-tab-list[data-conversation=true] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .kl-workspace .kl-tab { min-height: 40px; padding: 6px 8px; border: 0; border-radius: 6px; background: transparent; color: #355550; font: 600 calc(14px * var(--kl-text, 1))/1.3 system-ui, sans-serif; cursor: pointer; }
          .kl-workspace .kl-tab[aria-selected=true] { background: #fbfaf5; color: #183e31; box-shadow: 0 0 0 1px #c7d1c5; }
          .kl-command-bar + .kl-input { margin: 0 0 10px; }
          .kl-workspace .kl-empty-output { margin: 0; padding: 12px 13px; }
          .kl-plot-box, .kl-code-box { height: clamp(220px, 36vh, 340px); }
        }
        /* Presentation mode: the whole width, taller panes and only the main controls. */
        .kl-workspace[data-presenting="true"] { max-width: none; min-height: 100dvh; border-radius: 0; }
        .kl-workspace[data-presenting="true"]:fullscreen { overflow: auto; border: 0; }
        .kl-workspace[data-presenting="true"] .kl-header { margin-bottom: 6px; }
        .kl-workspace[data-presenting="true"] .kl-title { font-size: 28px; }
        .kl-workspace[data-presenting="true"] :is(.kl-plot-box, .kl-code-box) { height: max(300px, calc(100dvh - 300px)); }
        .kl-workspace[data-presenting="true"] .kl-toolbar-actions > :not(.kl-options, .kl-present-exit) { display: none; }
        .kl-workspace .kl-present-exit { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 6px 12px; border-radius: 999px; border-color: #d58a1a; background: #fff1d6; color: #6b4a12; font-weight: 650; }
        @media ${mobileQuery} {
          .kl-workspace[data-presenting="true"] :is(.kl-plot-box, .kl-code-box) { height: max(260px, calc(100dvh - 330px)); }
          .kl-workspace .kl-present-exit { padding-inline: 10px; }
          .kl-workspace .kl-present-exit-text { display: none; }
        }
`;
