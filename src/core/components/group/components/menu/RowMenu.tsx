import { MetaGroupChild } from '~/typings'
import { AnimatePopover, Button, Content, WithBorder } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaStore } from '@/api/stores'
import { ReactElement } from 'react'
import NewRowMenu from '@/core/components/group/components/menu/NewRowMenu'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'
import useGroupState from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'

export default ({ details, onClose }: { details: MetaGroupChild; onClose: VoidFunction }) => {
  const instance = useGroupInstance()
  const selected = instance.selectOps?.getSelectedItems()
  const hasSelected = selected?.length && selected.length > 1
  const groupState = useGroupState()[0]
  const { t } = useTranslation()
  const meta = MetaStore.useValue(details.id)
  const canPreview = details.type === 'metaObject' && meta && GlobalInstance.metaOps?.canPreview(meta)
  const actions: (
    | { text: string; icon: string; onClick: VoidFunction; subMenu?: ReactElement; type: 'button'; dangerous?: boolean }
    | { type: 'separator' }
    | undefined
  )[] = [
    selected?.length && selected.length > 1
      ? {
          text: t('general.Copy links to all'),
          icon: 'park-link',
          type: 'button',
          onClick: () => {
            onClose()
            GlobalInstance.metaOps?.copyLink(selected?.map(i => i[0].id))
          }
        }
      : undefined,
    {
      text: t('general.delete'),
      icon: 'park-delete',
      type: 'button',
      dangerous: true,
      onClick: () => {
        onClose()
        const selected = instance.selectOps?.getSelectedItems()
        if (selected?.length) {
          instance.valueOps?.removeByPaths(selected.map(i => i[1]))
          return
        }
        const path = instance.pathOps?.getPathById(details.rowId)
        if (path) {
          console.log(path)
          instance.valueOps?.removeByPath(path)
        }
      }
    },
    //@ts-ignore
    ...(details.type === 'metaObject'
      ? [
          ...(hasSelected
            ? []
            : [
                {
                  type: 'separator'
                },
                {
                  text: t('general.View details'),
                  icon: 'park-info',
                  type: 'button',
                  onClick: () => {
                    onClose()
                    GlobalInstance.metaOps?.openDetails(details.id)
                  }
                },
                {
                  text: t('general.edit'),
                  icon: 'park-edit',
                  type: 'button',
                  onClick: () => {
                    onClose()
                    Rendevoz.Actions.Open.Meta.openEditMetaDialog(details.id)
                  }
                },
                {
                  text: t('general.Move to'),
                  icon: 'park-corner-up-right',
                  type: 'button',
                  onClick: () => {
                    onClose()
                    GlobalInstance.metaOps?.quickAdd(details.id)
                  }
                },
                {
                  text: t('general.Copy link'),
                  icon: 'park-link',
                  type: 'button',
                  onClick: () => {
                    onClose()
                    GlobalInstance.metaOps?.copyLink(details.id)
                  }
                },
                {
                  text: t('general.Open in new tab'),
                  icon: 'park-efferent-three',
                  type: 'button',
                  onClick: () => {
                    onClose()
                    Rendevoz.Actions.Open.Meta.openMetaObject(details.id)
                  }
                },
                ...(canPreview
                  ? [
                      {
                        text: t('general.Open in side peek'),
                        icon: 'park-right-bar',
                        type: 'button',
                        onClick: () => {
                          instance.sidebarOps?.open({
                            type: 'preview',
                            metaId: details.id
                          })
                          onClose()
                        }
                      }
                    ]
                  : [])
              ]),
          {
            text: t('general.delete object'),
            icon: 'park-delete',
            type: 'button',
            dangerous: true,
            onClick: () => {
              onClose()
              const selected = instance.selectOps?.getSelectedItems()
              if (selected?.length) {
                instance.valueOps?.removeByPaths(selected.map(i => i[1]))
                selected.forEach(i => {
                  if (i[0].type === 'metaObject') {
                    MetaStore.deleteMetaObject(i[0].id, true)
                  }
                })
                return
              }
              if (details.type === 'metaObject') {
                MetaStore.deleteMetaObject(details.id, true)
                const path = instance.pathOps?.getPathById(details.rowId)
                if (path) {
                  instance.valueOps?.removeByPath(path)
                }
              }
            }
          }
        ]
      : []),
    //@ts-ignore
    ...(groupState.data?.filter?.rules.length || hasSelected || groupState.data?.sort?.sorters.length || groupState.data?.search?.length
      ? []
      : [
          {
            type: 'separator'
          },
          {
            text: t('general.Insert object above'),
            icon: 'park-up',
            type: 'button',
            subMenu: <NewRowMenu onClose={() => onClose()} currentRowId={details.rowId} direction={'above'} />,
            onClick: () => {}
          },
          {
            text: t('general.Insert object below'),
            icon: 'park-down',
            type: 'button',
            onClick: () => {},
            subMenu: <NewRowMenu onClose={() => onClose()} currentRowId={details.rowId} direction={'below'} />
          }
        ])
  ].filter(i => i)
  return (
    <Content flex column style={{ minWidth: 180 }}>
      {actions.map(i =>
        i.type === 'separator' ? (
          <div
            style={{
              width: '100%',
              height: 1,
              margin: '4px 0px',
              background: Colors.Background.Border
            }}
          ></div>
        ) : i.subMenu ? (
          <AnimatePopover padding={10} key={i.text} content={<WithBorder padding={6}>{i.subMenu}</WithBorder>} positions={['right']}>
            <Button.IconButton dangerous={i.dangerous} text={i.text} onClick={i.onClick} icon={i.icon} />
          </AnimatePopover>
        ) : (
          <Button.IconButton dangerous={i.dangerous} key={i.text} text={i.text} onClick={i.onClick} icon={i.icon} />
        )
      )}
    </Content>
  )
}
