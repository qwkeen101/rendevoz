import { EditorTypeToElementMap } from '@/core/components/editor/maps'
import { IMenuLayoutItem } from '@/components/base/menu'

export const transformableTargetType = [
  'paragraph',
  'heading-one',
  'heading-two',
  'heading-three',
  'heading-four',
  'block-quote',
  'order-list-item',
  'list-item',
  'to-do',
  'code'
]

export default (onSelect: (t?: keyof typeof transformableTargetType) => void): IMenuLayoutItem[] => {
  const items = transformableTargetType
    .map(type => {
      const details = EditorTypeToElementMap.get(type)
      if (!details) return null
      return {
        type: 'item',
        key: type,
        text: details.name,
        onSelect: () => onSelect(type),
        icon: details.registerInMenu?.icon
      }
    })
    .filter(i => i) as IMenuLayoutItem[]
  return [
    {
      type: 'title',
      name: 'Turn into'
    },
    ...items
  ]
}
