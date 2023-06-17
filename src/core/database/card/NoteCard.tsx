import { FC, memo } from 'react'
import { MetaDatabaseCardProps } from './types'
import { Rendevoz } from '@/core/rendevoz'

const MetaNoteCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => metaObject.objectId && Rendevoz.Actions.Open.Editor.openEditor(metaObject.objectId)
  })
})

export default MetaNoteCard
