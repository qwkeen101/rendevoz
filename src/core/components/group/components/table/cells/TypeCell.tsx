import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { Content } from '@/components'

export default ({ value }: { value: string }) => {
  return (
    <div
      style={{
        borderRadius: 2,
        fontSize: 14,
        width: 'fit-content',
        wordBreak: 'break-word',
        padding: '0px 6px'
      }}
      className={ClassName.objectTag}
    >
      {Rendevoz.Utils.Meta.getTypeName(value)}
    </div>
  )
}
