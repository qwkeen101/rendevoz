import { atom, useAtom } from 'jotai'
import { EditorProps } from '../Editor'

export const EditorStateAtom = atom<
  Partial<
    EditorProps & {
      currentActiveHeadingId: number
      outReadOnly?: boolean
      innerReadOnly?: boolean
    }
  >
>({})

const useEditorState = () => useAtom(EditorStateAtom)

export default useEditorState
