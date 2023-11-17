import Outliner, { HeadingTreeNode } from '@/core/components/editor/utils/outline/outliner'
import { useDebounceFn } from '@/hooks'
import { atom, useSetAtom } from 'jotai'
import _ from 'lodash'
import { useEffect } from 'react'
import { Node, NodeEntry, Text } from 'slate'
import { CustomEditor } from '~/typings'

export type EditorHighlight = {
  highlightId: number
  str: string
}
export const EditorHighlightsAtom = atom<Map<number, EditorHighlight>>(new Map())
export const EditorObjectsAtom = atom<NodeEntry[]>([])
export const EditorHeadingTreeAtom = atom<HeadingTreeNode | undefined>(undefined)
export const useEditorFilter = (editor: CustomEditor) => {
  const setObjects = useSetAtom(EditorObjectsAtom)
  const setHeadingTree = useSetAtom(EditorHeadingTreeAtom)
  const { run: debouncedUpdateIndex } = useDebounceFn(
    () => {
      const eles = Node.elements(editor)
      const objects: NodeEntry[] = []
      const headingTree = Outliner.headingListToTree(editor.children)
      for (const ele of eles) {
        const [node, path] = ele
        if (node.type === 'metaObject' || node.type === 'inline-metaObject') {
          objects.push(ele)
        }
      }

      setObjects(objects)
      setHeadingTree(headingTree)
    },
    { wait: 1000 }
  )
  useEffect(() => {
    debouncedUpdateIndex()
  }, [editor.children])
}
