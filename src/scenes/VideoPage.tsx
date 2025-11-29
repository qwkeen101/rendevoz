import { Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { MetaStore } from '@/api/stores'
import Video from '@/core/components/media/wrappers/Video'
import { IMediaInstance } from '~/typings'

const VideoPage = ({ videoId, onInstanceInitialized }: { videoId: number; onInstanceInitialized: (i: IMediaInstance) => void }) => {
  const video = MetaStore.useObjectToMetaValue(videoId)
  const icon = video?.coverImgSrc ? (
    <img src={video.coverImgSrc} className={'w-6 h-6 object-cover rounded'} />
  ) : (
    Global.utils.getIcon('video')
  )
  return (
    <Content fullWidth fullHeight>
      <TabTitle title={video?.name} icon={icon} />
      <Video onInstanceInitialized={onInstanceInitialized} videoId={videoId} />
    </Content>
  )
}

export default VideoPage
