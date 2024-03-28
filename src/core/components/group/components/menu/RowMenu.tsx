import { MetaGroupChild } from '~/typings'
import { Content, Menu } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaStore } from '@/api/stores'
import { memo, useEffect } from 'react'
import { GlobalInstance, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'
import { IMetaGroupAvailableContextMenuItems } from '@/core/components/group/MetaGroup'
import { IMenuLayoutItem } from '@/components/base/menu'
import { DateFormat } from '@/utils'
import isHotkey from 'is-hotkey'
import { isEqual } from 'lodash'
import commonActions from '@/core/components/group/actions/commonActions'
import { actionToShortcut } from '@/core/components/group/hooks/keyboard/useGroupCommonActions'

export default memo(
  ({ details, onClose }: { details: MetaGroupChild; onClose: VoidFunction }) => {
    const instance = useGroupInstance()
    const onlyOpenIn = instance.getGroupState?.().state?.onlyOpenIn
    const selected = instance.selectOps?.getSelectedItems()
    const hasSelected = selected?.length && selected.length > 1
    const { t } = useTranslation()
    const meta = MetaStore.getMetaObjectsMap().get(details.id)
    const canPreview = details.type === 'metaObject' && meta && GlobalInstance.metaOps?.canPreview(meta)
    const { customLayout, hidenItems, lastUpdated } = useSelectAtomValue(
      GroupStateAtom,
      s => ({
        customLayout: s.layout?.contextMenu,
        hidenItems: s.layout?.hideContextMenuItems,
        lastUpdated: s.data?.lastUpdated
      }),
      { compare: (prev, curr) => isEqual(prev, curr) }
    )
    const actionHandler = (type: Parameters<typeof commonActions>[1]) => {
      onClose()
      commonActions(instance, type)
    }

    const layoutItems: Record<IMetaGroupAvailableContextMenuItems, IMenuLayoutItem> = {
      recover: {
        key: 'recover',
        text: t('general.Recover'),
        icon: 'park-redo',
        type: 'item',
        onSelect: () => {
          onClose()
          instance.metaOps?.updateMeta({
            deleted: false
          })
          instance.selectOps?.clearAllSelect()
        }
      },
      open: {
        key: 'open',
        text: t('general.Open'),
        icon: 'park-arrow-right-up',
        type: 'item',
        onSelect: () => {
          onClose()
          const first = selected?.[0][0]
          if (first) {
            instance.openObject?.(first.id, first.rowId)
          }
        }
      },
      deleteCompleted: {
        text: t('general.Delete completed'),
        icon: 'park-delete',
        type: 'item',
        key: 'delete-complete',
        onSelect: () => {
          onClose()
          selected?.forEach(s => {
            MetaStore.deleteMetaObject(s[0].id, {
              force: true,
              silent: true
            })
          })
          instance.selectOps?.clearAllSelect()
        }
      },
      copyLinkToAll: {
        text: t('general.Copy links to all'),
        icon: 'park-link',
        type: 'item',
        key: 'copy-link-to-all',
        suffix: actionToShortcut['copy-link-to-all'].text,
        onSelect: () => {
          actionHandler('copy-link-to-all')
        }
      },
      deleteInGroup: {
        text: t('general.Delete from group'),
        icon: 'park-delete-two',
        type: 'item',
        key: 'delete-in-group',
        suffix: actionToShortcut['delete-in-group'].text,
        onSelect: () => {
          actionHandler('delete-in-group')
        }
      },
      separator: {
        type: 'separator'
      },
      viewDetails: {
        text: t('general.View details'),
        icon: 'park-info',
        type: 'item',
        key: 'view-details',
        suffix: 'V',
        onSelect: () => {
          actionHandler('view-details')
        }
      },
      edit: {
        text: t('general.edit'),
        icon: 'park-edit',
        type: 'item',
        key: 'edit',
        onSelect: () => {
          actionHandler('edit')
        }
      },
      moveTo: {
        text: t('general.Move to'),
        icon: 'park-corner-up-right',
        type: 'item',
        key: 'move-to',
        suffix: actionToShortcut['move-to'].text,
        onSelect: () => {
          actionHandler('move-to')
        }
      },
      copyLink: {
        text: t('general.Copy link'),
        icon: 'park-link',
        type: 'item',
        key: 'copy-link',
        suffix: actionToShortcut['copy-link'].text,
        onSelect: () => {
          actionHandler('copy-link')
        }
      },
      openInNewTab: {
        text: t('general.Open in new tab'),
        icon: 'park-efferent-three',
        type: 'item',
        suffix: actionToShortcut['open-in-new-tab'].text,
        key: 'open-in-new-tab',
        onSelect: () => {
          actionHandler('open-in-new-tab')
        }
      },
      openInSidePeek: {
        text: t('general.Open in side peek'),
        icon: 'park-right-bar',
        type: 'item',
        suffix: actionToShortcut['open-in-side-peek'].text,
        key: 'open-in-side-peek',
        onSelect: () => {
          actionHandler('open-in-side-peek')
        }
      },
      deleteObject: {
        text: t('general.delete object'),
        icon: 'park-delete',
        type: 'item',
        suffix: actionToShortcut['delete-obj'].text,
        key: 'delete-obj',
        onSelect: () => {
          actionHandler('delete-obj')
        }
      }
    }
    hidenItems?.forEach(i => {
      delete layoutItems[i]
    })
    const actions: ((typeof layoutItems)[keyof typeof layoutItems] | undefined)[] = [
      selected?.length && selected.length > 1 ? layoutItems['copyLinkToAll'] : undefined,
      layoutItems['deleteInGroup'],
      layoutItems['deleteObject'],
      ...(details.type === 'metaObject'
        ? [
            ...(hasSelected
              ? []
              : [
                  layoutItems['separator'],
                  layoutItems['moveTo'],
                  ...(onlyOpenIn
                    ? [layoutItems['open']]
                    : [layoutItems['openInNewTab'], ...(canPreview ? [layoutItems['openInSidePeek']] : [])]),
                  layoutItems['viewDetails'],
                  layoutItems['edit'],
                  layoutItems['copyLink']
                ])
          ]
        : []),
      lastUpdated && layoutItems['separator']
    ].filter(i => i)
    const options = customLayout ? customLayout(selected?.map(i => i[0].id) || []).map(i => layoutItems[i]) : actions

    return (
      <Content flex column style={{ minWidth: 240 }}>
        <Menu.NavigationMenu layout={options} />
        {lastUpdated ? (
          <div
            style={{
              padding: '0 0.8rem 0'
            }}
            className={'font-size-12 super-transparent-font'}
          >
            {t('general.Last updated at')}
            <div>{DateFormat.format(lastUpdated, DateFormat.Formats.withMinute)}</div>
          </div>
        ) : null}
      </Content>
    )
  },
  (prev, curr) => prev.details === curr.details
)
