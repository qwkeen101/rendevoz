import { Menu, WithBorder } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { ILabel, MetaObject } from '~/typings'
import { useMemoizedFn } from '@/hooks'
import { useEffect, memo } from 'react'
import isHotkey from 'is-hotkey'
import { DateFormat } from '@/utils'
import { Icons } from '@/consts'
import trans from '@/consts/trans'

export type LabelActionEvent =
  | {
      type: 'addNote'
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
  | {
      type: 'textToImage'
    }
  | {
      type: 'move'
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
  const actions = useMemoizedFn(async (t: 'delete' | 'copy' | 'move-to' | 'view-details' | 'add-tags') => {
    onClose()
    switch (t) {
      case 'view-details': {
        if (meta) {
          Global.metaOps.openDetails?.(meta.id)
        }
        return
      }
      case 'copy': {
        let m = meta
        if (!m) {
          m = (await Global.metaOps.addDraggableAsMeta({ type: 'label', labelId: objectId }))[0]
        }
        if (m) {
          Global.metaOps.copyLink(m.id)
        }
        return
      }
      case 'delete': {
        on({ type: 'delete' })
        return
      }
      case 'add-tags': {
        const m =
          meta ||
          (
            await Global.metaOps.addDraggableAsMeta({
              type: 'label',
              labelId: objectId
            })
          )[0]
        if (m) {
          Global.metaOps.quickAdd?.(m.id, 'tags')
        }
        onClose?.()
        break
      }
      case 'move-to': {
        let m = meta
        if (!m) {
          m = (
            await Global.metaOps.addDraggableAsMeta({
              type: 'label',
              labelId: objectId
            })
          )[0]
        }
        if (m) {
          Global.metaOps.quickAdd?.(m.id)
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
  const imageUrl = label && 'imageUrl' in label ? label.imageUrl : ''
  return (
    <WithBorder onClick={e => e.preventDefault()} padding={'0.4rem 0'} width={210}>
      <Menu.NavigationMenu
        layout={[
          {
            type: 'item',
            text: t('general.Add note'),
            icon: Icons.Edit,
            onSelect: () => {
              on?.({ type: 'addNote' })
              onClose()
            },
            key: 'add-note'
          },
          imageUrl
            ? {
                type: 'item',
                text: t('general.View image'),
                icon: 'park-pic-one',
                onSelect: () => {
                  Global.commonOps?.previewImage?.(imageUrl)
                  onClose()
                },
                key: 'view-image'
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
          {
            key: 'move-to',
            type: 'item',
            text: t(trans.Meta.MoveTo),
            icon: Icons.MoveTo,
            onSelect: async () => {
              on({ type: 'move' })
              onClose()
            }
          },
          {
            type: 'separator',
            key: 's-1'
          },
          meta
            ? {
                type: 'item',
                text: t(trans.Meta.ViewDetails),
                icon: Icons.Info,
                suffix: 'V',
                key: 'view-details',
                onSelect: () => {
                  actions('view-details')
                }
              }
            : undefined,
          meta
            ? {
                type: 'item',
                text: t(trans.AddTag),
                icon: Icons.Tag,
                key: 'add-tag',
                onSelect: () => {
                  onClose()
                  Global.metaOps.quickAdd?.(meta.id, 'tags')
                }
              }
            : undefined,
          meta
            ? {
                key: 'copy',
                text: t(trans.CopyLink),
                icon: Icons.Link,
                type: 'item',
                suffix: 'Cmd+C',
                onSelect: async () => {
                  actions('copy')
                }
              }
            : undefined,
          {
            type: 'item',
            text: t(trans.Delete),
            icon: Icons.Delete,
            onSelect: () => {
              actions('delete')
            },
            suffix: 'Cmd+D',
            key: 'delete'
          }
        ].filter(i => i)}
      />
      {label && label.updatedAt && (
        <div className={'border-top font-size-12 transparent-font'} style={{ padding: '0.4rem 0.8rem 0', marginTop: '0.4rem' }}>
          {t('general.Last updated at')}
          <div>{DateFormat.format(label.updatedAt, `${DateFormat.Formats.yearMonthDays} ${DateFormat.Formats.minute}`)}</div>
        </div>
      )}
    </WithBorder>
  )
}

export default memo(LabelActionMenu)
