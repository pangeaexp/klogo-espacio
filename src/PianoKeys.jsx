// Clickable piano keys over the LIENZO of the «Piano con el teclado» lesson.
// White keys share the width; black keys sit where the Logo program drew them.
export function PianoKeys({ keys, blackKeys, raster, enabled, onKey }) {
  return (
    <div className="kl-piano-keys" role="group" aria-label="Teclado de piano">
      <div className="kl-piano-white-keys">
        {keys.map((key, index) => (
          <button type="button" key={index} className="kl-piano-key"
            aria-label={`Tocar ${key}`} disabled={!enabled}
            onClick={() => onKey(key)}>{key}</button>
        ))}
      </div>
      {blackKeys.map(({ key, x, y, width, height }) => (
        <button type="button" key={x} className="kl-piano-key kl-piano-black-key"
          aria-label={`Tocar ${key}`} disabled={!enabled}
          style={{
            left: `${100 * x / raster.width}%`,
            top: `${100 * y / raster.height}%`,
            width: `${100 * width / raster.width}%`,
            height: `${100 * height / raster.height}%`,
          }}
          onClick={() => onKey(key)}>{key}</button>
      ))}
    </div>
  );
}
