import { FC, memo } from 'react'
import { MetaDatabaseCardProps } from './types'
import Actions from '@/Actions'

const MetaKnowledgeCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => {
      if (metaObject.type === 'pdfElement') {
        metaObject.objectId && Actions.goToPdfLabel(metaObject.objectId)
      }
      if (metaObject.type === 'noteElement') {
        metaObject.objectId && Actions.goToNoteBlock(metaObject.objectId)
      }
    }
  })
})

export default MetaKnowledgeCard
