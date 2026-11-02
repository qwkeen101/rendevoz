import { Editor } from 'slate'
import { IEditorInstance } from '~/typings'
import { IMenuLayoutItem } from '@/components/base/menu'
import { t } from 'i18next'
import { toast } from 'react-hot-toast'

export default (editor: Editor, instance: IEditorInstance): IMenuLayoutItem[] => {
  const selectedElements = instance.getSelectedElements?.()
  if (selectedElements && selectedElements.length === 1) {
    if (selectedElements[0].type === 'iframe' && selectedElements[0].url) {
      const url = selectedElements[0].url
      return [
        {
          type: 'separator'
        },
        {
          type: 'item',
          key: 'view-original',
          text: t('editor.View original'),
          icon: 'park-arrow-right-up',
          onSelect: () => {
            window.open(url)
            instance.overlayOps?.close()
          }
        },
        {
          type: 'item',
          key: 'copy-link-to-original',
          icon: 'park-link-one',
          text: t('editor.Copy link to original'),
          onSelect: () => {
            navigator.clipboard.writeText(url)
            toast.success(t('general.Copied'))
            instance.overlayOps?.close()
          }
        },
        {
          type: 'item',
          key: 'replace-url',
          icon: 'park-edit',
          text: t('editor.Replace URL'),
          onSelect: () => {
            instance.blockOps?.getBlockFuncs(selectedElements[0].id)?.openTypeUrlForm?.()
            instance.overlayOps?.close()
          }
        }
      ]
    }
  }
  return []
}
