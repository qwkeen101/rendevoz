import { Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'
import Video from '@/core/components/media/wrappers/Video'
import { IMediaInstance } from '~/typings'

const VideoPage = ({ videoId, onInstanceInitialized }: { videoId: number; onInstanceInitialized: (i: IMediaInstance) => void }) => {
  const video = MetaStore.useObjectToMetaValue(videoId)
  return (
    <Content fullWidth fullHeight>
      <TabTitle title={video?.name || 'Unnamed Video'} icon={Rendevoz.Utils.Object.getMetaObjectIcon('video')} />
      <Video onInstanceInitialized={onInstanceInitialized} videoId={videoId} />
    </Content>
  )
}

export default VideoPage
