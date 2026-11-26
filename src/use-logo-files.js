import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { defaultFileName, restoreDraft, saveDraft } from "./draft.js";
import { allowsLogoDownload } from "./viewport.js";

export function useLogoFiles({
  initialSource, editorRef, activeTab, isMobile, showEditor,
  identifyExample, onProgramOpened, onError,
}) {
  const [{ storage, draft }] = useState(restoreDraft);
  const [source, setSource] = useState(draft?.source ?? initialSource);
  const [fileName, setFileName] = useState(draft?.fileName ?? defaultFileName);
  const [openingFile, setOpeningFile] = useState(false);
  const [fileStatus, setFileStatus] = useState("");
  const [canDownloadFile] = useState(allowsLogoDownload);
  const fileInputRef = useRef(null);
  const pendingCopy = useRef(false);

  function loadExampleProgram(program, name) {
    saveDraft(storage, null);
    setFileStatus("");
    setFileName(name);
    setSource(program);
  }

  function keepCurrentDraft() {
    saveDraft(storage, { source, fileName });
  }

  function editProgram(program, { lesson, patrol, example }) {
    setSource(program);
    saveDraft(storage, { source: program, fileName, lesson, patrol, example });
    setFileStatus("");
  }

  function loadOwnProgram(program, name, message) {
    const example = identifyExample(program);
    saveDraft(storage, { source: program, fileName: name, example });
    setSource(program);
    setFileStatus("");
    setFileName(name);
    onProgramOpened(example, message);
  }

  // After saving in Mis programas or the notebook, the editor takes the
  // saved name, so that the Aula and downloads say which program it is.
  function renameFile(name) {
    const safe = name.trim().replace(/[\/\\]/g, "_");
    if (!safe) return;
    setFileName(/\.logo$/i.test(safe) ? safe : `${safe}.logo`);
  }

  function openEditorProgram(program, name = defaultFileName) {
    loadOwnProgram(program, name, "");
    window.requestAnimationFrame(() => editorRef.current?.focus({ preventScroll: true }));
  }

  async function openLogo(event, editorLocked) {
    const picker = event.currentTarget;
    const file = picker.files[0];
    // Clearing the input lets the user reopen the same file after editing it.
    picker.value = "";
    if (!file || editorLocked) return;
    if (!/\.logo$/i.test(file.name)) {
      onError("Elige un archivo con extensión .logo.");
      return;
    }

    setOpeningFile(true);
    try {
      const bytes = await file.arrayBuffer();
      const program = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\r\n?/g, "\n");
      loadOwnProgram(program, file.name, "Archivo abierto");
    } catch {
      onError("No se pudo leer el archivo. Comprueba que esté guardado en UTF-8.");
    } finally {
      setOpeningFile(false);
    }
  }

  function downloadLogo() {
    const url = URL.createObjectURL(new Blob([source], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const copyEditorSource = useCallback(() => {
    const editor = editorRef.current;
    editor.focus({ preventScroll: true });
    editor.select();
    let copied = false;
    try {
      copied = editor.ownerDocument.execCommand("copy");
    } catch {
      // Keep the program selected for the browser's Copy command.
    }
    setFileStatus(copied
      ? `Código copiado. Pégalo en un editor de texto y guárdalo como ${fileName}.`
      : `Código seleccionado. Usa Ctrl / ⌘ + C y guárdalo como ${fileName} en un editor de texto.`);
  }, [editorRef, fileName]);

  useLayoutEffect(() => {
    if (activeTab === "code" && pendingCopy.current) {
      pendingCopy.current = false;
      copyEditorSource();
    }
  }, [activeTab, copyEditorSource]);

  function copyLogo() {
    if (isMobile && activeTab !== "code") {
      pendingCopy.current = true;
      showEditor();
      return;
    }
    copyEditorSource();
  }

  return {
    draft, source, setSource, fileName, fileStatus, setFileStatus, openingFile, canDownloadFile, fileInputRef,
    loadExampleProgram, keepCurrentDraft, editProgram, openEditorProgram, renameFile, openLogo, downloadLogo, copyLogo,
  };
}
