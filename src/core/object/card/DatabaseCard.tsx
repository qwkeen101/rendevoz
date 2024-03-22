import { FC, useRef } from 'react'
import { GlobalInstance } from '@/hooks'
import { Button, Content } from '@/components'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'

export const ObjectActionPopover: FC<
  Partial<{
    onClose: VoidFunction
    onEdit: VoidFunction
    onPin: VoidFunction
    onGraph: VoidFunction
    onDelete: VoidFunction
    onJump: VoidFunction
    onGraphPin: VoidFunction
    onShowRelated: VoidFunction
    visibility: {
      jumpToVisible?: boolean
      graphPinVisible?: boolean
      showRelatedVisible?: boolean
      graphPinned?: boolean
      relatedNum?: number
    }
  }> & { metaObjectId: number }
> = ({ onClose, onEdit, onPin, onGraph, onDelete, metaObjectId, visibility, onJump, onGraphPin, onShowRelated }) => {
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const metaObject = MetaStore.useValue(metaObjectId)
  const containerRef = useRef<HTMLDivElement>(null)
  if (!metaObject) return null
  return (
    <Content flex column style={{ padding: 4, width: 180, fontSize: 14, fontWeight: 400 }} ref={containerRef} role="object-popover-panel">
      {visibility?.jumpToVisible && <Button.IconButton onClick={onJump} text="Focus" icon="park-share-two" />}
      {visibility?.graphPinVisible && (
        <Button.IconButton
          icon="park-pin"
          text={visibility.graphPinned ? t('graph.unpin') : t('graph.pin on graph')}
          style={{ color: visibility.graphPinned ? 'color' : undefined }}
          onClick={onGraphPin}
        />
      )}
      {visibility?.showRelatedVisible && (
        <Button.IconButton
          onClick={onShowRelated}
          text={t(`graph.show more related nodes`, {
            num: visibility.relatedNum
          })}
          icon="park-circle-four"
        />
      )}
      {GlobalInstance.metaOps?.canPreview(metaObject) && (
        <Button.IconButton
          text={t('general.Preview')}
          icon="park-preview-open"
          onClick={() => {
            onClose?.()
            GlobalInstance.metaOps?.preview(metaObjectId)
          }}
        />
      )}
      <Button.IconButton
        text={t('general.Open')}
        icon="park-share"
        onClick={() => {
          onClose?.()
          Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
        }}
      />
      <Button.IconButton
        text={t('general.show object info')}
        icon="park-info"
        onClick={() => {
          onClose?.()
          Rendevoz.Actions.Open.openSidebarObjectDetails(metaObjectId)
        }}
      />
      <Button.IconButton
        onClick={() => {
          GlobalInstance.metaOps?.quickAdd(metaObjectId)
          onClose?.()
        }}
        icon="park-corner-up-right"
        text={t('general.Move to')}
      />
      <Button.IconButton
        text={t('general.edit')}
        icon="park-edit"
        onClick={() => {
          onClose?.()
          onEdit?.()
          Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaObjectId)
        }}
      />
      <Button.IconButton
        onClick={() => {
          updateMetaObject({ id: metaObject.id, pinned: !metaObject.pinned })
          onPin?.()
          onClose?.()
        }}
        icon="park-like"
        text={metaObject.pinned ? t('general.unpin') : t('general.pin')}
      />
      <Button.IconButton
        text={t('general.generate link')}
        onClick={() => {
          GlobalInstance.metaOps?.copyLink(metaObjectId)
        }}
        icon="park-link-two"
      />
      <Button.IconButton
        text={t('general.delete')}
        dangerous
        onClick={() => {
          deleteMetaObject(metaObject.id)
          onDelete?.()
          onClose?.()
        }}
        icon="park-delete"
      />
    </Content>
  )
}