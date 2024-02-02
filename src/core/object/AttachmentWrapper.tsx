import { MetaStore } from '@/api/stores'
import AttachmentList, { AttachmentListProps } from './AttachmentList'
import { memo } from 'react'

const AttachmentWrapper = ({
  metaId,
  visible = false,
  maxVisibleAttachments = 3,
  ...rest
}: {
  metaId?: number
  visible?: boolean
} & Omit<AttachmentListProps, 'parentMetaId'>) => {
  const metaObject = MetaStore.useValue(metaId)
  console.log(metaObject)
  if (metaObject && visible && metaId) {
    return (
      <AttachmentList
        {...rest}
        parentMetaId={metaId}
        maxVisibleAttachments={maxVisibleAttachments}
        attachments={metaObject.attachments}
        onAttachmentsChange={atts => {
          console.log(atts)
          MetaStore.updateMetaObject({
            id: metaObject.id,
            attachments: atts
          })
        }}
      />
    )
  }
  return null
}

export default memo(AttachmentWrapper)
