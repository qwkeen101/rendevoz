import { atom, useAtom } from 'jotai'
import { EditorProps } from '~/typings'

export const EditorStateAtom = atom<
  Partial<
    EditorProps & {
      currentActiveHeadingId: number
      readOnly?: boolean
      isDraggingDivider?: boolean
      // for replace children scroll bug
      editorVersion?: number
      selectedBlockIdSet?: Set<number>
    }
  >
>({})

const useEditorState = () => useAtom(EditorStateAtom)

export default useEditorState
