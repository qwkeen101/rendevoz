import Actions from '@/core/Actions'
import { FC } from 'react'
import { MetaDatabaseCardProps } from './types'

const MetaDocumentCard: FC<MetaDatabaseCardProps> = ({ metaObject, renderTitleAndDescription }) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => metaObject.objectId && Actions.openPdf(metaObject.objectId)
  })
}

export default MetaDocumentCard
