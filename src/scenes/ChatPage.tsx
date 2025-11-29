import { memo } from 'react'
import { MetaStore } from '@/api/stores'
import { Icon, TabTitle } from '@/components'
import { IChatInstance } from '~/typings'
import Chat from '@/core/ai/chat/Chat'

export default memo(({ id, onInstanceInitialized }: { id: number; onInstanceInitialized?: (i: IChatInstance) => void }) => {
  const chatMeta = MetaStore.useObjectToMetaValue(id)
  return (
    <div className={'w-full h-full flex flex-col'}>
      <TabTitle icon={<Icon name={Global.utils.getIcon('chat')} />} title={chatMeta?.name} />
      <Chat
        id={id}
        onInstanceInitialized={onInstanceInitialized}
        styles={{
          headerClassName: '!pl-3.5',
          containerClassName: 'container-4xl font-size-15'
        }}
        layout={{
          header: true
        }}
      />
    </div>
  )
})
