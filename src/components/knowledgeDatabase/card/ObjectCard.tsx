import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaDatabaseCardProps } from './types'

const MetaObjectCard: FC<MetaDatabaseCardProps> = ({ metaObject, renderTitleAndDescription }) => {
  const navigate = useNavigate()
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => navigate(`/editor/${metaObject.objectId}`)
  })
}

export default MetaObjectCard
