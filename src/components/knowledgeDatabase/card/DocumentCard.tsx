import { FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPdfDocument } from '~/typings/data'
import useMetaStore, { useMetaTargetObject } from '@/stores/meta.store'
import { MetaDatabaseCardProps } from './types'

const MetaDocumentCard: FC<MetaDatabaseCardProps> = ({ metaObject, renderTitleAndDescription }) => {
  const result = useMetaTargetObject(metaObject.id)
  const document = result?.targetObject as IPdfDocument | undefined
  const { updateMetaObject } = useMetaStore()
  useEffect(() => {
    if (document) {
      if (document.metadata?.coverUrl !== metaObject.coverImgSrc) {
        updateMetaObject(
          {
            id: metaObject.id,
            coverImgSrc: document.metadata?.coverUrl
          },
          true
        )
      }
    }
  }, [document])
  const navigate = useNavigate()
  if (!document) return null
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () => navigate(`/pdf/${document.id}`)
  })
}

export default MetaDocumentCard
