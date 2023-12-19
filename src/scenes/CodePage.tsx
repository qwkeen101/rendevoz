import { MetaStore } from '@/api/stores'
import Code from '@/core/components/code'
import { TabTitle } from '@/core/rendevoz/components'
import { Icon } from '@/components'
import { Rendevoz } from '@/core/rendevoz'

export default ({ id }: { id: number }) => {
  const codeMeta = MetaStore.useObjectToMetaValue(id)
  return (
    <>
      <TabTitle icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('code')} />} title={codeMeta?.name || 'Unnamed code'} />
      <Code id={id} />
    </>
  )
}
