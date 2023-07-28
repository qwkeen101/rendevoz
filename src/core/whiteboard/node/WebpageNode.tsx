import { Content } from '@/components/base'
import { IWhiteboardNode } from '~/typings/data'
import Webpage from '@/core/webpage/Webpage'

const WebpageNode = ({ node, onTitleChange }: { node: IWhiteboardNode & { type: 'webpage' }; onTitleChange: (t: string) => void }) => {

  return (
    <Content flex column fullHeight fullWidth auto>
      <Webpage disableTabTitle={true} initialWebpageId={node.webpageId} onTitleChange={onTitleChange}/>
    </Content>
  )
}

export default WebpageNode
