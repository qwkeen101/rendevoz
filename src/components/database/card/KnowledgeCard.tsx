import { FC, memo } from 'react'
import { MetaDatabaseCardProps } from './types'
import Actions from '@/Actions'

const MetaKnowledgeCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => Actions.navigateToTargetObject(metaObject.id)
  })
})

export default MetaKnowledgeCard
