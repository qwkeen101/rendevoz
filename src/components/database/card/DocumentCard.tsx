import { globalStore } from '@/stores'
import { documentsAtom } from '@/stores/document.store'
import { FC } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { MetaDatabaseCardProps } from './types'

const MetaDocumentCard: FC<MetaDatabaseCardProps> = ({ metaObject, renderTitleAndDescription }) => {
  const navigate = useNavigate()
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => {
      if (!metaObject.objectId || globalStore.get(documentsAtom).has(metaObject.objectId)) {
        toast.error('Target Pdf Not Exist!')
      } else {
        navigate(`/pdf/${metaObject.objectId}`)
      }
    }
  })
}

export default MetaDocumentCard
