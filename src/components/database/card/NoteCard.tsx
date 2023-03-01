import { globalStore } from '@/stores'
import { notesAtom } from '@/stores/note.store'
import { FC, memo } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { MetaDatabaseCardProps } from './types'

const MetaNoteCard: FC<MetaDatabaseCardProps> = memo(({ metaObject, renderTitleAndDescription }) => {
  const navigate = useNavigate()

  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => {
      if (!metaObject.objectId || !globalStore.get(notesAtom).has(metaObject.objectId)) {
        toast.error('Target Note Not Exist!')
      } else {
        navigate(`/editor/${metaObject.objectId}`)
      }
    }
  })
})

export default MetaNoteCard
