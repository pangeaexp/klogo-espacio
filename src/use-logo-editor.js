import { useRef, useState } from "react";
import { completionText, logoCompletions } from "./logo-complete.js";
import { logoIndentEdit } from "./logo-indent.js";

export function useLogoEditor({ editorRef, editSource, syncLineNumbers, onRun, onStep, onPauseOrResume }) {
  // Suggestions while typing: a list under the word at the caret.
  const [completion, setCompletion] = useState(null);
  const charWidth = useRef({ font: "", width: 0 });

  function updateCompletion(editor) {
    const caret = editor.selectionStart;
    const found = !editor.readOnly && caret === editor.selectionEnd ? logoCompletions(editor.value, caret) : null;
    if (!found) {
      setCompletion(null);
      return;
    }
    const style = getComputedStyle(editor);
    if (charWidth.current.font !== style.font) {
      const context = document.createElement("canvas").getContext("2d");
      context.font = style.font;
      charWidth.current = { font: style.font, width: context.measureText("M").width };
    }
    const lines = editor.value.slice(0, found.start).split("\n");
    const lineHeight = parseFloat(style.lineHeight);
    const row = lines.length - 1;
    const column = Array.from(lines.at(-1)).length;
    const box = editor.parentElement;
    const top = editor.offsetTop + parseFloat(style.paddingTop) + (row + 1) * lineHeight - editor.scrollTop;
    const above = top + 190 > box.clientHeight && top - lineHeight > box.clientHeight / 2;
    const left = editor.offsetLeft + parseFloat(style.paddingLeft) + column * charWidth.current.width - editor.scrollLeft;
    setCompletion({
      ...found,
      active: 0,
      top: above ? top - lineHeight : top,
      above,
      left: Math.max(4, Math.min(left, box.clientWidth - 184)),
    });
  }

  function acceptCompletion(item) {
    const editor = editorRef.current;
    if (!completion || !editor || editor.readOnly) return;
    editor.focus();
    editor.setSelectionRange(completion.start, completion.end);
    const text = completionText(item, completion.word);
    // Through the editing history, so Ctrl+Z takes the suggestion back.
    if (!editor.ownerDocument.execCommand("insertText", false, text)) {
      editor.setRangeText(text, completion.start, completion.end, "end");
    }
    setCompletion(null);
    editSource(editor.value);
    syncLineNumbers();
  }

  function completionKeyDown(event) {
    if (!completion) return false;
    const count = completion.items.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setCompletion({ ...completion, active: (completion.active + step + count) % count });
      return true;
    }
    if (event.key === "Tab" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      acceptCompletion(completion.items[completion.active]);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setCompletion(null);
      return true;
    }
    // Enter keeps its new line; any other key that moves the caret closes the list.
    if (["Enter", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) setCompletion(null);
    return false;
  }

  function editorKeyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if (completionKeyDown(event)) return;
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onRun();
      return;
    }
    if (event.key === "F10") {
      event.preventDefault();
      onStep();
      return;
    }
    if (event.key === "F8") {
      event.preventDefault();
      onPauseOrResume();
      return;
    }
    const editor = event.currentTarget;
    if (editor.readOnly || event.ctrlKey || event.metaKey || (event.altKey && event.key === "Enter")) return;
    if (event.key !== "Enter" && event.key !== "]") return;
    const edit = logoIndentEdit(editor.value, editor.selectionStart, editor.selectionEnd, event.key);
    if (!edit) return;
    event.preventDefault();
    editor.setSelectionRange(edit.start, edit.end);
    // Insert through the browser's editing history so undo can remove the indentation and newline together.
    if (!editor.ownerDocument.execCommand("insertText", false, edit.text)) {
      editor.setRangeText(edit.text, edit.start, edit.end, "end");
    }
    if (edit.caret !== undefined) editor.setSelectionRange(edit.caret, edit.caret);
    editSource(editor.value);
    syncLineNumbers();
  }

  function changeEditor(event) {
    editSource(event.target.value);
    const typing = /^(?:insertText|deleteContentBackward)$/.test(event.nativeEvent.inputType ?? "");
    if (typing) updateCompletion(event.target);
    else dismissCompletion();
  }

  function dismissCompletion() {
    setCompletion(null);
  }

  function scrollEditor() {
    syncLineNumbers();
    dismissCompletion();
  }

  return { completion, acceptCompletion, editorKeyDown, changeEditor, dismissCompletion, scrollEditor };
}
