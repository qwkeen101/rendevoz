import { FC } from 'react'
import { MetaDatabaseCardProps } from './types'
import { Rendevoz } from '@/core/rendevoz'

const MetaObjectCard: FC<MetaDatabaseCardProps> = ({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => metaObject.objectId && Rendevoz.Actions.Open.Editor.openEditor(metaObject.objectId)
  })
}

export default MetaObjectCard
