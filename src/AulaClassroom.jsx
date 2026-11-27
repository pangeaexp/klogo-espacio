// The Aula as index.mdx mounts it: AulaPanel plus what the notebooks keep.
// A student's name goes to their notebook and is suggested next time; only
// the teacher (whose Kunobi hosts the room) gets every notebook (NotebooksPanel).
import { AulaPanel } from "./AulaPanel.jsx";
import { NotebooksPanel } from "./NotebooksPanel.jsx";
import { useNotebookName, useViewerKind } from "./library-stores.js";

export function AulaClassroom(props) {
  const kind = useViewerKind();
  const notebook = useNotebookName();
  const visitor = kind === "student";
  return (
    <AulaPanel {...props}
      savedName={visitor ? notebook.name : ""}
      onNameChosen={visitor ? notebook.save : undefined}
      extra={kind === "person" ? <NotebooksPanel locked={props.locked} onOpenProgram={props.onOpenProgram} /> : null} />
  );
}
