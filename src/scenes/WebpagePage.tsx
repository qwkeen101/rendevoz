import { MetaStore } from '@/api/stores'
import { TabTitle } from '@/components'
import UncontrolledWebpage from '@/core/components/webpage/UncontrolledWebpage'
import { IWebpageInstance } from '~/typings'

export default ({ id, onInstanceInitialized }: { id: number; onInstanceInitialized?: (i: IWebpageInstance) => void }) => {
  const m = MetaStore.useObjectToMetaValue(id)
  const icon = m?.coverImgSrc ? <img src={m.coverImgSrc} className={'w-6 h-6 object-cover rounded'} /> : Global.utils.getIcon('webpage')
  return (
    <>
      <TabTitle icon={icon} title={m?.name} />
      <UncontrolledWebpage
        editorOptions={{
          layout: {
            virtualizer: false
          }
        }}
        id={id}
        onInstanceInitialized={onInstanceInitialized}
      />
    </>
  )
}
