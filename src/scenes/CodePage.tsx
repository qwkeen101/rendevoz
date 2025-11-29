import { MetaStore } from '@/api/stores'
import Code from '@/core/components/code'
import { Icon, TabTitle } from '@/components'

export default ({ id }: { id: number }) => {
  const codeMeta = MetaStore.useObjectToMetaValue(id)
  return (
    <>
      <TabTitle icon={<Icon name={Global.utils.getIcon('code')} />} title={codeMeta?.name} />
      <Code id={id} />
    </>
  )
}
