import { Content } from '@/components/base'
import { IWhiteboardNode } from '~/typings/data'
import Webpage from '@/core/webpage/Webpage'

const WebpageNode = ({ node, onTitleChange }: { node: IWhiteboardNode & { type: 'webpage' }; onTitleChange: (t: string) => void }) => {
  return (
    <Content
      style={{
        width: 800,
        height: 600,
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100%',
        maxHeight: '100%'
      }}
    >
      <Webpage disableTabTitle={true} initialWebpageId={node.webpageId} onTitleChange={onTitleChange} />
    </Content>
  )
}

export default WebpageNode
