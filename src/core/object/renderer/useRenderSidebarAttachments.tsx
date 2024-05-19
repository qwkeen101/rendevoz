import { MetaStore } from '@/api/stores'
import { Fragment, memo, useState } from 'react'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import { GlobalInstance } from '@/hooks'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import PageConfigContext from '@/core/components/PageConfigContext'
import { groupBy } from 'lodash'
import { Rendevoz } from '@/core/rendevoz'
import MetaFilterer from '@/core/object/filter/MetaFilterer'
import classnames from 'classnames'
import ContextMenu from '@/components/contextMenu'
import { ObjectActionMenu } from '@/core'
import { useTranslation } from 'react-i18next'

export default (metaId: number) => {
  const meta = MetaStore.useValue(metaId)
  const [containerState, setContainerState] = useState<{
    selectedAtt?: number
  }>({})
  const { selectedAtt } = containerState
  const selectedMeta = MetaStore.useValue(selectedAtt)
  const { t } = useTranslation()
  const renderAttachments = () => {
    if (!meta) {
      return null
    }
    if (!meta.attachments?.filter(i => i.type !== 'attachmentText').length) {
      return (
        <Content flex fullHeight fullWidth centered className={'font-size-14 bold-font transparent-font'}>
          No attachment
        </Content>
      )
    }
    const grouped = groupBy(meta.attachments, a => a.type)
    return (
      <Content flex column gap={12} className={'font-size-14'} style={{ padding: '12px 8px' }}>
        {Object.entries(grouped).map(g => (
          <Content flex column key={g[0]}>
            <div style={{ paddingLeft: '8px' }} className={'font-size-12 transparent-font'}>
              {Rendevoz.Utils.Meta.getTypeName(g[0])}
            </div>
            {g[1].map(i => (
              <AttItem
                onClick={() => {
                  setContainerState({
                    selectedAtt: i.id
                  })
                }}
                onRemove={() => {
                  MetaStore.updateMetaObject({ id: meta.id, attachments: meta?.attachments?.filter(o => o.id !== i.id) })
                }}
                id={i.id}
                key={i.id}
              />
            ))}
          </Content>
        ))}
      </Content>
    )
  }
  const renderContainer = () => {
    if (selectedMeta) {
      return renderContent()
    }
    return renderAttachments()
  }
  const renderTitle = () => {
    if (selectedMeta) {
      return (
        <Content style={{ flexShrink: 0, padding: '6px', height: 38 }} className={'border-bottom'} flex gap={12} alignItems={'center'}>
          <Icon
            className={ClassName.flatButton(4, '4px')}
            onClick={() => {
              setContainerState(s => ({ selectedAtt: undefined }))
            }}
            size={16}
            name={'park-left'}
          />
          <div className={'font-size-15 normal-font ellipsis-font-1'} style={{ flexShrink: 1 }}>
            {selectedMeta.name || selectedMeta.placeholderName}
          </div>
        </Content>
      )
    }
    return (
      <Content
        style={{ flexShrink: 0, padding: 6, height: 38 }}
        className={'font-size-15 normal-font border-bottom'}
        flex
        alignItems={'center'}
        justifyContent={'flex-end'}
      >
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{t('general.Attachments')}</div>
        <Content flex alignItems={'center'} className={'font-size-15'} gap={8}>
          <Icon
            name={'park-plus'}
            className={ClassName.flatButton(4, '4px')}
            onClick={() => {
              GlobalInstance.metaOps?.createObject().then(o => {
                console.log(o)
                MetaStore.updateMetaObject({
                  id: meta.id,
                  attachments: [
                    ...(meta?.attachments || []),
                    {
                      id: o.id,
                      type: o.type,
                      createdAt: Date.now()
                    }
                  ]
                })
              })
            }}
          ></Icon>
          <AnimatePopover
            positions={['bottom', 'top']}
            padding={10}
            content={
              <WithBorder>
                <MetaFilterer
                  onChange={m => {
                    const o = MetaStore.getCachedMetaObject(m)
                    if (o) {
                      if (!meta || meta?.attachments?.some(i => i.id === o.id)) return
                      MetaStore.updateMetaObject({
                        id: meta.id,
                        attachments: [
                          ...(meta?.attachments || []),
                          {
                            id: o.id,
                            type: o.type,
                            createdAt: Date.now()
                          }
                        ]
                      })
                    }
                  }}
                />
              </WithBorder>
            }
          >
            <Icon name={'park-filter'} className={ClassName.flatButton(4, '4px')}></Icon>
          </AnimatePopover>
        </Content>
      </Content>
    )
  }
  const renderContent = () => {
    if (selectedMeta) {
      const page = GlobalInstance.layoutOps?.getRegisteredTabData(selectedMeta.type)
      if (page) {
        return (
          <div style={{ height: '100%', position: 'relative' }}>
            <DockTabPaneContext.Provider key={selectedMeta.id} value={{ currentTabId: '' }}>
              <PageConfigContext.Provider
                value={{
                  editorHeader: false,
                  pdfHeader: false
                }}
              >
                {page.content?.({ objectId: selectedMeta.objectId, metaId: selectedMeta.id })}
              </PageConfigContext.Provider>
            </DockTabPaneContext.Provider>
          </div>
        )
      }
    }
  }
  return {
    renderTitle,
    renderContainer
  }
}

const AttItem = memo(({ id, onClick, onRemove }: { id: number; onClick?: VoidFunction; onRemove?: VoidFunction }) => {
  const meta = MetaStore.useValue(id)
  if (!meta || meta.deleted) {
    return null
  }
  return (
    <ContextMenu
      content={setV => (
        <WithBorder>
          <ObjectActionMenu
            onRemoveFromAttachment={() => {
              onRemove?.()
            }}
            visibility={{
              removeFromAttachment: true
            }}
            onClose={() => setV(false)}
            metaObjectId={id}
          />
        </WithBorder>
      )}
    >
      <div className={classnames(ClassName.flatButton(), 'ellipsis-font-2')} onClick={onClick}>
        {meta.name || meta.placeholderName}
      </div>
    </ContextMenu>
  )
})
