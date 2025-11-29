import { MetaStore } from '@/api/stores'
import { memo, useMemo, useRef, useState } from 'react'
import { Button, WithBorder } from '@/components'
import { groupBy } from 'lodash'
import ContextMenu from '@/components/contextMenu'
import { ObjectActionMenu, useDropObjectArea } from '@/core'
import { useTranslation } from 'react-i18next'
import usePasteMetaObject from '@/core/object/usePasteMetaObject'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import { Queue } from 'async-await-queue'
import queueTurnUnhidden from '@/api/stores/meta/queueTurnUnhidden'
import classnames from 'classnames'
import SidebarObjectViewer from '@/core/components/SidebarObjectViewer'

export default (metaId: number) => {
  const meta = MetaStore.useValue(metaId)
  const [selected, setSelected] = useState<number>()
  const selectedMeta = MetaStore.useValue(selected)
  const pasteContainerRef = useRef<HTMLDivElement>(null)
  const handleAddAtts = (ids: number[]) => {
    if (meta) {
      MetaStore.addMetaAsAttachment(ids, meta.id)
    }
  }
  const attMetas = useMemo(() => {
    return meta?.attachments
      ?.filter(i =>
        MetaStore.isVisibleMetaObject(i.id, {
          showHidden: true
        })
      )
      .map(i => MetaStore.getCachedMetaObject(i.id)!)
  }, [meta?.attachments])
  usePasteMetaObject(pasteContainerRef, m => {
    handleAddAtts(m.map(i => i.id))
  })
  useDropObjectArea(pasteContainerRef, {
    onDrop: e => {
      let m: number[] = []
      if (e.type === 'metaObjects') {
        m = e.ids
      }
      if (m.length) {
        handleAddAtts(m)
      }
    }
  })
  const { t } = useTranslation()
  const renderAttachments = () => {
    if (!meta) {
      return null
    }
    if (!attMetas?.length) {
      return (
        <div ref={pasteContainerRef} className={'flex flex-col p-6 transparent-font w-full flex-1 items-center justify-center'}>
          <div className={'mb-3'}>{t('general.Drop object to add attachment')}</div>
          <Button.IconButton
            className={'font-size-13'}
            onClick={() => {
              if (meta) {
                const queue = new Queue()
                const symbol = 1
                Global.metaOps.createObjects?.(undefined, async m => {
                  await queue.wait(symbol)
                  await MetaStore.addMetaAsAttachment(m.id, meta.id)
                  queue.end(symbol)
                })
              }
            }}
            text={t(trans.New)}
            icon={Icons.Create}
          ></Button.IconButton>
        </div>
      )
    }
    const grouped = groupBy(meta.attachments, a => a.type)
    return (
      <div ref={pasteContainerRef} className={'flex flex-col flex-1 overflow-y-auto gap-2 pt-2 px-2.5 pb-10'}>
        {Object.entries(grouped).map(g => (
          <div className={'flex flex-col'} key={g[0]}>
            <div className={'font-size-12 pl-2 transparent-font'}>{Global.utils.getTypeName(g[0])}</div>
            {g[1].map(i => (
              <AttItem
                onClick={() => {
                  setSelected(i.id)
                }}
                onRemove={() => {
                  queueTurnUnhidden({
                    metaId: i.id,
                    type: 'object'
                  })
                  MetaStore.deleteMetaObject(i.id)
                  MetaStore.updateMetaObject({ id: meta.id, attachments: meta?.attachments?.filter(o => o.id !== i.id) })
                }}
                id={i.id}
                key={i.id}
              />
            ))}
          </div>
        ))}
        <Button.IconButton
          onClick={() => {
            if (meta) {
              const queue = new Queue()
              const symbol = 1
              Global.metaOps.createObjects?.(undefined, async m => {
                await queue.wait(symbol)
                await MetaStore.addMetaAsAttachment(m.id, meta.id)
                queue.end(symbol)
              })
            }
          }}
          text={t(trans.New)}
          icon={Icons.Create}
          className={'transparent-font'}
        ></Button.IconButton>
      </div>
    )
  }
  const renderContainer = () => {
    if (selectedMeta) {
      return renderContent()
    }
    return renderAttachments()
  }
  const renderContent = () => {
    if (selectedMeta) {
      return (
        <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden' }}>
          <SidebarObjectViewer
            id={selectedMeta.id}
            pageConfig={{
              editorHeader: false,
              pdfHeader: false,
              editorAdd: false,
              messageTitle: false,
              whiteboardHeader: false,
              defaultOpenSidebar: false,
              chatHeader: false
            }}
          />
        </div>
      )
    }
  }
  return {
    renderContainer,
    attMetas,
    selected,
    setSelected,
    selectedMeta
  }
}

const AttItem = memo(({ id, onClick, onRemove }: { id: number; onClick?: VoidFunction; onRemove?: VoidFunction }) => {
  const meta = MetaStore.useValue(id)
  const { t } = useTranslation()
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
      <div className={classnames('button line-clamp-1', !meta.name && 'super-transparent-font')} onClick={onClick}>
        {meta.name || t(trans.Unnamed)}
      </div>
    </ContextMenu>
  )
})
