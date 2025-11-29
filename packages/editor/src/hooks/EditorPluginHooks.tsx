import { ReactElement, ReactPortal, RefObject, useEffect } from 'react'
import { CustomEditor, EditorProps } from '~/typings'
import useAutoInsertEndline from './useAutoInsertEndline'
import useEditorDrag from './drag/useEditorDrag'
import useEditorOverlay from '../components/overlay/useEditorOverlay'
import useEditorSelect from './useEditorSelect'
import useEditorInstance, { useAssignEditorInstance } from './useEditorInstance'
import { EditorStateAtom } from './useEditorState'
import { useSetAtom } from 'jotai'
import useTypeFilterBlocks from '../hooks/useTypeFilterBlocks'

const EditorPluginHooks = ({
  editor,
  plugins,
  scrollElementRef
}: {
  editor: CustomEditor
  scrollElementRef: RefObject<HTMLDivElement>
  plugins?: EditorProps['plugins']
}) => {
  const instance = useEditorInstance()
  if (plugins?.addUnderLastLine !== false) {
    useAutoInsertEndline(scrollElementRef, editor)
  }
  useAssignEditorInstance(editor, scrollElementRef)
  const renders: (ReactElement | ReactPortal)[] = []
  if (plugins?.dragBlock !== false) {
    const { renderIndicator } = useEditorDrag(editor, scrollElementRef.current)
    renders.push(renderIndicator)
  }

  const { renderOverlay, overlayManager } = useEditorOverlay(editor, scrollElementRef.current)
  renders.push(renderOverlay())
  if (plugins?.select !== false) {
    const { renderSelect } = useEditorSelect(editor, scrollElementRef)
    const portal = renderSelect()
    if (portal) {
      renders.push(portal)
    }
  }
  instance.getOverlayManager = () => overlayManager
  const setEditorState = useSetAtom(EditorStateAtom)
  useTypeFilterBlocks()
  instance.printToPDF = () => {
    let enV = true
    setEditorState(s => {
      enV = s.layout?.virtualizer ?? true
      return {
        ...s,
        layout: {
          ...s.layout,
          virtualizer: false
        }
      }
    })
    setTimeout(() => {
      const ele = scrollElementRef.current!
      const p = ele.parentElement!
      document.body.appendChild(ele)
      const currentTitle = document.title
      document.title = instance.getTitle?.() || ''
      const originalTheme = document.documentElement.getAttribute('theme')
      document.documentElement.setAttribute('theme', 'light')
      document.documentElement.classList.add('print-editor')
      const afterPrint = () => {
        document.title = currentTitle
        document.documentElement.classList.remove('print-editor')
        document.documentElement.setAttribute('theme', originalTheme || 'light')
        p.appendChild(ele)
        setEditorState(s => ({ ...s, layout: { ...s.layout, virtualizer: enV } }))
        window.removeEventListener('afterprint', afterPrint)
      }
      window.addEventListener('afterprint', afterPrint)
      window.print()
    })
  }
  return <>{...renders}</>
}

export default EditorPluginHooks
