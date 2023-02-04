import { useMetaTargetObject } from '@/stores/meta.store'
import { FC, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { INote } from '~/typings/data'
import { MetaDatabaseCardProps } from './types'

const MetaNoteCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  const result = useMetaTargetObject(metaObject.id)
  const note = result?.targetObject as INote | undefined
  const navigate = useNavigate()
  if (!note) return null
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => navigate(`/editor/${note.id}`)
  })
})

export default MetaNoteCard
