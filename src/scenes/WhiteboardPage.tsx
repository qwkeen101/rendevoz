import TabTitle from '@/components/layout/TabTitle'
import { Whiteboard } from '@/core'
import { memo, useState } from 'react'

const WhiteboardPage = ({ whiteboardId }: { whiteboardId: number }) => {
  const [title, setTitle] = useState('Unnamed Whiteboard')
  return (
    <>
      <TabTitle title={title} />
      <Whiteboard whiteboardId={whiteboardId} onTabTitleChange={s => s && setTitle(s)} />
    </>
  )
}

export default memo(WhiteboardPage)
