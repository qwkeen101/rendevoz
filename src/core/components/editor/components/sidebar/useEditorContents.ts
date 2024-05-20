import Outliner, { HeadingTreeNode } from '@/core/components/editor/utils/outline/outliner'
import { atom, useSetAtom } from 'jotai'
import { debounce } from 'lodash'
import { useEffect } from 'react'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

export const EditorHeadingTreeAtom = atom<HeadingTreeNode | undefined>(undefined)
export const useEditorContents = () => {
  const setHeadingTree = useSetAtom(EditorHeadingTreeAtom)
  const instance = useEditorInstance()
  useEffect(() => {
    instance.triggerContentsChange = debounce(() => {
      const editor = instance.getSlateEditor?.()
      if (editor) {
        const headingTree = Outliner.headingListToTree(editor.children)
        setHeadingTree(headingTree)
      }
    }, 500)
  }, [])
}
