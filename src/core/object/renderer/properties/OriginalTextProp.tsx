import { ObjectStore } from '@/api/stores'
import { Content } from '@/components'
import { CSSProperties } from 'react'

export default ({ objectId, type, className, style }: { objectId: number; type: string; style?: CSSProperties; className?: string }) => {
  const o = ObjectStore(type).useValue(objectId)
  return (
    <Content
      flex
      className={className}
      role={'prop-container'}
      gap={'6px 8px'}
      style={{
        width: '100%',
        ...style
      }}
    >
      {o?.selectedText}
    </Content>
  )
}
