import { MetaStore } from '@/api/stores'
import { Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import Audio from '@/core/components/media/wrappers/Audio'
import { MediaProps } from '@/core'

export default ({ audioId, onInstanceInitialized }: { audioId: number; onInstanceInitialized: MediaProps['onInstanceInitialized'] }) => {
  const audio = MetaStore.useObjectToMetaValue(audioId)
  return (
    <Content fullWidth fullHeight>
      <TabTitle
        title={audio?.name}
        icon={
          audio?.coverImgSrc ? <img className={'w-6 h-6 object-cover rounded'} src={audio.coverImgSrc} /> : Global.utils.getIcon('audio')
        }
      />
      <Audio audioId={audioId} onInstanceInitialized={onInstanceInitialized} />
    </Content>
  )
}
