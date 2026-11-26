import { useEffect, useRef } from "react";
import { drawPlot } from "./plot.js";
import { projectChallengePrefix, projects } from "./projects.js";
import { challengePreviews, examplePreviews, projectPreviews } from "./project-previews.js";
import { exampleCards } from "./examples.js";
import { trackById } from "./tracks.js";
import { ToolbarIcon } from "./ToolbarIcon.jsx";

// A drawing for drawPlot from a generated thumbnail: strokes become moves
// and fills keep their place in the order.
export function previewDrawing({ background, items }) {
  const events = background ? [{ type: "background", color: background }] : [];
  for (const item of items) {
    if (item.length === 3) {
      const [color, x, y] = item;
      events.push({ type: "fill", at: { x, y }, color });
      continue;
    }
    const [color, width, ...points] = item;
    for (let i = 2; i < points.length; i += 2) {
      events.push({ type: "move", pen_down: true, color, width,
        from: { x: points[i - 2], y: points[i - 1] }, to: { x: points[i], y: points[i + 1] } });
    }
  }
  return { events, turtle: { position: { x: 0, y: 0 }, heading: 0, pen_down: true, visible: false } };
}

function Thumbnail({ preview }) {
  const canvas = useRef(null);
  useEffect(() => {
    const element = canvas.current;
    const drawing = previewDrawing(preview);
    const paint = () => drawPlot(element, drawing);
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, [preview]);
  return <canvas ref={canvas} className="kl-gallery-thumb" aria-hidden="true" />;
}

function Card({ title, tag, description, preview, symbol, openLabel, onOpen, buttonRef }) {
  return (
    <li className="kl-gallery-card">
      {preview
        ? <Thumbnail preview={preview} />
        : <div className="kl-gallery-thumb kl-gallery-symbol" aria-hidden="true">{symbol}</div>}
      <div className="kl-gallery-text">
        <h4>{title}</h4>
        {tag && <span className="kl-gallery-track">{tag}</span>}
        <p>{description}</p>
        <button type="button" className="kl-run" ref={buttonRef} aria-label={`${openLabel} ${title}`} onClick={onOpen}>
          <ToolbarIcon name="open" />Abrir</button>
      </div>
    </li>
  );
}

function Section({ id, title, children }) {
  return (
    <section className="kl-gallery-section" aria-labelledby={id}>
      <h3 id={id} className="kl-gallery-section-title">{title}</h3>
      <ul className="kl-gallery-list">{children}</ul>
    </section>
  );
}

// Everything outside the lessons: projects to start from, open challenges
// and other examples, each card with its thumbnail and what it is about.
export function ProjectGallery({ otherExamples, onOpen, onClose }) {
  const firstButton = useRef(null);
  useEffect(() => { firstButton.current?.focus(); }, []);
  const trackTag = key => {
    const track = trackById(key);
    return `${track.name} · ${track.ages}`;
  };
  return (
    <div className="kl-image-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="kl-image-dialog kl-gallery" role="dialog" aria-modal="true" aria-labelledby="klogo-gallery-title"
        onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }}>
        <div className="kl-gallery-head">
          <h2 id="klogo-gallery-title" className="kl-pane-title">Galería de programas</h2>
          <button type="button" className="kl-secondary kl-tool" aria-label="Cerrar" title="Cerrar" onClick={onClose}>✕</button>
        </div>
        <p className="kl-muted">Proyectos para seguir a tu manera, retos sin una única solución y ejemplos para explorar.</p>
        <Section id="klogo-gallery-projects" title="Proyectos">
          {Object.entries(projects).map(([key, project], index) => (
            <Card key={key} title={project.name} tag={trackTag(project.track)} description={project.description}
              preview={projectPreviews[key]} symbol="⌨" openLabel="Abrir" onOpen={() => onOpen(key)}
              buttonRef={index === 0 ? firstButton : undefined} />
          ))}
        </Section>
        <Section id="klogo-gallery-challenges" title="Retos abiertos">
          {Object.entries(projects).filter(([, project]) => project.challenge).map(([key, { challenge, track }]) => (
            <Card key={key} title={challenge.name} tag={trackTag(track)} description={challenge.goal}
              preview={challengePreviews[key]} symbol="★" openLabel="Reto abierto:"
              onOpen={() => onOpen(projectChallengePrefix + key)} />
          ))}
        </Section>
        <Section id="klogo-gallery-examples" title="Ejemplos">
          {Object.entries(otherExamples).map(([key, example]) => (
            <Card key={key} title={example.name} description={exampleCards[key]?.description}
              preview={examplePreviews[key]} symbol={exampleCards[key]?.symbol} openLabel="Abrir"
              onOpen={() => onOpen(key)} />
          ))}
        </Section>
      </div>
    </div>
  );
}
