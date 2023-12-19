import { RefObject, useEffect } from 'react'
import { CustomEditor } from '~/typings'
import useAutoInsertEndline from './useAutoInsertEndline'
import useEditorDrag from './drag/useEditorDrag'
import useEditorOverlay from '../components/overlay/useEditorOverlay'
import useEditorSelect from './useEditorSelect'
import useEditorInstance, { useAssignEditorInstance } from './useEditorInstance'
import { debounce } from 'lodash'
import { EditorStateAtom } from './useEditorState'
import { useSetAtom } from 'jotai'
import { ID_TO_VISIBLE_HEADING_MAP } from '../weakMaps'
import useTypeFilterBlocks from '@/core/components/editor/hooks/useTypeFilterBlocks'

const EditorPluginHooks = ({ editor, scrollElementRef }: { editor: CustomEditor; scrollElementRef: RefObject<HTMLElement> }) => {
  const instance = useEditorInstance()
  useAutoInsertEndline(scrollElementRef, editor)

  useAssignEditorInstance(editor, scrollElementRef)

  const { dragManager, renderIndicator } = useEditorDrag(editor, scrollElementRef.current)

  const { renderOverlay, overlayManager } = useEditorOverlay(editor, scrollElementRef.current)
  useEditorSelect(editor, scrollElementRef.current)
  editor.overlayManager = overlayManager
  editor.dragManager = dragManager
  instance.getOverlayManager = () => overlayManager
  instance.dragManager = dragManager
  const setEditorState = useSetAtom(EditorStateAtom)
  useTypeFilterBlocks()
  useEffect(() => {
    const scrollElement = scrollElementRef.current
    const debounceCheck = debounce(() => {
      if (scrollElement) {
        const allVisibleHeadings = Array.from(ID_TO_VISIBLE_HEADING_MAP.get(editor)?.entries() || [])
        if (allVisibleHeadings.length) {
          const withBoundingHeadings = allVisibleHeadings.map(i => [
            i[0],
            {
              element: i[1],
              offsetTop: i[1].parentElement!.offsetTop
            }
          ]) as [number, { element: HTMLElement; offsetTop: number }][]
          withBoundingHeadings.sort((b, a) => b[1].offsetTop - a[1].offsetTop)
          const realScrollTop = Math.max(0, scrollElement.scrollTop - (editor.titleEle?.getBoundingClientRect().height || 0))
          if (realScrollTop < withBoundingHeadings[0][1].offsetTop) {
            setEditorState(s => ({
              ...s,
              currentActiveHeadingId: withBoundingHeadings[0][0]
            }))
          } else {
            const currIdx = withBoundingHeadings.findLastIndex(i => i[1].offsetTop < realScrollTop)
            setEditorState(s => ({
              ...s,
              currentActiveHeadingId: withBoundingHeadings[currIdx][0]
            }))
          }
        }
      }
    }, 300)
    const scrollListener = () => debounceCheck()
    if (scrollElement) {
      scrollElement.addEventListener('scroll', scrollListener)
    }
    return () => {
      scrollElement?.removeEventListener('scroll', scrollListener)
    }
  }, [])
  return (
    <>
      {renderIndicator}
      {renderOverlay()}
    </>
  )
}

export default EditorPluginHooks
