import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { CSSProperties } from 'react'

export default ({ value, style }: { value: string; style?: CSSProperties }) => {
  return (
    <div
      style={{
        borderRadius: 2,
        fontSize: 14,
        width: 'fit-content',
        wordBreak: 'break-word',
        padding: '0px 6px',
        ...style
      }}
      className={ClassName.objectTag}
    >
      {Rendevoz.Utils.Meta.getTypeName(value)}
    </div>
  )
}
