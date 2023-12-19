import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { Content } from '@/components'

export default ({ value }: { value: string }) => {
  return (
    <div
      style={{
        borderRadius: 4,
        fontSize: 14,
        width: 'fit-content',
        wordBreak: 'break-word',
        padding: '1px 6px'
      }}
      className={ClassName.objectTag}
    >
      {Rendevoz.Utils.Meta.getTypeName(value)}
    </div>
  )
}
