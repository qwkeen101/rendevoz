import { Button, Menu, WithBorder } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { ILabel, MetaObject } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance, useMemoizedFn } from '@/hooks'
import OcrService from '@/api/services/ocr.service'
import { useEffect, memo } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { getUser } from '@/api/services/login.service'
import { DateFormat } from '@/utils'

export type LabelActionEvent =
  | {
      type: 'delete'
    }
  | {
      type: 'changeName'
    }
  | {
      type: 'editOriginal'
    }
  | {
      type: 'textToImage'
    }
type Props = {
  on: (action: LabelActionEvent) => void
  objectId: number
  type: MetaObject['type']
  onClose: VoidFunction
}

const LabelActionMenu = ({ on, objectId, type, onClose }: Props) => {
  const { t } = useTranslation()
  const meta = MetaStore.getMetaObjectByObjectId(objectId)
  const label = ObjectStore(type).useValue(objectId) as ILabel | undefined
  const u = getUser()
  const actions = useMemoizedFn(async (t: 'delete' | 'copy' | 'move-to' | 'view-details') => {
    onClose()
    switch (t) {
      case 'view-details': {
        GlobalInstance.metaOps?.openDetails(meta.id)
        return
      }
      case 'copy': {
        let m = meta
        if (!m) {
          m = await GlobalInstance.metaOps?.addDraggableAsMeta({ type: t, labelId: objectId }, true)
        }
        if (m) {
          GlobalInstance.metaOps?.copyLink(m.id)
        }
        return
      }
      case 'delete': {
        on({ type: 'delete' })
        return
      }
      case 'move-to': {
        let m = meta
        if (!m || m.temp) {
          m = await GlobalInstance.metaOps?.addDraggableAsMeta({
            type,
            labelId: objectId
          })
        }
        if (m) {
          GlobalInstance.metaOps?.quickAdd(m.id)
        }
        return
      }
    }
  })
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey('v', e)) {
        actions('view-details')
      }
      if (isHotkey('mod+d', e)) {
        actions('delete')
      }
      if (isHotkey('m', e)) {
        actions('move-to')
      }
      if (isHotkey('mod+c', e)) {
        actions('copy')
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
  return (
    <WithBorder padding={'0.4rem 0'} width={180}>
      <Menu.NavigationMenu
        layout={[
          meta && !meta.temp
            ? {
                type: 'item',
                text: t('general.View details'),
                icon: 'park-info',
                suffix: 'V',
                key: 'view-details',
                onSelect: () => {
                  actions('view-details')
                }
              }
            : undefined,
          !meta || meta.temp
            ? {
                type: 'item',
                text: t('general.add as object'),
                icon: 'park-share-one',
                key: 'add-as-obj',
                onSelect: () => {
                  onClose()
                  GlobalInstance.metaOps?.addDraggableAsMeta({
                    type,
                    labelId: objectId
                  })
                }
              }
            : undefined,
          label && 'selectedText' in label
            ? {
                type: 'item',
                text: t('general.edit original'),
                icon: 'park-text',
                key: 'edit-original',
                onSelect: () => {
                  on({ type: 'editOriginal' })
                  onClose()
                }
              }
            : undefined,
          label && label.imageUrl && u && (u.premiumEndDate ?? 0) > Date.now()
            ? {
                type: 'item',
                icon: 'park-scanning-two',
                key: 'ocr',
                text: t('general.Image to text'),
                onSelect: async () => {
                  on({ type: 'textToImage' })
                  onClose()
                  const blob = await fetch(label!.imageUrl!).then(res => res.blob())
                  if (blob) {
                    const res = await OcrService.ocrImage(blob)
                    if (res) {
                      ObjectStore(type).updateOne({ id: objectId, selectedText: res.result.map(i => i.words).join(' ') })
                    }
                  }
                }
              }
            : undefined,
          {
            key: 'move-to',
            type: 'item',
            text: t('general.Move to'),
            icon: 'park-corner-up-right',
            suffix: 'M',
            onSelect: async () => {
              actions('move-to')
            }
          },
          {
            key: 'copy',
            text: t('general.Copy link'),
            icon: 'park-link',
            type: 'item',
            suffix: 'Cmd+C',
            onSelect: async () => {
              actions('copy')
            }
          },
          {
            type: 'item',
            text: t('general.delete'),
            icon: 'park-delete',
            onSelect: () => {
              actions('delete')
            },
            suffix: 'Cmd+D',
            key: 'delete'
          }
        ].filter(i => i)}
      />
      {label && label.updatedAt && (
        <div className={'border-top font-size-12 super-transparent-font'} style={{ padding: '0.4rem 0.8rem 0', marginTop: '0.4rem' }}>
          {t('general.Last updated at')}
          <div>{DateFormat.format(label.updatedAt, DateFormat.Formats.withMinute)}</div>
        </div>
      )}
    </WithBorder>
  )
}

export default memo(LabelActionMenu)
