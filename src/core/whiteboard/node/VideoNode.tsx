import { IWhiteboardNode } from '~/typings/data'

const VideoNode = ({ node }: { node: IWhiteboardNode & { type: 'video' } }) => {
  return <video controls style={{ flex: 1, width: '100%', height: '100%' }} src={node.videoUrl} />
}

export default VideoNode
