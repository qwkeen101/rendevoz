import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { Content } from '@/components'

export default ({ value }: { value: string }) => {
  return (
    <Content style={{ height: 24 }} flex alignItems={'center'}>
      <div
        style={{
          borderRadius: 4,
          fontSize: 14,
          width: 'fit-content'
        }}
        className={ClassName.objectTag}
      >
        {Rendevoz.Utils.Meta.getTypeName(value)}
      </div>
    </Content>
  )
}
