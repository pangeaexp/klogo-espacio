import { useRef } from "react";

// Código, Lienzo and Salida on mobile (ELIZA has no Lienzo: its talk is in Salida),
// moved between with the arrow keys, Home and End.
export function MobileTabs({ tabs, activeTab, onSelect, conversation }) {
  const listRef = useRef(null);

  function keyDown(event, index) {
    const last = tabs.length - 1;
    const target = {
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowRight: index === last ? 0 : index + 1,
      Home: 0,
      End: last,
    }[event.key];
    if (!Number.isInteger(target)) return;
    event.preventDefault();
    onSelect(tabs[target].id);
    listRef.current.children[target].focus();
  }

  return (
    <div className="kl-tab-list" data-conversation={conversation} role="tablist" aria-label="Vistas de KLogo" ref={listRef}>
      {tabs.map(({ id, label }, index) => (
        <button type="button" className="kl-tab" role="tab" key={id} id={`klogo-tab-${id}`}
          aria-selected={activeTab === id} aria-controls={`klogo-panel-${id}`}
          tabIndex={activeTab === id ? 0 : -1} onClick={() => onSelect(id)}
          onKeyDown={event => keyDown(event, index)}>{label}</button>
      ))}
    </div>
  );
}
