// The library index.mdx passes to KLogo: the teacher's `programas`, or a
// student's own notebook (`cuadernos`), as aula-role.js tells them apart. The `key`
// remounts ProgramLibrary when the viewer becomes known, so each hook keeps
// its order.
import { ProgramLibrary } from "./ProgramLibrary.jsx";
import { useCuadernoLibrary, useProgramsLibrary, useViewerKind } from "./library-stores.js";

const opening = () => ({
  status: "opening", ready: false, canEdit: false, entries: [], capacity: null,
  save: async () => "error", rename: async () => false, remove: async () => false,
});

export function AulaLibrary(props) {
  const kind = useViewerKind();
  const useLibrary = kind === "student" ? useCuadernoLibrary : kind === "person" ? useProgramsLibrary : opening;
  return <ProgramLibrary key={kind ?? "opening"} {...props} useLibrary={useLibrary} />;
}
