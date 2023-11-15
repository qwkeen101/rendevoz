import { Content, Footer } from '@/components'
import { useFlow, useWhiteboardNodes } from '@/core/whiteboard/hooks'
import { exportWhiteboardAsImage } from '@/core/whiteboard/utils/exportAsImage'
import { downloadImg } from '@/utils'

export default ({ onBack }: { onBack: VoidFunction }) => {
  const [nodes] = useWhiteboardNodes()
  const flow = useFlow()
  return (
    <Content flex column>
      <Footer
        submitText={'Export'}
        onBack={() => {}}
        onSubmit={() => {

        }}
      ></Footer>
    </Content>
  )
}
