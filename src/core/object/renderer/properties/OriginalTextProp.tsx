import { ObjectStore } from '@/api/stores'
import { Content } from '@/components'
import { CSSProperties } from 'react'
import TextProp from '@/core/object/renderer/properties/TextProp'

export default ({ objectId, type, className, style }: { objectId: number; type: string; style?: CSSProperties; className?: string }) => {
  const o = ObjectStore(type).useValue(objectId)
  if (!o?.selectedText) return null
  return (
    <TextProp
      mode={'text'}
      value={o.selectedText}
      onChange={v => {
        ObjectStore(type).updateOne({ id: objectId, selectedText: v })
      }}
    />
  )
}
