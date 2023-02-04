import { FC, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaDatabaseCardProps } from './types'
import { jumpToTargetLabel } from '@/stores/label.store'

const MetaKnowledgeCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  const navigate = useNavigate()
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => {
      if (metaObject.type === 'pdfElement') {
        metaObject.objectId && jumpToTargetLabel(metaObject.objectId, navigate)
      }
    }
  })
})

export default MetaKnowledgeCard
