import Actions from '@/core/Actions'
import { FC } from 'react'
import { MetaDatabaseCardProps } from './types'

const MetaObjectCard: FC<MetaDatabaseCardProps> = ({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => metaObject.objectId && Actions.openEditor(metaObject.objectId)
  })
}

export default MetaObjectCard
