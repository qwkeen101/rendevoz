import { useEffect, useRef } from "react";
import { INote } from "~/typings/data";
import { CustomEditor } from "~/typings";
import { Descendant } from "slate";
import Id from "@/utils/id";
import { useDebounceFn, useMemoizedFn } from "@/hooks";
import getSetting from "@/core/setting/getSetting";
import { useEventHandler } from "@/events";
import { NoteStore, ObjectStore } from "@/stores";
import { Rendevoz } from "@/core/rendevoz";
import { EDITOR_TO_CHANGED } from "../weakMaps";

const initial = [
  {
    id: Id.getId(),
    type: "paragraph",
    children: [{ text: "" }],
  },
];
const EditorInstanceMap = new Map<number, Set<CustomEditor>>();

const normalizeFirstLayer = (editor: CustomEditor) => {
  const firstLayerIdSet = new Set<number>();
  editor.children.forEach((i, idx) => {
    if (firstLayerIdSet.has(i.id)) {
      editor.children[idx].id = Id.getId();
    }
    firstLayerIdSet.add(i.id);
  });
};
const useStoreValue = (
  note: INote | undefined,
  editor: CustomEditor,
  onContentRendered?: (editor: CustomEditor) => void
) => {
  const { saveNoteAsBuffer, getNoteValue, saveNoteAsSearch } = NoteStore;
  const contentRef = useRef<Descendant[]>();
  const noteId = note?.id;
  const contentId = note?.contentId;
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter;

  const handler = useEventHandler("editor");
  const debounceSaveE = useMemoizedFn((data) => {
    if (data.noteId === noteId) {
      debouncedSave();
    }
  });
  handler.on("operationApplied", debounceSaveE);
  const { run: debouncedSave } = useDebounceFn(
    () => {
      if (!noteId) return;
      if (editor === EditorInstanceMap.get(noteId)?.values().next().value) {
        saveNoteAsBuffer(editor.children, note.contentId);
        saveNoteAsSearch(editor, noteId);
        const setting = getSetting();
        if (setting.notification.enabled && setting.notification.editor) {
          // toast.success(<Notification title={`📝 ${note.title}`} content="Note is saved." />)
        }
      }
    },
    { wait: 10000 }
  );
  useEffect(() => {
    if (!noteId || !contentId) {
      return;
    }
    emitter.addListener("editor", handler);
    const cleanUp = () => {
      saveNoteAsBuffer(editor.children, note.contentId);
      saveNoteAsSearch(editor, noteId);
    };
    window.addEventListener("beforeunload", cleanUp);
    const editorSet = EditorInstanceMap.get(noteId);
    if (editorSet && editorSet.size > 0) {
      const first = editorSet.values().next();
      editor.children = first.value.children;
      normalizeFirstLayer(editor);
      EDITOR_TO_CHANGED.set(editor, false);
      editor.onChange();
      editor.contentInitialized = true;
      setTimeout(() => onContentRendered?.(editor));
      editor.history = { redos: [], undos: [] };
      editor.initialized = true;
    } else if (contentId) {
      getNoteValue(contentId).then((v) => {
        contentRef.current = v;
        editor.children = v || initial;
        normalizeFirstLayer(editor);
        EDITOR_TO_CHANGED.set(editor, false);
        editor.onChange();
        editor.contentInitialized = true;
        setTimeout(() => onContentRendered?.(editor));
        editor.history = { redos: [], undos: [] };
        editor.initialized = true;
        // if (sharedType._length === 0) {
        //   if (contentRef.current) {
        //     sharedType.applyDelta(slateNodesToInsertDelta(contentRef.current))
        //   } else {
        //     sharedType.applyDelta(slateNodesToInsertDelta(initial))
        //   }
        // }
      });
    }
    return () => {
      emitter.removeListener("editor", handler);
      window.removeEventListener("beforeunload", cleanUp);
      saveNoteAsBuffer(editor.children, note?.contentId).then((c) => {
        if (note?.contentId !== c) {
          ObjectStore("note").updateOne(
            {
              id: noteId,
              contentId: c,
            },
            { silent: true }
          );
        }
      });
      saveNoteAsSearch(editor, noteId);
    };
  }, [contentId]);
  useEffect(() => {
    if (!noteId) return;
    if (editor) {
      if (!EditorInstanceMap.has(noteId)) {
        const set = new Set<CustomEditor>();
        set.add(editor);
        EditorInstanceMap.set(noteId, set);
      } else {
        EditorInstanceMap.get(noteId)?.add(editor);
      }
      return () => {
        EditorInstanceMap.get(noteId)?.delete(editor);
        if (EditorInstanceMap.get(noteId)?.size === 0) {
          EditorInstanceMap.delete(noteId);
          // GlobalProviderMap.delete(noteId)
          // provider.clearData()
        }
      };
    }
  }, [editor]);

  // provider.on(
  //   'synced',
  //   useMemoizedFn(() => {
  //     if (sharedType._length === 0 && contentRef.current) {
  //       sharedType.applyDelta(slateNodesToInsertDelta(contentRef.current))
  //     }
  //     // YjsEditor.connect(editor)
  //     // avoid undo on synced
  //   })
  // )
};

export default useStoreValue;
