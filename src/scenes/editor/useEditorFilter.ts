import Outliner, { HeadingTreeNode } from '@/core/editor/utils/outline/outliner'
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
export const EditorHighlightsAtom = atom<EditorHighlight[]>([])
export const EditorObjectsAtom = atom<NodeEntry[]>([])
export const EditorHeadingTreeAtom = atom<HeadingTreeNode | undefined>(undefined)
export const useEditorFilter = (editor: CustomEditor) => {
  const setHighlights = useSetAtom(EditorHighlightsAtom)
  const setObjects = useSetAtom(EditorObjectsAtom)
  const setHeadingTree = useSetAtom(EditorHeadingTreeAtom)
  const { run: debouncedUpdateIndex } = useDebounceFn(
    () => {
      const eles = Node.elements(editor)
      const highlights: NodeEntry[] = []
      const objects: NodeEntry[] = []
      const headingTree = Outliner.headingListToTree(editor.children)
      for (const ele of eles) {
        const [node, path] = ele
        if (node.type === 'metaObject' || node.type === 'inline-metaObject') {
          objects.push(ele)
        }
        if ('children' in node) {
          node.children.forEach((o, idx) => {
            if (Text.isText(o)) {
              if ('highlight' in o && o.highlight) {
                highlights.push([o, path.concat(idx)])
              }
            }
          })
        }
      }
      const highlightArr = _.toArray(_.groupBy(highlights, i => i[0].highlight))
      const highlightResult = highlightArr.map(i => {
        const str = i.map(i => Node.string(i[0])).join('')
        return {
          str,
          highlightId: i[0][0].highlight
        }
      })
      setHighlights(highlightResult)
      setObjects(objects)
      setHeadingTree(headingTree)
    },
    { wait: 1000 }
  )
  useEffect(() => {
    debouncedUpdateIndex()
  }, [editor.children])
}
