import { MetaGroupChild } from '~/typings'
import { AnimatePopover, Button, Content, WithBorder } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaStore } from '@/api/stores'
import { memo, ReactElement } from 'react'
import NewRowMenu from '@/core/components/group/components/menu/NewRowMenu'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'
import { IMetaGroupAvailableContextMenuItems } from '@/core/components/group/MetaGroup'

export default memo(
  ({ details, onClose }: { details: MetaGroupChild; onClose: VoidFunction }) => {
    const instance = useGroupInstance()
    const selected = instance.selectOps?.getSelectedItems()
    const hasSelected = selected?.length && selected.length > 1
    const currentView = instance.getCurrentView?.()
    const { t } = useTranslation()
    const meta = MetaStore.getMetaObjectsMap().get(details.id)
    const canPreview = details.type === 'metaObject' && meta && GlobalInstance.metaOps?.canPreview(meta)
    const customLayout = useSelectAtomValue(GroupStateAtom, s => s.layout?.contextMenu)
    const hidenItems = useSelectAtomValue(GroupStateAtom, s => s.layout?.hideContextMenuItems)
    const layoutItems: Record<
      IMetaGroupAvailableContextMenuItems,
      | { text: string; icon: string; onClick: VoidFunction; subMenu?: ReactElement; type: 'button'; dangerous?: boolean }
      | { type: 'separator' }
    > = {
      recover: {
        text: t('general.Recover'),
        icon: 'park-redo',
        type: 'button',
        onClick: () => {
          onClose()

          instance.metaOps?.updateMeta({
            deleted: false
          })
          instance.selectOps?.clearAllSelect()
        }
      },
      deleteCompleted: {
        text: t('general.Delete completed'),
        icon: 'park-delete',
        type: 'button',
        dangerous: true,
        onClick: () => {
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
        type: 'button',
        onClick: () => {
          onClose()
          GlobalInstance.metaOps?.copyLink(selected?.map(i => i[0].id))
        }
      },
      deleteInGroup: {
        text: t('general.delete'),
        icon: 'park-delete',
        type: 'button',
        dangerous: true,
        onClick: () => {
          onClose()
          const selected = instance.selectOps?.getSelectedItems()
          if (selected?.length) {
            instance.valueOps?.deleteItems(selected.map(i => i[0].rowId))
            return
          }
          instance.valueOps?.deleteItems(details.rowId)
        }
      },
      separator: {
        type: 'separator'
      },
      viewDetails: {
        text: t('general.View details'),
        icon: 'park-info',
        type: 'button',
        onClick: () => {
          onClose()
          GlobalInstance.metaOps?.openDetails(details.id)
        }
      },
      edit: {
        text: t('general.edit'),
        icon: 'park-edit',
        type: 'button',
        onClick: () => {
          onClose()
          Rendevoz.Actions.Open.Meta.openEditMetaDialog(details.id)
        }
      },
      moveTo: {
        text: t('general.Move to'),
        icon: 'park-corner-up-right',
        type: 'button',
        onClick: () => {
          onClose()
          const allIds = new Set(selected?.map(i => i[0].id))
          GlobalInstance.metaOps?.quickAdd(Array.from(allIds.values()))
        }
      },
      copyLink: {
        text: t('general.Copy link'),
        icon: 'park-link',
        type: 'button',
        onClick: () => {
          onClose()
          GlobalInstance.metaOps?.copyLink(details.id)
        }
      },
      openInNewTab: {
        text: t('general.Open in new tab'),
        icon: 'park-efferent-three',
        type: 'button',
        onClick: () => {
          onClose()
          Rendevoz.Actions.Open.Meta.openMetaObject(details.id)
        }
      },
      openInSidePeek: {
        text: t('general.Open in side peek'),
        icon: 'park-right-bar',
        type: 'button',
        onClick: () => {
          instance.sidebarOps?.open({
            type: 'preview',
            metaId: details.id,
            rowId: details.rowId
          })
          onClose()
        }
      },
      deleteObject: {
        text: t('general.delete object'),
        icon: 'park-delete',
        type: 'button',
        dangerous: true,
        onClick: () => {
          onClose()
          const selected = instance.selectOps?.getSelectedItems()
          if (selected?.length) {
            instance.valueOps?.deleteItems(
              selected.map(i => i[0].rowId),
              { deleteMeta: true }
            )
            return
          }
          instance.valueOps?.deleteItems(details.rowId, { deleteMeta: true })
        }
      },
      addRowAbove: {
        text: t('general.Insert object above'),
        icon: 'park-up',
        type: 'button',
        subMenu: <NewRowMenu onClose={() => onClose()} currentRowId={details.rowId} direction={'above'} />,
        onClick: () => {}
      },
      addRowBelow: {
        text: t('general.Insert object below'),
        icon: 'park-down',
        type: 'button',
        onClick: () => {},
        subMenu: <NewRowMenu onClose={() => onClose()} currentRowId={details.rowId} direction={'below'} />
      }
    }
    hidenItems?.forEach(i => {
      delete layoutItems[i]
    })
    const actions: ((typeof layoutItems)[keyof typeof layoutItems] | undefined)[] = [
      selected?.length && selected.length > 1 ? layoutItems['copyLinkToAll'] : undefined,
      layoutItems['moveTo'],
      layoutItems['deleteInGroup'],
      ...(details.type === 'metaObject'
        ? [
            ...(hasSelected
              ? []
              : [
                  layoutItems['separator'],
                  layoutItems['viewDetails'],
                  layoutItems['edit'],
                  layoutItems['copyLink'],
                  layoutItems['openInNewTab'],
                  ...(canPreview ? [layoutItems['openInSidePeek']] : [])
                ]),
            layoutItems['deleteObject']
          ]
        : []),
      ...(currentView?.filter?.rules.length || hasSelected || currentView?.sort?.sorters.length || currentView?.search
        ? []
        : [
            layoutItems['addRowAbove'] && layoutItems['addRowBelow'] && layoutItems['separator'],
            layoutItems['addRowAbove'],
            layoutItems['addRowBelow']
          ])
    ].filter(i => i)
    return (
      <Content flex column style={{ minWidth: 180 }}>
        {(customLayout ? customLayout(selected?.map(i => i[0].id) || []).map(i => layoutItems[i]) : actions).map(
          i =>
            i &&
            (i?.type === 'separator' ? (
              <div
                style={{
                  width: '100%',
                  height: 1,
                  margin: '4px 0px',
                  background: Colors.Background.Border
                }}
              ></div>
            ) : i?.subMenu ? (
              <AnimatePopover padding={10} key={i.text} content={<WithBorder padding={6}>{i.subMenu}</WithBorder>} positions={['right']}>
                <Button.IconButton dangerous={i.dangerous} text={i.text} onClick={i.onClick} icon={i.icon} />
              </AnimatePopover>
            ) : (
              <Button.IconButton dangerous={i.dangerous} key={i.text} text={i.text} onClick={i.onClick} icon={i.icon} />
            ))
        )}
      </Content>
    )
  },
  (prev, curr) => prev.details === curr.details
)
