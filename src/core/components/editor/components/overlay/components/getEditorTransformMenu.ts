import { IMenuLayoutItem } from '@/components/base/menu'
import EditorElements from '@/core/components/editor/elements/EditorElements'

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
      const details = EditorElements[type]
      if (!details) return null
      return {
        type: 'item',
        key: type,
        text: details.name,
        onSelect: () => onSelect(type),
        icon: details.registerInMenu?.icon,
        strokeWidth: 4
      }
    })
    .filter(i => i) as IMenuLayoutItem[]
  return [
    ...items
  ]
}
