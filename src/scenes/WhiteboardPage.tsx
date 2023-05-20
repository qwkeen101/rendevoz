import TabTitle from '@/components/layout/TabTitle'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import { Whiteboard } from '@/core'
import { memo, useState } from 'react'

const WhiteboardPage = ({ whiteboardId }: { whiteboardId: number }) => {
  const [title, setTitle] = useState('Unnamed Whiteboard')
  return (
    <>
      <TabTitle title={title} icon={getIcon('whiteboard')} />
      <Whiteboard whiteboardId={whiteboardId} onTabTitleChange={s => s && setTitle(s)} />
    </>
  )
}

export default memo(WhiteboardPage)
