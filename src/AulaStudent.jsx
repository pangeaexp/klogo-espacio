import { ToolbarIcon } from "./ToolbarIcon.jsx";
import { cleanName, maxName, timeOfDay } from "./aula-state.js";

export function AulaJoin({ name, setName, enter, disabled, savesName }) {
  return (
    // No <form>: the web link's iframe has sandbox="allow-scripts", which
    // blocks form submission, so the button and Enter call enter() directly.
    <div className="kl-aula-row" role="group" aria-label="Entrar en el aula">
      <label htmlFor="klogo-aula-name">Tu nombre</label>
      <input id="klogo-aula-name" value={name} maxLength={maxName} autoComplete="off"
        onChange={event => setName(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); enter(); } }} />
      <button type="button" className="kl-secondary" disabled={disabled || !cleanName(name)} onClick={enter}>Entrar en el aula</button>
      <span className="kl-aula-note">{savesName
        ? "El profesor verá tu nombre, tu lección y los retos que superes. Tu nombre se guarda en tu cuaderno."
        : "El profesor verá tu nombre, tu lección y los retos que superes."}</span>
    </div>
  );
}

export function AulaStudent({ name, handUp, myDelivery, disabled, locked, offer,
  toggleHand, deliver, openSent, dismissOffer }) {
  return (
    <div className="kl-aula-row">
      <span>En el aula como <strong>{name}</strong></span>
      <button type="button" className="kl-secondary kl-aula-tool" aria-pressed={handUp} disabled={disabled} onClick={toggleHand}>
        <ToolbarIcon name="hand" />{handUp ? "Bajar la mano" : "Pedir ayuda"}
      </button>
      <button type="button" className="kl-secondary kl-aula-tool" disabled={disabled} onClick={deliver}
        title="El profesor recibe una copia del programa de tu editor">
        <ToolbarIcon name="upload" />{myDelivery ? "Entregar de nuevo" : "Entregar"}</button>
      {myDelivery && <span className="kl-aula-note"><ToolbarIcon name="check" />Entregado a las {timeOfDay.format(myDelivery.t)}</span>}
      {handUp && <span className="kl-aula-note">El profesor ve que pides ayuda.</span>}
      {offer && (
        <div className="kl-aula-offer" role="status">
          <span>El profesor ha enviado {offer.kind === "lesson" ? "la lección" : "el programa"} <strong>{offer.title}</strong>.</span>
          <button type="button" className="kl-secondary kl-aula-open" disabled={locked} onClick={openSent}
            title={locked ? "Detén tu programa para abrirlo" : offer.kind === "program" ? "Sustituye el programa de tu editor" : undefined}>Abrir</button>
          <button type="button" className="kl-secondary" onClick={dismissOffer}>Ahora no</button>
          {locked && <span className="kl-aula-note">Detén tu programa para abrirlo.</span>}
        </div>
      )}
    </div>
  );
}
