import { Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import Whiteboard from '@/components/whiteboard/Whiteboard'
import { memo, useState } from 'react'

const WhiteboardPage = ({ whiteboardId }: { whiteboardId: number }) => {
  const [title, setTitle] = useState('Unnamed Whiteboard')
  return (
    <Content fullHeight fullWidth role="data-container">
      <TabTitle title={title} />
      <Whiteboard whiteboardId={whiteboardId} onTabTitleChange={s => s && setTitle(s)} />
    </Content>
  )
}

export default memo(WhiteboardPage)
