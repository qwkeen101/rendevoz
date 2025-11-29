import { Menu } from '@/components'
import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useTranslation } from 'react-i18next'
import { CustomEditor, IEditorInstance } from '~/typings'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import { DateFormat } from '@/utils'
import { Icons } from '@/consts'
import TranslateService from '@/api/services/translate.service'
import { Editor, Node, Path, Transforms } from 'slate'
import Id from '../../../../utils/id'

const EditorSetting = ({ editor, onClose }: { editor: CustomEditor; onClose?: VoidFunction }) => {
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const editorState = useEditorState()[0]
  const { lastSavedAt } = editorState.state || {}
  const { settings } = editorState.layout || {}
  return (
    <>
      <div className={'py-1'}>
        <Menu.NavigationMenu
          layout={[
            ...(settings?.(onClose) || []),
            editorState?.header?.display?.translate !== false && {
              type: 'item',
              key: 'translate',
              text: t('editor.Translate document'),
              icon: Icons.Translate,
              onSelect: () => {
                onClose?.()
                translateWholePage(editor, instance)
              }
            },
            {
              type: 'item',
              key: 'pdf',
              text: t('general.Export as PDF'),
              icon: 'park-file-pdf',
              onSelect: () => {
                instance.printToPDF?.()
                onClose?.()
              }
            },
            {
              type: 'item',
              key: 'md',
              text: t('general.Export as Markdown'),
              icon: 'custom-markdown',
              onSelect: () => {
                onClose?.()
                const editor = instance.getSlateEditor?.()
                if (editor) {
                  const content = slateToMarkdown(editor.children)
                  if (content) {
                    const blob = new Blob([content])
                    const a = document.createElement('a')
                    const title = instance.getTitle?.()
                    a.download = `${title || 'Untitled'}.md`
                    a.href = URL.createObjectURL(blob)
                    a.click()
                  }
                }
              }
            },

            lastSavedAt && { type: 'separator' },
            lastSavedAt && {
              type: 'custom',
              key: 'save',
              children: (
                <div className={'font-size-12 transparent-font px-2.5 pt-1 pb-1.5 select-none'}>
                  <div>{t('editor.Last saved at')}</div>
                  <div>{DateFormat.format(lastSavedAt, DateFormat.Formats.withSecond)}</div>
                </div>
              )
            }
          ]}
        />
      </div>
    </>
  )
}

const translateWholePage = async (editor: CustomEditor, instance: IEditorInstance) => {
  const value = editor.children
  if (!value) return
  const title = instance.getTitle?.()
  if (title) {
    TranslateService.translateText(title).then(res => {
      instance.on({
        type: 'titleChange',
        value: res
      })
    })
  }
  const translatedContent = value
    .filter(i => 'translated' in i && i.translated)
    .map(i => {
      const path = instance.getElementPathById?.(i.id)
      if (path) {
        return Editor.pathRef(editor, path)
      }
    })
  translatedContent.forEach(ref => {
    const p = ref?.unref()
    if (p) {
      Transforms.removeNodes(editor, { at: p })
    }
  })
  instance.indexPath?.()
  const firstLayerContent = editor.children
    .filter(i => !i.translated)
    .map((i, idx) => ({
      id: i.id,
      index: idx,
      content: Node.string(i)
    }))
    .filter(i => {
      if (!i.content.length) return false
      return true
    })
  firstLayerContent.forEach(async i => {
    const path = instance.getElementPathById?.(i.id)
    if (path) {
      const pathRef = Editor.pathRef(editor, path)
      const text = await TranslateService.translateText(i.content)
      const unref = pathRef.unref()
      if (unref) {
        Transforms.insertNodes(
          editor,
          {
            type: 'paragraph',
            id: Id.getId(),
            translated: true,
            children: [{ text }]
          },
          {
            at: Path.next(unref)
          }
        )
      }
    }
  })
}

export default EditorSetting
