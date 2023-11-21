import { Button, WithBorder } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import { transformTextContentToNameAndDescription } from '../global/globalDragOverlay/utils'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'

export type LabelActionEvent =
  | {
      type: 'addDescription'
    }
  | {
      type: 'addAttachment'
    }
  | {
      type: 'delete'
    }
  | {
      type: 'changeName'
    }
  | {
      type: 'editOriginal'
    }
type Props = {
  on: (action: LabelActionEvent) => void
  objectId: number
  type: MetaObject['type']
}

const LabelActionMenu = ({ on, objectId, type }: Props) => {
  const { t } = useTranslation()
  const meta = MetaStore.getMetaObjectByObjectId(objectId)
  const label = ObjectStore(type).useValue(objectId)
  const checkObjectIsMeta = async () => {
    await GlobalInstance.metaOps?.addDraggableAsMeta({
      type,
      labelId: objectId
    })
  }
  return (
    <WithBorder padding={6} width={160}>
      {meta && (
        <Button.IconButton
          icon="park-info"
          text={t('general.show object info')}
          onClick={() => {
            Rendevoz.Actions.Open.openSidebarObjectDetails(meta.id)
          }}
        />
      )}
      {!meta && (
        <Button.IconButton
          icon={'park-share-one'}
          text={t('general.add as object')}
          onClick={() => {
            GlobalInstance.metaOps?.addDraggableAsMeta({
              type,
              labelId: objectId
            })
          }}
        />
      )}
      <Button.IconButton
        icon="park-edit-one"
        text={t('general.edit description')}
        onClick={() => on({ type: 'addDescription' })}
      ></Button.IconButton>
      {label && 'selectedText' in label && (
        <Button.IconButton
          icon="park-text"
          text={t('general.edit original')}
          onClick={() => on({ type: 'editOriginal' })}
        ></Button.IconButton>
      )}
      <Button.IconButton
        icon={'park-corner-up-right'}
        text={t('general.Move to')}
        onClick={async () => {
          let m = meta
          if (!m) {
            m = await GlobalInstance.metaOps?.addDraggableAsMeta({
              type,
              labelId: objectId
            })
          }
          if(m){
            GlobalInstance.metaOps?.quickAdd(m.id)
          }
        }}
      />
      <Button.IconButton
        icon="park-link"
        text={t('general.add attachment')}
        onClick={() => {
          on({ type: 'addAttachment' })
          checkObjectIsMeta()
        }}
      ></Button.IconButton>
      <Button.IconButton dangerous icon="park-delete" text={t('general.delete')} onClick={() => on({ type: 'delete' })}></Button.IconButton>
    </WithBorder>
  )
}

export default LabelActionMenu
