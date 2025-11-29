import { atom, useAtom, useSetAtom } from 'jotai'
import { EditorProps, ISidebarDefaultProps } from '~/typings'

export const EditorStateAtom = atom<
  Partial<
    EditorProps & {
      currentFocusBlockId?: number
      currentActiveHeadingId: number
      readOnly?: boolean
      isDraggingDivider?: boolean
      // for replace children scroll bug
      editorVersion?: number
      selectedBlockIdSet?: Set<number>
      isSummarizing?: boolean
      currentFocusChatMessageId?: number
      currentFocusExamQuestionId?: number
      aiSummaryTab?: 'summary' | 'outlines' | 'mindmap'
      sidebarWidth: number
      sidebarActive: ISidebarDefaultProps['defaultActiveSidebar']
      sidebarVisible: boolean
    }
  >
>({
  sidebarWidth: 380,
  sidebarActive: 'ai'
})

const useEditorState = () => useAtom(EditorStateAtom)

export const useSetEditorState = () => useSetAtom(EditorStateAtom)
export default useEditorState
