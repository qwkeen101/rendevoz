import { MetaObject } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { IconNameRenderer } from '@/core'

export default ({ value }: { value: MetaObject['type'] }) => {
  return (
    <IconNameRenderer
      gap={8}
      name={Rendevoz.Utils.Meta.getTypeName(value)}
      icon={Rendevoz.Utils.Object.getMetaObjectIcon(value)}
    ></IconNameRenderer>
  )
}
