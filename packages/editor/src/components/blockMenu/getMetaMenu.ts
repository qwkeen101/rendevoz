import { IMenuLayoutItem } from '@/components/base/menu'
import { t } from 'i18next'
import { Editor, Transforms } from 'slate'
import { IEditorInstance, MetaObject } from '~/typings'
import Id from './utils/id'
import { MetaStore } from '@/api/stores'

export default (editor: Editor, instance: IEditorInstance): IMenuLayoutItem[] => {
  const selectedElements = instance.getSelectedElements?.()
  const embedableTypes: MetaObject['type'][] = ['group', 'video', 'audio', 'image']
  const updateCardStyle = (s: 'inline' | 'block' | 'embeded') => {
    const selectedCards = selectedElements?.filter(i => i.type === 'metaObject')
    instance.overlayOps?.close()
    instance.selectOps?.deselectAll()
    selectedCards?.forEach(c => {
      const path = instance.getElementPathById?.(c.id)
      if (path) {
        if (s === 'block' || s === 'embeded') {
          Transforms.setNodes(editor, { cardType: s }, { at: path })
        }
        if (s === 'inline') {
          Transforms.removeNodes(editor, {
            at: path
          })
          Transforms.insertNodes(
            editor,
            {
              id: Id.getId(),
              type: 'paragraph',
              children: [
                {
                  type: 'inline-metaObject',
                  id: Id.getId(),
                  children: [{ text: '' }],
                  originId: c.originId
                }
              ]
            },
            {
              at: path
            }
          )
        }
      }
    })
  }
  const first = selectedElements?.[0]
  const show = first && first.type === 'metaObject'
  if (!show) return []
  const firstMeta = MetaStore.getCachedMetaObject(first.originId)
  if (!firstMeta) return []
  return [
    {
      type: 'separator'
    },
    {
      type: 'item',
      text: t('general.Open in new tab'),
      icon: 'park-arrow-right-up',
      key: 'open-obj-in-new-tab',
      onSelect: () => {
        Global.layoutOps?.openObject(first.originId)
        instance.overlayOps?.close()
      }
    },
    {
      type: 'item',
      text: t('general.View details'),
      key: 'view-obj-details',
      icon: 'park-info',
      onSelect: () => {
        Global.metaOps?.openDetails(first.originId)
        instance.overlayOps?.close()
      }
    },
    {
      text: t('editor.Card style'),
      type: 'item',
      key: 'expand-meta',
      icon: 'park-multi-rectangle',
      subMenu: [
        {
          text: t('editor.Inline card'),
          type: 'item',
          key: 'inline-card',
          onSelect: () => updateCardStyle('inline')
        },
        {
          text: t('editor.Block card'),
          type: 'item',
          key: 'block-card',
          onSelect: () => updateCardStyle('block')
        },
        embedableTypes.includes(firstMeta.type)
          ? {
              text: t('editor.Embeded card'),
              type: 'item',
              key: 'embeded-card',
              onSelect: () => updateCardStyle('embeded')
            }
          : undefined
      ].filter(i => i)
    }
  ]
}
