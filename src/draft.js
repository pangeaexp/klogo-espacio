import { lessons } from "./lessons.js";
import { getProjectChallenge } from "./projects.js";
import { treasureProject } from "./treasure-project.js";

export const defaultFileName = "programa.logo";
const draftStorageKey = "klogo.editor.draft.v1";
const lessonKeys = Object.keys(lessons);

// The last edited program, kept in localStorage when the page may use it.
export function restoreDraft() {
  let storage = null;
  try {
    storage = window.localStorage;
    const saved = JSON.parse(storage.getItem(draftStorageKey) ?? "null");
    if (typeof saved?.source === "string") {
      return {
        storage,
        draft: {
          source: saved.source,
          fileName: typeof saved.fileName === "string" && /\.logo$/i.test(saved.fileName) ? saved.fileName : defaultFileName,
          lesson: lessonKeys.includes(saved.lesson) ? saved.lesson : "",
          example: getProjectChallenge(saved.example) || ["eliza", treasureProject].includes(saved.example)
            ? saved.example : saved.patrol === true ? "orbital" : "",
        },
      };
    }
  } catch {
    // The host may disable local storage, and a previously saved draft can be malformed.
  }
  return { storage, draft: null };
}

export function saveDraft(storage, draft) {
  if (!storage) return;
  try {
    if (draft) {
      storage.setItem(draftStorageKey, JSON.stringify(draft));
    } else {
      storage.removeItem(draftStorageKey);
    }
  } catch {
    // Editing remains available if storage is blocked or full.
  }
}
