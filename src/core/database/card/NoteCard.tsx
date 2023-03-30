import Actions from '@/core/Actions'
import { FC, memo } from 'react'
import { MetaDatabaseCardProps } from './types'

const MetaNoteCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => metaObject.objectId && Actions.openEditor(metaObject.objectId)
  })
})

export default MetaNoteCard
