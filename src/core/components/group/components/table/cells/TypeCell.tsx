import { ClassName } from 'rendevoz'
import { CSSProperties } from 'react'

export default ({ value, style }: { value: string; style?: CSSProperties }) => {
  return (
    <div
      style={{
        borderRadius: 3,
        fontSize: 14,
        width: 'fit-content',
        wordBreak: 'break-word',
        padding: '0px 6px',
        ...style
      }}
      className={ClassName.objectTag}
    >
      {Global.utils.getTypeName(value)}
    </div>
  )
}
