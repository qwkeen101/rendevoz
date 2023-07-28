import TabTitle from '@/components/layout/TabTitle'
import { Whiteboard } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { memo, useState } from 'react'
import { IWhiteboardInstance } from '~/typings'

const WhiteboardPage = ({
  whiteboardId,
  onInstanceInitialized
}: {
  whiteboardId: number
  onInstanceInitialized: (w: IWhiteboardInstance) => void
}) => {
  const [title, setTitle] = useState('Unnamed Whiteboard')
  return (
    <>
      <TabTitle title={title} icon={Rendevoz.Utils.Object.getMetaObjectIcon('whiteboard')} />
      <Whiteboard whiteboardId={whiteboardId} onInstanceInitialized={onInstanceInitialized} onTabTitleChange={s => s && setTitle(s)} />
    </>
  )
}

export default memo(WhiteboardPage)
